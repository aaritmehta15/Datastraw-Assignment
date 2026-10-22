'use client';

import { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, Volume2, Sparkles, AlertCircle, RefreshCw, VolumeX } from 'lucide-react';
import AudioVisualizer from './AudioVisualizer';
import TranscriptStream from './TranscriptStream';
import EvaluatorQuickTest from './EvaluatorQuickTest';
import PostCallModal from './PostCallModal';
import { CallTranscriptTurn, StructuredCallSummary } from '@/lib/types';

export default function CallCockpit() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [callState, setCallState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState<CallTranscriptTurn[]>([]);
  const [interimText, setInterimText] = useState('');
  const [summary, setSummary] = useState<StructuredCallSummary | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [voiceMode, setVoiceMode] = useState<'cloud-indian' | 'browser-indian'>('cloud-indian');
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const isCallActiveRef = useRef(isCallActive);
  isCallActiveRef.current = isCallActive;

  // Active call duration timer
  useEffect(() => {
    if (isCallActive) {
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCallActive]);

  // Stop any active audio (Barge-in / Ducking)
  const stopAllAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  // Get strictly female Indian / English browser voice as fallback
  const getFemaleFallbackVoice = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();

    // 1. Strict Indian English female voice
    const indianFemale = voices.find(v =>
      (v.lang.toLowerCase().includes('en-in') || v.lang.toLowerCase().includes('hi-in')) &&
      !v.name.toLowerCase().includes('david') &&
      !v.name.toLowerCase().includes('male') &&
      !v.name.toLowerCase().includes('ravi')
    );
    if (indianFemale) return indianFemale;

    // 2. Any explicit female voice
    const femaleVoice = voices.find(v =>
      v.name.toLowerCase().includes('zira') ||
      v.name.toLowerCase().includes('female') ||
      v.name.toLowerCase().includes('sita') ||
      v.name.toLowerCase().includes('swara') ||
      v.name.toLowerCase().includes('natural')
    );
    if (femaleVoice) return femaleVoice;

    // 3. Any non-male English voice
    return voices.find(v => v.lang.startsWith('en') && !v.name.toLowerCase().includes('david')) || null;
  };

  // Main Speech Synthesis Router (Cloud Indian Female Voice as Primary)
  const speakAria = (text: string, onComplete?: () => void) => {
    stopAllAudio();
    setCallState('speaking');

    if (voiceMode === 'cloud-indian') {
      // Primary: Authentic Indian English Female Neural Audio via /api/tts
      const audioUrl = `/api/tts?text=${encodeURIComponent(text)}`;
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      audio.onended = () => {
        currentAudioRef.current = null;
        if (isCallActiveRef.current) {
          setCallState('listening');
          startSpeechRecognition();
        } else {
          setCallState('idle');
        }
        if (onComplete) onComplete();
      };

      audio.onerror = (e) => {
        console.warn('Cloud TTS error, falling back to browser female voice:', e);
        speakViaBrowser(text, onComplete);
      };

      audio.play().catch((err) => {
        console.warn('Audio play was prevented or interrupted:', err);
        speakViaBrowser(text, onComplete);
      });
    } else {
      speakViaBrowser(text, onComplete);
    }
  };

  // Browser SpeechSynthesis strictly tuned for female Indian persona
  const speakViaBrowser = (text: string, onComplete?: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      if (onComplete) onComplete();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const femaleVoice = getFemaleFallbackVoice();
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }
    utterance.lang = 'en-IN';
    utterance.pitch = 1.18; // Elevated pitch for guaranteed feminine tone
    utterance.rate = 1.0;

    utterance.onend = () => {
      if (isCallActiveRef.current) {
        setCallState('listening');
        startSpeechRecognition();
      } else {
        setCallState('idle');
      }
      if (onComplete) onComplete();
    };

    utterance.onerror = () => {
      if (isCallActiveRef.current) {
        setCallState('listening');
        startSpeechRecognition();
      } else {
        setCallState('idle');
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  // Test Aria Voice Sample
  const handleTestVoice = () => {
    if (isPlayingTest) {
      stopAllAudio();
      setIsPlayingTest(false);
      setCallState('idle');
      return;
    }

    setIsPlayingTest(true);
    const sample = "Namaste! I am Aria from Aura Skincare. How can I assist you with your order today?";
    speakAria(sample, () => {
      setIsPlayingTest(false);
    });
  };

  // Start continuous speech recognition with en-IN
  const startSpeechRecognition = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not supported in this browser.');
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setHasMicPermission(true);
      };

      recognition.onspeechstart = () => {
        // True Barge-In: If Aria is speaking and user speaks, stop Aria immediately!
        stopAllAudio();
        setCallState('listening');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let finalUtterance = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalUtterance += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        setInterimText(interim);

        if (finalUtterance.trim().length > 0) {
          setInterimText('');
          processUserUtterance(finalUtterance.trim());
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          setHasMicPermission(false);
        }
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.warn('SpeechRecognition error:', event.error);
        }
      };

      recognition.onend = () => {
        // Automatically resume listening if call is still active and not speaking
        if (isCallActiveRef.current && callState !== 'speaking' && callState !== 'thinking') {
          try {
            recognition.start();
          } catch (_) {}
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Error starting speech recognition:', e);
    }
  };

  // Process customer speech turn through /api/chat
  const processUserUtterance = async (text: string) => {
    if (!text.trim()) return;

    stopAllAudio();
    setCallState('thinking');

    const userTurn: CallTranscriptTurn = {
      id: `turn-${Date.now()}-user`,
      speaker: 'customer',
      text: text,
      timestamp: new Date().toLocaleTimeString('en-IN')
    };

    const updatedTranscript = [...transcript, userTurn];
    setTranscript(updatedTranscript);

    try {
      const messages = updatedTranscript.map(t => ({
        role: t.speaker === 'customer' ? 'user' : 'assistant',
        content: t.text
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, userMessage: text })
      });

      const data = await res.json();
      const ariaReply = data.message || "I am checking your order right now.";

      const ariaTurn: CallTranscriptTurn = {
        id: `turn-${Date.now()}-aria`,
        speaker: 'aria',
        text: ariaReply,
        timestamp: new Date().toLocaleTimeString('en-IN'),
        toolCalls: data.toolCalls
      };

      setTranscript(prev => [...prev, ariaTurn]);
      speakAria(ariaReply);
    } catch (error) {
      console.error('Chat error:', error);
      const fallbackReply = "I experienced a brief connection delay. Could you please repeat that?";
      setTranscript(prev => [
        ...prev,
        {
          id: `turn-${Date.now()}-aria`,
          speaker: 'aria',
          text: fallbackReply,
          timestamp: new Date().toLocaleTimeString('en-IN')
        }
      ]);
      speakAria(fallbackReply);
    }
  };

  // Start Call
  const handleStartCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicStream(stream);
      setHasMicPermission(true);
    } catch (e) {
      console.warn('Could not access microphone directly:', e);
      setHasMicPermission(false);
    }

    setIsCallActive(true);
    setDuration(0);
    setTranscript([]);
    setSummary(null);

    const greeting = "Namaste! I am Aria from Aura Skincare. How can I assist you with your orders or skincare questions today?";
    const initialTurn: CallTranscriptTurn = {
      id: `turn-${Date.now()}-init`,
      speaker: 'aria',
      text: greeting,
      timestamp: new Date().toLocaleTimeString('en-IN')
    };
    setTranscript([initialTurn]);

    speakAria(greeting, () => {
      startSpeechRecognition();
    });
  };

  // End Call & Generate Summary
  const handleEndCall = async () => {
    setIsCallActive(false);
    setCallState('idle');

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
    }
    stopAllAudio();
    if (micStream) {
      micStream.getTracks().forEach(t => t.stop());
      setMicStream(null);
    }

    if (transcript.length > 0) {
      try {
        const res = await fetch('/api/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript, durationSeconds: duration })
        });
        const data = await res.json();
        if (data.summary) {
          setSummary(data.summary);
          setIsSummaryOpen(true);
        }
      } catch (err) {
        console.error('Error generating summary:', err);
      }
    }
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div>
      {/* Cockpit Card */}
      <div className="glass-card" style={{ maxWidth: '860px', margin: '0 auto', textAlign: 'center', padding: '36px 28px' }}>
        {/* State Badge, Voice Controls & Timer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          {/* Live State Indicator */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            borderRadius: 'var(--radius-full)',
            background: callState === 'listening' ? 'rgba(16, 185, 129, 0.15)' :
                        callState === 'thinking' ? 'rgba(245, 158, 11, 0.15)' :
                        callState === 'speaking' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${
              callState === 'listening' ? 'var(--status-listening)' :
              callState === 'thinking' ? 'var(--status-thinking)' :
              callState === 'speaking' ? 'var(--status-speaking)' : 'rgba(255, 255, 255, 0.1)'
            }`,
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.04em'
          }}>
            <span
              className={isCallActive ? 'animate-pulse-dot' : ''}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor:
                  callState === 'listening' ? 'var(--status-listening)' :
                  callState === 'thinking' ? 'var(--status-thinking)' :
                  callState === 'speaking' ? 'var(--status-speaking)' : 'var(--text-muted)'
              }}
            />
            <span>
              {callState === 'idle' && 'READY TO CONNECT'}
              {callState === 'listening' && 'LISTENING (SPEAK FREELY)'}
              {callState === 'thinking' && 'THINKING & VERIFYING DB'}
              {callState === 'speaking' && 'ARIA SPEAKING (INTERRUPTIBLE)'}
            </span>
          </div>

          {/* Voice Selector & Test Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: isCallActive ? 'var(--gold-primary)' : 'var(--text-secondary)' }}>
              ⏱️ {formatDuration(duration)}
            </span>

            <select
              value={voiceMode}
              onChange={(e) => setVoiceMode(e.target.value as any)}
              disabled={isCallActive}
              style={{
                background: 'rgba(7, 25, 18, 0.9)',
                border: '1px solid var(--gold-primary)',
                borderRadius: 'var(--radius-full)',
                color: 'var(--gold-light)',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: isCallActive ? 'not-allowed' : 'pointer',
                outline: 'none'
              }}
            >
              <option value="cloud-indian">✨ Aria (Indian Female Voice - en-IN)</option>
              <option value="browser-indian">🗣️ Local Browser Voice</option>
            </select>

            <button
              onClick={handleTestVoice}
              disabled={isCallActive}
              title="Test Aria's Indian accent"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                background: isPlayingTest ? 'var(--emerald-accent)' : 'rgba(212, 175, 55, 0.2)',
                border: '1px solid var(--gold-primary)',
                color: isPlayingTest ? '#071912' : 'var(--gold-light)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: isCallActive ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {isPlayingTest ? <VolumeX size={14} /> : <Volume2 size={14} />}
              <span>{isPlayingTest ? 'Stop Sample' : 'Test Voice'}</span>
            </button>
          </div>
        </div>

        {/* Reactive Canvas Waveform */}
        <AudioVisualizer state={callState} audioStream={micStream} />

        {/* Start / End Call Controls */}
        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
          {!isCallActive ? (
            <button
              onClick={handleStartCall}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 40px',
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                fontSize: '16px',
                fontWeight: 700,
                boxShadow: '0 8px 30px rgba(16, 185, 129, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                transition: 'all 0.2s ease'
              }}
            >
              <Phone size={20} />
              <span>Start Voice Call with Aria</span>
            </button>
          ) : (
            <button
              onClick={handleEndCall}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 40px',
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                color: '#FFFFFF',
                fontSize: '16px',
                fontWeight: 700,
                boxShadow: '0 8px 30px rgba(239, 68, 68, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                transition: 'all 0.2s ease'
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
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '16px 24px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(212, 175, 55, 0.15)',
                border: '1px solid var(--gold-primary)',
                color: 'var(--gold-light)',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              <Sparkles size={16} />
              <span>View Last JSON Summary</span>
            </button>
          )}
        </div>

        {/* Microphone Permission Warning if denied */}
        {hasMicPermission === false && (
          <div style={{
            marginTop: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#F87171',
            fontSize: '12px'
          }}>
            <AlertCircle size={14} />
            <span>Microphone access was denied. You can still test scenarios below using 1-click test chips!</span>
          </div>
        )}
      </div>

      {/* Evaluator Quick-Test Helper (1-Click Scenario Cards) */}
      <EvaluatorQuickTest
        onSelectScenario={(prompt) => {
          if (!isCallActive) {
            handleStartCall().then(() => {
              setTimeout(() => processUserUtterance(prompt), 1200);
            });
          } else {
            processUserUtterance(prompt);
          }
        }}
      />

      {/* Real-time Transcript Stream */}
      <TranscriptStream
        transcript={transcript}
        interimUserText={interimText}
        isThinking={callState === 'thinking'}
      />

      {/* Post-Call Summary Modal */}
      <PostCallModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        summary={summary}
        transcript={transcript}
      />
    </div>
  );
}
