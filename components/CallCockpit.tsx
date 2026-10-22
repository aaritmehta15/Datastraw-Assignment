'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Phone, PhoneOff, Volume2, Sparkles, AlertCircle, VolumeX, Hand } from 'lucide-react';
import AudioVisualizer from './AudioVisualizer';
import TranscriptStream from './TranscriptStream';
import EvaluatorQuickTest from './EvaluatorQuickTest';
import PostCallModal from './PostCallModal';
import { CallTranscriptTurn, StructuredCallSummary } from '@/lib/types';

// ─────────────────────────────────────────────────────────────────────────────
//  VOIP-GRADE WEB AUDIO & SPEECH ARCHITECTURE:
//
//  1. Web Audio API Context Unlocking:
//     - Instantiated & resumed (.resume()) on the very first user click
//       ("Start Voice Call" or "Test Voice").
//     - Once resumed, AudioContext stays in 'running' state indefinitely.
//     - Chrome NEVER blocks playback across async fetch() boundaries or
//       multi-turn conversation loops!
//
//  2. Pre-warmed Greeting Audio:
//     - On page load, initial greeting & sample are pre-fetched into ArrayBuffers.
//     - Clicking "Start Call" or "Test Voice" plays Aria INSTANTLY (0ms network delay).
//
//  3. Echo & Conflict Elimination:
//     - Mic is explicitly turned off while Aria speaks (zero self-transcription,
//       no acoustic echo loops).
//     - No getUserMedia + AudioContext contention with SpeechRecognition.
//       SpeechRecognition gets 100% exclusive access to the microphone.
//     - 350ms acoustic settle window before microphone re-opens.
//     - One-click or Spacebar barge-in to interrupt Aria at any time.
// ─────────────────────────────────────────────────────────────────────────────

type CallState = 'idle' | 'listening' | 'thinking' | 'speaking';

const GREETING_TEXT = 'Namaste! I am Aria from Aura Skincare. How can I help you with your orders or skincare questions today?';
const TEST_SAMPLE_TEXT = 'Namaste! I am Aria from Aura Skincare. How can I assist you with your order today?';

export default function CallCockpit() {
  // ── State ─────────────────────────────────────────────────────────────────
  const [isCallActive, setIsCallActive] = useState(false);
  const [callState, setCallState] = useState<CallState>('idle');
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState<CallTranscriptTurn[]>([]);
  const [interimText, setInterimText] = useState('');
  const [summary, setSummary] = useState<StructuredCallSummary | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  // ── Refs (synchronous, immune to stale closure issues) ─────────────────────
  const isCallActiveRef = useRef(false);
  const callStateRef = useRef<CallState>('idle');
  const shouldBeListeningRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const greetingBufferRef = useRef<ArrayBuffer | null>(null);
  const testSampleBufferRef = useRef<ArrayBuffer | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef<CallTranscriptTurn[]>([]);

  // Sync helper
  const syncCallState = useCallback((s: CallState) => {
    callStateRef.current = s;
    setCallState(s);
  }, []);

  // ── Pre-warm Audio on Mount (instant first-click playback) ─────────────────
  useEffect(() => {
    fetch(`/api/tts?text=${encodeURIComponent(GREETING_TEXT)}`)
      .then(res => res.ok ? res.arrayBuffer() : null)
      .then(buf => { if (buf) greetingBufferRef.current = buf; })
      .catch(() => {});

    fetch(`/api/tts?text=${encodeURIComponent(TEST_SAMPLE_TEXT)}`)
      .then(res => res.ok ? res.arrayBuffer() : null)
      .then(buf => { if (buf) testSampleBufferRef.current = buf; })
      .catch(() => {});
  }, []);

  // ── Call Duration Timer ───────────────────────────────────────────────────
  useEffect(() => {
    if (isCallActive) {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isCallActive]);

  // ── Unlock AudioContext on User Gesture ───────────────────────────────────
  const getUnlockedAudioContext = useCallback(async (): Promise<AudioContext | null> => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return null;
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioCtx();
      }
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      return audioContextRef.current;
    } catch (err) {
      console.warn('[AudioContext] init/resume error:', err);
      return null;
    }
  }, []);

  // ── Stop All Audio Playback ───────────────────────────────────────────────
  const stopAllAudio = useCallback(() => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.onended = null;
        currentSourceRef.current.stop();
        currentSourceRef.current.disconnect();
      } catch (_) {}
      currentSourceRef.current = null;
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  //  SPEECH RECOGNITION (en-IN)
  //  Exclusive mic hardware access — no getUserMedia collisions!
  // ═══════════════════════════════════════════════════════════════════════════
  const startListening = useCallback(() => {
    if (!isCallActiveRef.current || !shouldBeListeningRef.current) return;
    if (currentSourceRef.current) return; // Aria speaking

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      console.warn('[Mic] SpeechRecognition not supported in this browser');
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
      recognitionRef.current = null;
    }

    try {
      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-IN';

      rec.onstart = () => {
        setHasMicPermission(true);
        syncCallState('listening');
      };

      rec.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const txt = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += txt;
          } else {
            interim += txt;
          }
        }

        setInterimText(interim);

        if (final.trim()) {
          setInterimText('');
          processUserUtterance(final.trim());
        }
      };

      rec.onerror = (e: any) => {
        if (e.error === 'not-allowed') {
          setHasMicPermission(false);
        }
        if (!['no-speech', 'aborted'].includes(e.error)) {
          console.warn('[Mic] recognition error:', e.error);
        }
      };

      rec.onend = () => {
        if (isCallActiveRef.current && shouldBeListeningRef.current && callStateRef.current === 'listening') {
          setTimeout(() => {
            if (isCallActiveRef.current && shouldBeListeningRef.current) {
              try { rec.start(); } catch (_) {}
            }
          }, 200);
        }
      };

      rec.start();
      recognitionRef.current = rec;
    } catch (err) {
      console.warn('[Mic] startListening exception:', err);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncCallState]);

  // ═══════════════════════════════════════════════════════════════════════════
  //  PLAY ARIA AUDIO (Web Audio API BufferSource — never blocked by autoplay)
  // ═══════════════════════════════════════════════════════════════════════════
  const playAriaAudio = useCallback(async (text: string, onComplete?: () => void) => {
    // 1. Mute microphone immediately — prevents acoustic echo loops & self-transcription
    shouldBeListeningRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
      recognitionRef.current = null;
    }

    // 2. Stop any current sound
    stopAllAudio();
    syncCallState('speaking');

    try {
      const ctx = await getUnlockedAudioContext();
      if (!ctx) throw new Error('AudioContext not available');

      // Check pre-warmed cache for instant start
      const isGreeting = text.includes('orders or skincare questions today');
      const isTestSample = text.includes('assist you with your order today');

      let arrayBuffer: ArrayBuffer | null = null;
      if (isGreeting && greetingBufferRef.current) {
        arrayBuffer = greetingBufferRef.current.slice(0);
      } else if (isTestSample && testSampleBufferRef.current) {
        arrayBuffer = testSampleBufferRef.current.slice(0);
      } else {
        const res = await fetch(`/api/tts?text=${encodeURIComponent(text)}`);
        if (!res.ok) throw new Error(`TTS server HTTP ${res.status}`);
        arrayBuffer = await res.arrayBuffer();
      }

      // Decode MP3 audio into AudioBuffer
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      currentSourceRef.current = source;

      source.onended = () => {
        currentSourceRef.current = null;
        if (onComplete) onComplete();

        if (isCallActiveRef.current) {
          // Acoustic settle window (350ms) to ensure speakers are silent before mic opens
          setTimeout(() => {
            if (isCallActiveRef.current) {
              shouldBeListeningRef.current = true;
              startListening();
            }
          }, 350);
        } else {
          syncCallState('idle');
        }
      };

      source.start(0);
    } catch (err: any) {
      console.warn('[Voice] playAriaAudio error:', err?.message);
      currentSourceRef.current = null;
      if (onComplete) onComplete();

      if (isCallActiveRef.current) {
        setTimeout(() => {
          if (isCallActiveRef.current) {
            shouldBeListeningRef.current = true;
            startListening();
          }
        }, 350);
      } else {
        syncCallState('idle');
      }
    }
  }, [stopAllAudio, syncCallState, getUnlockedAudioContext, startListening]);

  // ═══════════════════════════════════════════════════════════════════════════
  //  BARGE-IN / INTERRUPT ARIA
  // ═══════════════════════════════════════════════════════════════════════════
  const handleInterrupt = useCallback(() => {
    if (callStateRef.current === 'speaking') {
      stopAllAudio();
      if (isCallActiveRef.current) {
        shouldBeListeningRef.current = true;
        syncCallState('listening');
        startListening();
      }
    }
  }, [stopAllAudio, syncCallState, startListening]);

  // Keyboard shortcut: Spacebar to interrupt while speaking
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && callStateRef.current === 'speaking' && isCallActiveRef.current) {
        e.preventDefault();
        handleInterrupt();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInterrupt]);

  // ═══════════════════════════════════════════════════════════════════════════
  //  PROCESS USER SPEECH → LLM → ARIA SPEAKS
  // ═══════════════════════════════════════════════════════════════════════════
  const processUserUtterance = useCallback(async (text: string) => {
    if (!text.trim()) return;

    shouldBeListeningRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
      recognitionRef.current = null;
    }
    stopAllAudio();
    syncCallState('thinking');

    const userTurn: CallTranscriptTurn = {
      id: `turn-${Date.now()}-user`,
      speaker: 'customer',
      text,
      timestamp: new Date().toLocaleTimeString('en-IN'),
    };

    const nextT = [...transcriptRef.current, userTurn];
    transcriptRef.current = nextT;
    setTranscript(nextT);

    try {
      const messages = nextT.map(t => ({
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

      const withAria = [...nextT, ariaTurn];
      transcriptRef.current = withAria;
      setTranscript(withAria);
      playAriaAudio(reply);
    } catch (err) {
      console.error('[Chat] API error:', err);
      const fallback = 'I experienced a brief connection delay. Could you please repeat that?';
      const fallTurn: CallTranscriptTurn = {
        id: `turn-${Date.now()}-aria`,
        speaker: 'aria',
        text: fallback,
        timestamp: new Date().toLocaleTimeString('en-IN'),
      };
      const withFall = [...nextT, fallTurn];
      transcriptRef.current = withFall;
      setTranscript(withFall);
      playAriaAudio(fallback);
    }
  }, [stopAllAudio, syncCallState, playAriaAudio]);

  // ═══════════════════════════════════════════════════════════════════════════
  //  START CALL (unlocks audio context on click, plays greeting instantly)
  // ═══════════════════════════════════════════════════════════════════════════
  const handleStartCall = useCallback(async () => {
    stopAllAudio();
    setIsPlayingTest(false);

    // CRITICAL: Unlock AudioContext synchronously inside user click
    await getUnlockedAudioContext();

    isCallActiveRef.current = true;
    setIsCallActive(true);
    setDuration(0);
    setInterimText('');
    setSummary(null);

    const greeting = GREETING_TEXT;
    const turn: CallTranscriptTurn = {
      id: `turn-${Date.now()}-init`,
      speaker: 'aria',
      text: greeting,
      timestamp: new Date().toLocaleTimeString('en-IN'),
    };
    transcriptRef.current = [turn];
    setTranscript([turn]);

    playAriaAudio(greeting);
  }, [stopAllAudio, getUnlockedAudioContext, playAriaAudio]);

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
    syncCallState('idle');
    setInterimText('');

    const snap = transcriptRef.current;
    if (snap.length > 1) {
      try {
        const res = await fetch('/api/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: snap, durationSeconds: duration }),
        });
        const data = await res.json();
        if (data.summary) {
          setSummary(data.summary);
          setIsSummaryOpen(true);
        }
      } catch (err) {
        console.error('[Summary] error:', err);
      }
    }
  }, [stopAllAudio, syncCallState, duration]);

  // ═══════════════════════════════════════════════════════════════════════════
  //  TEST VOICE (instant sample playback)
  // ═══════════════════════════════════════════════════════════════════════════
  const handleTestVoice = useCallback(async () => {
    if (isPlayingTest) {
      stopAllAudio();
      setIsPlayingTest(false);
      syncCallState('idle');
      return;
    }
    stopAllAudio();
    setIsPlayingTest(true);
    isCallActiveRef.current = false; // don't start mic after sample

    // CRITICAL: Unlock AudioContext inside user click
    await getUnlockedAudioContext();

    playAriaAudio(TEST_SAMPLE_TEXT, () => {
      setIsPlayingTest(false);
      syncCallState('idle');
    });
  }, [isPlayingTest, stopAllAudio, syncCallState, getUnlockedAudioContext, playAriaAudio]);

  // ── Format helper ─────────────────────────────────────────────────────────
  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div>
      <div className="glass-card" style={{ maxWidth: '860px', margin: '0 auto', textAlign: 'center', padding: '36px 28px' }}>

        {/* State badge + controls header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>

          {/* Live state pill */}
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
              {callState === 'speaking' && '🔊 ARIA SPEAKING'}
            </span>
          </div>

          {/* Timer + voice badge + test button */}
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

        {/* Waveform */}
        <AudioVisualizer state={callState} />

        {/* Interrupt button (visible while Aria speaks during a call) */}
        {callState === 'speaking' && isCallActive && (
          <div style={{ marginTop: '16px' }}>
            <button
              onClick={handleInterrupt}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 20px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(167, 139, 250, 0.25)',
                border: '1px solid #A78BFA',
                color: '#EDE9FE',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(167, 139, 250, 0.3)',
                transition: 'all 0.2s ease',
              }}
            >
              <Hand size={15} />
              <span>Tap to Interrupt Aria (or press Space)</span>
            </button>
          </div>
        )}

        {/* Call buttons */}
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

        {/* Mic warning */}
        {hasMicPermission === false && (
          <div style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#F87171', fontSize: '12px' }}>
            <AlertCircle size={14} />
            <span>Microphone access denied. Please allow microphone permissions in your browser or use the quick-test chips below.</span>
          </div>
        )}
      </div>

      {/* Quick-test chips */}
      <EvaluatorQuickTest
        onSelectScenario={(prompt) => {
          if (!isCallActive) {
            handleStartCall();
            setTimeout(() => processUserUtterance(prompt), 1500);
          } else {
            processUserUtterance(prompt);
          }
        }}
      />

      {/* Transcript */}
      <TranscriptStream
        transcript={transcript}
        interimUserText={interimText}
        isThinking={callState === 'thinking'}
      />

      {/* Summary modal */}
      <PostCallModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        summary={summary}
        transcript={transcript}
      />
    </div>
  );
}
