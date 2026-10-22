'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Phone, PhoneOff, Volume2, Sparkles, AlertCircle, VolumeX } from 'lucide-react';
import AudioVisualizer from './AudioVisualizer';
import TranscriptStream from './TranscriptStream';
import EvaluatorQuickTest from './EvaluatorQuickTest';
import PostCallModal from './PostCallModal';
import { CallTranscriptTurn, StructuredCallSummary } from '@/lib/types';

// ─────────────────────────────────────────────────────────────────────────────
//  VOICE FLOW (mouth → ear):
//
//  USER speaks → [Mic] → SpeechRecognition (en-IN) → onresult (final)
//    → stopAllAudio()                          ← barge-in: stop Aria immediately
//    → setCallState('thinking')
//    → POST /api/chat                          ← Groq LLM + tool calling
//    → setCallState('speaking')
//    → GET /api/tts?text=...                   ← MsEdgeTTS en-IN-NeerjaNeural
//    → audio.play()                            ← browser <Audio> plays MP3
//    → audio.onended
//    → setTimeout(400ms)                       ← Chrome audio hardware settle
//    → recognition.start()                     ← mic back ON
//    → setCallState('listening')
//
//  Barge-in: if user speaks while Aria speaks →
//    SpeechRecognition.onresult (interim ≥ 4 chars)
//    → stopAllAudio() → callState = 'listening'
// ─────────────────────────────────────────────────────────────────────────────

type CallState = 'idle' | 'listening' | 'thinking' | 'speaking';

export default function CallCockpit() {
  // ── UI State ──────────────────────────────────────────────────────────────
  const [isCallActive, setIsCallActive] = useState(false);
  const [callState, setCallState] = useState<CallState>('idle');
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState<CallTranscriptTurn[]>([]);
  const [interimText, setInterimText] = useState('');
  const [summary, setSummary] = useState<StructuredCallSummary | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  // ── Refs (never cause re-renders; safe to read inside callbacks) ──────────
  const isCallActiveRef = useRef(false);        // tracks call active without stale closure
  const callStateRef = useRef<CallState>('idle'); // sync mirror of callState
  const recognitionRef = useRef<any>(null);       // SpeechRecognition instance
  const currentAudioRef = useRef<HTMLAudioElement | null>(null); // playing <audio>
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const shouldBeListeningRef = useRef(false);     // master flag: should mic be on?
  const transcriptRef = useRef<CallTranscriptTurn[]>([]); // sync mirror of transcript
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);   // cached browser voices

  // Keep refs in sync with state
  const syncSetCallState = useCallback((s: CallState) => {
    callStateRef.current = s;
    setCallState(s);
  }, []);

  // ── Voice pre-cache ───────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const load = () => {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length > 0) voicesRef.current = v;
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
  }, []);

  // ── Call duration timer ───────────────────────────────────────────────────
  useEffect(() => {
    if (isCallActive) {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isCallActive]);

  // ═══════════════════════════════════════════════════════════════════════════
  //  STEP 1 — STOP AUDIO (instant)
  // ═══════════════════════════════════════════════════════════════════════════
  const stopAllAudio = useCallback(() => {
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.src = '';  // forces release on Chrome
      } catch (_) {}
      currentAudioRef.current = null;
    }
    try { window.speechSynthesis?.cancel(); } catch (_) {}
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  //  STEP 2 — START MIC (with 400ms settle window after audio ends)
  // ═══════════════════════════════════════════════════════════════════════════
  const startListening = useCallback(() => {
    if (!isCallActiveRef.current) return;
    if (!shouldBeListeningRef.current) return;

    // Do not start if audio is still playing (hardware lock)
    if (currentAudioRef.current && !currentAudioRef.current.paused) return;

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      console.warn('[Voice] SpeechRecognition not supported in this browser');
      return;
    }

    // Abort any stale instance first
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
      recognitionRef.current = null;
    }

    try {
      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-IN';
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        setHasMicPermission(true);
        syncSetCallState('listening');
      };

      // ── BARGE-IN: user speaks while Aria is talking ──
      rec.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) final += t;
          else interim += t;
        }

        // Barge-in trigger: real words detected while Aria speaks
        if (callStateRef.current === 'speaking' && (interim.trim().length >= 4 || final.trim().length > 0)) {
          stopAllAudio();
          syncSetCallState('listening');
        }

        setInterimText(interim);

        if (final.trim().length > 0) {
          setInterimText('');
          processUserUtterance(final.trim());
        }
      };

      rec.onerror = (e: any) => {
        if (e.error === 'not-allowed') setHasMicPermission(false);
        // 'no-speech', 'aborted', 'network' are non-fatal
        if (e.error !== 'no-speech' && e.error !== 'aborted') {
          console.warn('[Voice] SpeechRecognition error:', e.error);
        }
      };

      // Auto-restart if call is still active and mic should be on
      rec.onend = () => {
        if (isCallActiveRef.current && shouldBeListeningRef.current && callStateRef.current === 'listening') {
          setTimeout(() => {
            if (isCallActiveRef.current && shouldBeListeningRef.current) {
              try { rec.start(); } catch (_) {}
            }
          }, 300);
        }
      };

      rec.start();
      recognitionRef.current = rec;
    } catch (err) {
      console.warn('[Voice] Failed to start recognition:', err);
    }
  }, [stopAllAudio, syncSetCallState]);

  // ═══════════════════════════════════════════════════════════════════════════
  //  STEP 3 — SPEAK via /api/tts (en-IN-NeerjaNeural neural voice)
  //  Flow: fetch blob → ObjectURL → <Audio>.play() → onended → settle → mic
  // ═══════════════════════════════════════════════════════════════════════════
  const speakAria = useCallback((text: string, onComplete?: () => void) => {
    // Stop mic and any current audio first
    shouldBeListeningRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
      recognitionRef.current = null;
    }
    stopAllAudio();
    syncSetCallState('speaking');

    const url = `/api/tts?text=${encodeURIComponent(text)}`;
    const audio = new Audio();
    currentAudioRef.current = audio;

    let settled = false;
    const afterAudio = () => {
      if (settled) return;
      settled = true;
      currentAudioRef.current = null;

      if (onComplete) onComplete();

      if (isCallActiveRef.current) {
        // 400ms settle window: Chrome audio hardware needs to release
        setTimeout(() => {
          if (isCallActiveRef.current) {
            shouldBeListeningRef.current = true;
            startListening();
          }
        }, 400);
      } else {
        syncSetCallState('idle');
      }
    };

    audio.onended = afterAudio;

    audio.onerror = () => {
      console.warn('[Voice] /api/tts audio failed, using browser fallback');
      currentAudioRef.current = null;
      speakViaBrowser(text, onComplete);
    };

    // Fetch as blob first → ObjectURL → play (avoids src streaming issues)
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`TTS HTTP ${res.status}`);
        return res.blob();
      })
      .then(blob => {
        const objUrl = URL.createObjectURL(blob);
        audio.src = objUrl;
        audio.volume = 1.0;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            if (err.name === 'AbortError') return; // user navigated away
            console.warn('[Voice] audio.play() blocked:', err.name, '— using browser fallback');
            URL.revokeObjectURL(objUrl);
            speakViaBrowser(text, onComplete);
          });
        }
        // Clean up ObjectURL after audio ends to avoid memory leak
        audio.addEventListener('ended', () => URL.revokeObjectURL(objUrl), { once: true });
      })
      .catch(err => {
        console.warn('[Voice] TTS fetch failed:', err, '— using browser fallback');
        speakViaBrowser(text, onComplete);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopAllAudio, syncSetCallState, startListening]);

  // ── Browser SpeechSynthesis fallback (female Indian voice) ────────────────
  const speakViaBrowser = useCallback((text: string, onComplete?: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      if (onComplete) onComplete();
      return;
    }
    try {
      window.speechSynthesis.cancel();
      setTimeout(() => {
        const utt = new SpeechSynthesisUtterance(text);
        const voices = voicesRef.current.length > 0 ? voicesRef.current : window.speechSynthesis.getVoices();
        const pick =
          voices.find(v => v.lang.includes('en-IN') && (v.name.includes('Heera') || v.name.includes('Neerja'))) ||
          voices.find(v => v.lang.includes('en-IN')) ||
          voices.find(v => v.name.toLowerCase().includes('zira'));
        if (pick) utt.voice = pick;
        utt.lang = 'en-IN';
        utt.pitch = 1.05;
        utt.rate = 1.0;
        utt.onend = utt.onerror = () => {
          if (onComplete) onComplete();
          if (isCallActiveRef.current) {
            setTimeout(() => {
              shouldBeListeningRef.current = true;
              startListening();
            }, 400);
          } else {
            syncSetCallState('idle');
          }
        };
        window.speechSynthesis.speak(utt);
      }, 80);
    } catch (_) { if (onComplete) onComplete(); }
  }, [startListening, syncSetCallState]);

  // ═══════════════════════════════════════════════════════════════════════════
  //  STEP 4 — PROCESS USER SPEECH → LLM → ARIA SPEAKS
  // ═══════════════════════════════════════════════════════════════════════════
  const processUserUtterance = useCallback(async (text: string) => {
    if (!text.trim()) return;

    shouldBeListeningRef.current = false;
    stopAllAudio();
    syncSetCallState('thinking');

    const userTurn: CallTranscriptTurn = {
      id: `turn-${Date.now()}-user`,
      speaker: 'customer',
      text,
      timestamp: new Date().toLocaleTimeString('en-IN'),
    };

    const nextTranscript = [...transcriptRef.current, userTurn];
    transcriptRef.current = nextTranscript;
    setTranscript(nextTranscript);

    try {
      const messages = nextTranscript.map(t => ({
        role: t.speaker === 'customer' ? 'user' : 'assistant',
        content: t.text,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, userMessage: text }),
      });

      const data = await res.json();
      const reply = data.message || 'I am checking that for you right now.';

      const ariaTurn: CallTranscriptTurn = {
        id: `turn-${Date.now()}-aria`,
        speaker: 'aria',
        text: reply,
        timestamp: new Date().toLocaleTimeString('en-IN'),
        toolCalls: data.toolCalls,
      };

      const withAria = [...nextTranscript, ariaTurn];
      transcriptRef.current = withAria;
      setTranscript(withAria);

      speakAria(reply);
    } catch (err) {
      console.error('[Voice] Chat API error:', err);
      const fallback = 'I experienced a brief connection delay. Could you please repeat that?';
      const fallTurn: CallTranscriptTurn = {
        id: `turn-${Date.now()}-aria`,
        speaker: 'aria',
        text: fallback,
        timestamp: new Date().toLocaleTimeString('en-IN'),
      };
      const withFall = [...nextTranscript, fallTurn];
      transcriptRef.current = withFall;
      setTranscript(withFall);
      speakAria(fallback);
    }
  }, [stopAllAudio, syncSetCallState, speakAria]);

  // ═══════════════════════════════════════════════════════════════════════════
  //  START CALL (must remain synchronous — preserves browser user-gesture token)
  // ═══════════════════════════════════════════════════════════════════════════
  const handleStartCall = useCallback(() => {
    stopAllAudio();
    setIsPlayingTest(false);

    isCallActiveRef.current = true;
    setIsCallActive(true);
    setDuration(0);
    setInterimText('');
    setSummary(null);

    const greeting = 'Namaste! I am Aria from Aura Skincare. How can I help with your orders or skincare questions today?';
    const firstTurn: CallTranscriptTurn = {
      id: `turn-${Date.now()}-init`,
      speaker: 'aria',
      text: greeting,
      timestamp: new Date().toLocaleTimeString('en-IN'),
    };
    transcriptRef.current = [firstTurn];
    setTranscript([firstTurn]);

    // Request mic in background (getUserMedia must NOT block speakAria)
    navigator.mediaDevices?.getUserMedia({ audio: true })
      .then(stream => { setMicStream(stream); setHasMicPermission(true); })
      .catch(() => setHasMicPermission(false));

    // Play greeting — audio.play() must be called inside same call stack as click
    speakAria(greeting);
  }, [stopAllAudio, speakAria]);

  // ═══════════════════════════════════════════════════════════════════════════
  //  END CALL
  // ═══════════════════════════════════════════════════════════════════════════
  const handleEndCall = useCallback(async () => {
    isCallActiveRef.current = false;
    shouldBeListeningRef.current = false;

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
      recognitionRef.current = null;
    }
    stopAllAudio();
    setIsCallActive(false);
    syncSetCallState('idle');
    setInterimText('');

    micStream?.getTracks().forEach(t => t.stop());
    setMicStream(null);

    const snap = transcriptRef.current;
    if (snap.length > 1) {
      try {
        const res = await fetch('/api/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: snap, durationSeconds: duration }),
        });
        const data = await res.json();
        if (data.summary) { setSummary(data.summary); setIsSummaryOpen(true); }
      } catch (err) {
        console.error('[Voice] Summary error:', err);
      }
    }
  }, [stopAllAudio, syncSetCallState, micStream, duration]);

  // ═══════════════════════════════════════════════════════════════════════════
  //  TEST VOICE (outside call)
  // ═══════════════════════════════════════════════════════════════════════════
  const handleTestVoice = useCallback(() => {
    if (isPlayingTest) {
      stopAllAudio();
      setIsPlayingTest(false);
      syncSetCallState('idle');
      return;
    }
    stopAllAudio();
    setIsPlayingTest(true);
    // Ensure isCallActiveRef is false so speakAria doesn't try to restart mic
    isCallActiveRef.current = false;
    speakAria('Namaste! I am Aria from Aura Skincare. How can I assist you with your order today?', () => {
      setIsPlayingTest(false);
      syncSetCallState('idle');
    });
  }, [isPlayingTest, stopAllAudio, syncSetCallState, speakAria]);

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div>
      {/* ── Cockpit Card ─────────────────────────────────────────────────── */}
      <div className="glass-card" style={{ maxWidth: '860px', margin: '0 auto', textAlign: 'center', padding: '36px 28px' }}>

        {/* Header row: state badge + controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>

          {/* Live state indicator pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '8px 18px', borderRadius: 'var(--radius-full)',
            background: callState === 'listening' ? 'rgba(16,185,129,0.15)'
              : callState === 'thinking' ? 'rgba(245,158,11,0.15)'
              : callState === 'speaking' ? 'rgba(139,92,246,0.15)'
              : 'rgba(255,255,255,0.05)',
            border: `1px solid ${callState === 'listening' ? 'var(--status-listening)'
              : callState === 'thinking' ? 'var(--status-thinking)'
              : callState === 'speaking' ? 'var(--status-speaking)'
              : 'rgba(255,255,255,0.1)'}`,
            color: '#FFF', fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em',
          }}>
            <span
              className={isCallActive ? 'animate-pulse-dot' : ''}
              style={{
                width: '10px', height: '10px', borderRadius: '50%',
                backgroundColor: callState === 'listening' ? 'var(--status-listening)'
                  : callState === 'thinking' ? 'var(--status-thinking)'
                  : callState === 'speaking' ? 'var(--status-speaking)'
                  : 'var(--text-muted)',
              }}
            />
            <span>
              {callState === 'idle' && 'READY TO CONNECT'}
              {callState === 'listening' && '🎤 LISTENING — SPEAK FREELY'}
              {callState === 'thinking' && '⚡ THINKING & VERIFYING DB'}
              {callState === 'speaking' && '🔊 ARIA SPEAKING (INTERRUPT ANYTIME)'}
            </span>
          </div>

          {/* Timer + voice label + test button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: isCallActive ? 'var(--gold-primary)' : 'var(--text-secondary)' }}>
              ⏱️ {fmt(duration)}
            </span>

            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', borderRadius: 'var(--radius-full)',
              background: 'rgba(212,175,55,0.12)', border: '1px solid var(--gold-primary)',
              fontSize: '12px', color: 'var(--gold-light)', fontWeight: 600,
            }}>
              <span>🇮🇳 Aria · NeerjaNeural (en-IN)</span>
            </div>

            <button
              id="test-voice-btn"
              onClick={handleTestVoice}
              disabled={isCallActive}
              title="Test Aria's Indian accent"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px', borderRadius: 'var(--radius-full)',
                background: isPlayingTest ? 'var(--emerald-accent)' : 'rgba(212,175,55,0.25)',
                border: '1px solid var(--gold-primary)',
                color: isPlayingTest ? '#071912' : '#FFF',
                fontSize: '12px', fontWeight: 700,
                cursor: isCallActive ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: isCallActive ? 0.5 : 1,
              }}
            >
              {isPlayingTest ? <VolumeX size={14} /> : <Volume2 size={14} />}
              <span>{isPlayingTest ? 'Stop Sample' : '🔊 Test Voice'}</span>
            </button>
          </div>
        </div>

        {/* Waveform visualizer */}
        <AudioVisualizer state={callState} audioStream={micStream} />

        {/* Start / End call buttons */}
        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          {!isCallActive ? (
            <button
              id="start-call-btn"
              onClick={handleStartCall}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '12px',
                padding: '16px 40px', borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg,#10B981 0%,#059669 100%)',
                color: '#FFF', fontSize: '16px', fontWeight: 700,
                boxShadow: '0 8px 30px rgba(16,185,129,0.4)',
                border: '1px solid rgba(255,255,255,0.2)',
                cursor: 'pointer', transition: 'all 0.2s ease',
              }}
            >
              <Phone size={20} />
              <span>Start Voice Call with Aria</span>
            </button>
          ) : (
            <button
              id="end-call-btn"
              onClick={handleEndCall}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '12px',
                padding: '16px 40px', borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg,#EF4444 0%,#DC2626 100%)',
                color: '#FFF', fontSize: '16px', fontWeight: 700,
                boxShadow: '0 8px 30px rgba(239,68,68,0.4)',
                border: '1px solid rgba(255,255,255,0.2)',
                cursor: 'pointer', transition: 'all 0.2s ease',
              }}
            >
              <PhoneOff size={20} />
              <span>End Call & Generate Summary</span>
            </button>
          )}

          {summary && !isCallActive && (
            <button
              onClick={() => setIsSummaryOpen(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '16px 24px', borderRadius: 'var(--radius-full)',
                background: 'rgba(212,175,55,0.15)', border: '1px solid var(--gold-primary)',
                color: 'var(--gold-light)', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Sparkles size={16} />
              <span>View Call JSON Summary</span>
            </button>
          )}
        </div>

        {/* Mic permission warning */}
        {hasMicPermission === false && (
          <div style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#F87171', fontSize: '12px' }}>
            <AlertCircle size={14} />
            <span>Microphone access denied. Use the quick-test chips below to evaluate without a mic.</span>
          </div>
        )}
      </div>

      {/* Evaluator quick-test chips */}
      <EvaluatorQuickTest
        onSelectScenario={(prompt) => {
          if (!isCallActive) {
            handleStartCall();
            // Give Aria's greeting 1.2s then inject the test prompt
            setTimeout(() => processUserUtterance(prompt), 1200);
          } else {
            processUserUtterance(prompt);
          }
        }}
      />

      {/* Live transcript */}
      <TranscriptStream
        transcript={transcript}
        interimUserText={interimText}
        isThinking={callState === 'thinking'}
      />

      {/* Post-call summary modal */}
      <PostCallModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        summary={summary}
        transcript={transcript}
      />
    </div>
  );
}
