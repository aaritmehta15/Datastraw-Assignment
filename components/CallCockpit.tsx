'use client';

import { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, Volume2, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
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
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('Neural Indian Voice');

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
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

  // Find optimal Indian English voice
  const getIndianVoice = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();

    // 1. Try Indian English neural voices
    const inVoice = voices.find(v =>
      (v.lang.toLowerCase().includes('en-in') || v.lang.toLowerCase().includes('hi-in')) &&
      (v.name.toLowerCase().includes('neerja') || v.name.toLowerCase().includes('heera') || v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('india'))
    );
    if (inVoice) return inVoice;

    // 2. Generic en-IN
    const genericIn = voices.find(v => v.lang.toLowerCase().includes('en-in'));
    if (genericIn) return genericIn;

    // 3. Any English voice
    return voices.find(v => v.lang.startsWith('en')) || voices[0] || null;
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const updateVoices = () => {
        const v = getIndianVoice();
        if (v) setSelectedVoiceName(`${v.name} (${v.lang})`);
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Speak text with Indian persona and Barge-In handling
  const speakAria = (text: string, onComplete?: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      if (onComplete) onComplete();
      return;
    }

    // Cancel any ongoing speech (Barge-in / ducking)
    window.speechSynthesis.cancel();

    setCallState('speaking');

    const utterance = new SpeechSynthesisUtterance(text);
    const indianVoice = getIndianVoice();
    if (indianVoice) {
      utterance.voice = indianVoice;
    }
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    utterance.lang = 'en-IN';

    utterance.onend = () => {
      if (isCallActiveRef.current) {
        setCallState('listening');
        startSpeechRecognition();
      } else {
        setCallState('idle');
      }
      if (onComplete) onComplete();
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      if (isCallActiveRef.current) {
        setCallState('listening');
        startSpeechRecognition();
      } else {
        setCallState('idle');
      }
    };

    window.speechSynthesis.speak(utterance);
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
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
          setCallState('listening');
        }
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

    // Interrupt any remaining speech
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setCallState('thinking');

    // Add user turn to transcript
    const userTurn: CallTranscriptTurn = {
      id: `turn-${Date.now()}-user`,
      speaker: 'customer',
      text: text,
      timestamp: new Date().toLocaleTimeString('en-IN')
    };

    const updatedTranscript = [...transcript, userTurn];
    setTranscript(updatedTranscript);

    try {
      // Build message array for API
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

      // Speak response through Indian voice
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

    // Initial greeting from Aria
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
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (micStream) {
      micStream.getTracks().forEach(t => t.stop());
      setMicStream(null);
    }

    // Call summary endpoint
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
        {/* State Badge & Call Timer */}
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

          {/* Timer and Voice Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: isCallActive ? 'var(--gold-primary)' : 'inherit' }}>
              ⏱️ {formatDuration(duration)}
            </span>
            <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: 'var(--radius-full)', background: 'rgba(212, 175, 55, 0.1)', color: 'var(--gold-light)' }}>
              🗣️ {selectedVoiceName}
            </span>
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
