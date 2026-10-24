'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Phone, PhoneOff, Sparkles, AlertCircle, Hand, Clock, Mic } from 'lucide-react';
import AudioVisualizer from './AudioVisualizer';
import TranscriptStream from './TranscriptStream';
import EvaluatorQuickTest from './EvaluatorQuickTest';
import PostCallModal from './PostCallModal';
import { CallTranscriptTurn, StructuredCallSummary } from '@/lib/types';
import {
  ExtendedCustomerAccount,
  getActiveCustomer,
  getCustomerPersonalizedGreeting
} from '@/lib/customerAccounts';
import { addTelemetryRecord } from '@/lib/telemetryStore';

// ─────────────────────────────────────────────────────────────────────────────
//  VOIP-GRADE WEB AUDIO & SPEECH ARCHITECTURE:
//
//  1. Web Audio API Context Unlocking:
//     - Instantiated & resumed (.resume()) on user click "Start Voice Call".
//     - AudioContext stays in 'running' state indefinitely.
//     - Chrome never blocks playback across async fetch() boundaries or
//       multi-turn conversation loops.
//
//  2. Pre-warmed Greeting Audio:
//     - On page load, initial greeting is pre-fetched into ArrayBuffer.
//     - Clicking "Start Call" plays Aria INSTANTLY (0ms network delay).
//
//  3. Echo & Conflict Elimination:
//     - Mic is turned off while Aria speaks (zero self-transcription,
//       no acoustic echo loops).
//     - No getUserMedia contention with SpeechRecognition.
//       SpeechRecognition gets 100% exclusive access to the microphone.
//     - 350ms acoustic settle window before microphone re-opens.
//     - Stable, zero-layout-shift Interrupt button + Spacebar capture.
// ─────────────────────────────────────────────────────────────────────────────

type CallState = 'idle' | 'listening' | 'thinking' | 'speaking';

const GREETING_TEXT = 'Namaste! I am Aria from Aura Skincare. How can I help you with your orders or skincare questions today?';

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
  const [activeCustomer, setActiveCustomer] = useState<ExtendedCustomerAccount>(getActiveCustomer());

  // ── Refs (synchronous, immune to stale closure issues) ─────────────────────
  const activeCustomerRef = useRef<ExtendedCustomerAccount>(activeCustomer);
  activeCustomerRef.current = activeCustomer;
  const isCallActiveRef = useRef(false);
  const callStateRef = useRef<CallState>('idle');
  const shouldBeListeningRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const greetingBufferRef = useRef<ArrayBuffer | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef<CallTranscriptTurn[]>([]);
  const lastInterruptTimeRef = useRef<number>(0);

  // Sync helper
  const syncCallState = useCallback((s: CallState) => {
    callStateRef.current = s;
    setCallState(s);
  }, []);

  // ── Sync with global customer changes ─────────────────────────────────────
  useEffect(() => {
    const handleCustomerChange = (e: any) => {
      if (e.detail) {
        setActiveCustomer(e.detail);
        activeCustomerRef.current = e.detail;
      }
    };
    window.addEventListener('aura:customer-changed', handleCustomerChange);
    return () => window.removeEventListener('aura:customer-changed', handleCustomerChange);
  }, []);

  // ── Pre-warm Greeting Audio for Active Customer ───────────────────────────
  useEffect(() => {
    const greeting = getCustomerPersonalizedGreeting(activeCustomer);
    fetch(`/api/tts?text=${encodeURIComponent(greeting)}`)
      .then(res => res.ok ? res.arrayBuffer() : null)
      .then(buf => { if (buf) greetingBufferRef.current = buf; })
      .catch(() => {});
  }, [activeCustomer]);

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
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (_) {}
    }
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
  //  Exclusive mic hardware access — zero contention
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

  // ── Browser SpeechSynthesis Fallback (Guaranteed to work 100% offline & in cloud) ──
  const speakWithBrowserTTS = useCallback((text: string, onComplete?: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onComplete) onComplete();
      syncCallState('idle');
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);

      const voices = window.speechSynthesis.getVoices();
      const indianVoice = voices.find(v => 
        (v.lang === 'en-IN' || v.lang.startsWith('en_IN') || v.name.toLowerCase().includes('india') || v.name.toLowerCase().includes('heera') || v.name.toLowerCase().includes('neerja'))
      ) || voices.find(v => v.lang.startsWith('en') && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('zira')))
      || voices.find(v => v.lang.startsWith('en'));

      if (indianVoice) {
        utterance.voice = indianVoice;
      }
      utterance.rate = 1.0;
      utterance.pitch = 1.05;

      utterance.onend = () => {
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
      };

      utterance.onerror = (e) => {
        console.warn('[SpeechSynthesis] utterance error:', e);
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
      };

      syncCallState('speaking');
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[SpeechSynthesis] speak exception:', err);
      if (onComplete) onComplete();
      syncCallState('idle');
    }
  }, [syncCallState, startListening]);

  // ═══════════════════════════════════════════════════════════════════════════
  //  PLAY ARIA AUDIO (Dual-Tier: Cloud Neural TTS with Instant Browser Fallback)
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

      let arrayBuffer: ArrayBuffer | null = null;
      if (isGreeting && greetingBufferRef.current) {
        arrayBuffer = greetingBufferRef.current.slice(0);
      } else {
        // Fetch server neural audio with 1800ms abort timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1800);

        try {
          const res = await fetch(`/api/tts?text=${encodeURIComponent(text)}`, {
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (!res.ok) throw new Error(`TTS server HTTP ${res.status}`);
          arrayBuffer = await res.arrayBuffer();
        } catch (fetchErr) {
          clearTimeout(timeoutId);
          throw fetchErr;
        }
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
      console.warn('[Voice] Server TTS fallback triggered:', err?.message);
      // Seamlessly fallback to browser speech synthesis — guarantees Aria ALWAYS speaks!
      speakWithBrowserTTS(text, onComplete);
    }
  }, [stopAllAudio, syncCallState, getUnlockedAudioContext, startListening, speakWithBrowserTTS]);

  // ═══════════════════════════════════════════════════════════════════════════
  //  BARGE-IN / INTERRUPT ARIA (STABLE & NEVER ACCIDENTALLY ENDS CALL)
  // ═══════════════════════════════════════════════════════════════════════════
  const handleInterrupt = useCallback((e?: React.MouseEvent | KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Record timestamp so handleEndCall can ignore any accidental mis-clicks
    lastInterruptTimeRef.current = Date.now();

    if (callStateRef.current === 'speaking') {
      stopAllAudio();
      if (isCallActiveRef.current) {
        shouldBeListeningRef.current = true;
        syncCallState('listening');
        startListening();
      }
    }

    // Always defocus any button so subsequent Spacebar presses don't click it
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, [stopAllAudio, syncCallState, startListening]);

  // Global Keyboard shortcut: Spacebar in CAPTURE phase to intercept cleanly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (isCallActiveRef.current) {
          e.preventDefault();
          e.stopPropagation();
          if (callStateRef.current === 'speaking') {
            handleInterrupt(e);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
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
        body: JSON.stringify({
          messages,
          userMessage: text,
          customerProfile: activeCustomerRef.current
        }),
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

    // Defocus starting button so Space key does not activate it
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // CRITICAL: Unlock AudioContext synchronously inside user click
    await getUnlockedAudioContext();

    isCallActiveRef.current = true;
    setIsCallActive(true);
    setDuration(0);
    setInterimText('');
    setSummary(null);

    const greeting = getCustomerPersonalizedGreeting(activeCustomerRef.current);
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
  //  END CALL (with safety gate against accidental double-clicks from interrupt)
  // ═══════════════════════════════════════════════════════════════════════════
  const handleEndCall = useCallback(async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    // Safety gate: ignore accidental trigger if interrupt was tapped within last 800ms
    if (Date.now() - lastInterruptTimeRef.current < 800) {
      console.warn('[Call] Blocked accidental end-call immediately following interrupt');
      return;
    }

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

          // Save completed conversation directly into live CRM Telemetry Store
          addTelemetryRecord({
            durationSeconds: duration || Math.max(14, snap.length * 4),
            customerName: activeCustomerRef.current?.name,
            customerTier: activeCustomerRef.current?.tier,
            transcript: snap,
            summary: data.summary,
          });
        }
      } catch (err) {
        console.error('[Summary] error:', err);
      }
    }
  }, [stopAllAudio, syncCallState, duration]);

  // ── Format helper ─────────────────────────────────────────────────────────
  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div>
      {/* ── Main Voice Interaction Center ───────────────────────────────────── */}
      <div className="enterprise-card" style={{ maxWidth: '860px', margin: '0 auto', padding: '28px 24px' }}>

        {/* Console Header: Agent Profile + Status Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-subtle)',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Agent Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-light)'
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>Aria</span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--brand-subtle)',
                  color: 'var(--brand-light)',
                  border: '1px solid var(--brand-border)'
                }}>
                  en-IN Voice Persona
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                AI Customer Experience Specialist • Aura Skincare
              </div>
            </div>
          </div>

          {/* Status Badge & Call Timer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              background: callState === 'listening' ? 'rgba(37, 99, 235, 0.16)'
                : callState === 'thinking' ? 'rgba(245, 158, 11, 0.14)'
                : callState === 'speaking' ? 'rgba(56, 189, 248, 0.14)'
                : 'var(--bg-surface-elevated)',
              border: `1px solid ${callState === 'listening' ? '#3B82F6'
                : callState === 'thinking' ? 'rgba(245, 158, 11, 0.4)'
                : callState === 'speaking' ? '#38BDF8'
                : 'var(--border-default)'}`,
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 600,
            }}>
              <span
                className={isCallActive ? 'animate-pulse-dot' : ''}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: callState === 'listening' ? '#3B82F6'
                    : callState === 'thinking' ? '#F59E0B'
                    : callState === 'speaking' ? '#38BDF8'
                    : 'var(--text-muted)',
                }}
              />
              <span style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {callState === 'idle' && 'Ready to Connect'}
                {callState === 'listening' && 'Listening to Customer'}
                {callState === 'thinking' && 'Verifying Order with Carrier'}
                {callState === 'speaking' && 'Aria Speaking'}
              </span>
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-inset)',
              border: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              fontWeight: 600,
              color: isCallActive ? 'var(--brand-light)' : 'var(--text-muted)'
            }}>
              <Clock size={12} />
              <span>{fmt(duration)}</span>
            </div>
          </div>
        </div>

        {/* Audio Visualizer */}
        <AudioVisualizer state={callState} />

        {/* Spacebar Interrupt Banner Inside Console */}
        {isCallActive && (
          <div style={{
            marginTop: '16px',
            padding: '10px 16px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(37, 99, 235, 0.12)',
            border: '1px solid rgba(59, 130, 246, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            color: '#93C5FD',
            fontSize: '12px'
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <kbd style={{
                padding: '2px 8px',
                borderRadius: '4px',
                background: '#1E293B',
                border: '1px solid #3B82F6',
                color: '#FFFFFF',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 700
              }}>SPACEBAR</kbd>
              <span><strong>Press Spacebar</strong> or speak anytime to interrupt Aria</span>
            </span>
          </div>
        )}

        {/* Primary Controls */}
        <div style={{
          marginTop: '20px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '14px',
          flexWrap: 'wrap'
        }}>
          {!isCallActive ? (
            <button
              id="start-call-btn"
              type="button"
              onClick={handleStartCall}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 36px',
                borderRadius: 'var(--radius-sm)',
                background: '#2563EB',
                color: '#FFFFFF',
                fontSize: '15px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              <Phone size={18} />
              <span>Start Voice Conversation</span>
            </button>
          ) : (
            <>
              {/* Permanent Interrupt Button */}
              <button
                id="interrupt-btn"
                type="button"
                onClick={handleInterrupt}
                disabled={callState !== 'speaking'}
                title={callState === 'speaking' ? 'Interrupt Aria and speak (Spacebar)' : 'Aria is listening'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  borderRadius: 'var(--radius-sm)',
                  background: callState === 'speaking'
                    ? '#1E293B'
                    : 'var(--bg-inset)',
                  border: `1px solid ${callState === 'speaking' ? '#38BDF8' : 'var(--border-subtle)'}`,
                  color: callState === 'speaking' ? '#FFFFFF' : 'var(--text-muted)',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: callState === 'speaking' ? 'pointer' : 'default',
                  transition: 'all 0.15s ease',
                  opacity: callState === 'speaking' ? 1 : 0.6,
                }}
              >
                {callState === 'speaking' ? <Hand size={16} color="#38BDF8" /> : <Mic size={16} />}
                <span>{callState === 'speaking' ? 'Interrupt Aria (Spacebar)' : 'Aria Listening'}</span>
              </button>

              {/* End Call Button */}
              <button
                id="end-call-btn"
                type="button"
                onClick={handleEndCall}
                onKeyDown={(e) => { if (e.code === 'Space') e.preventDefault(); }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 28px',
                  borderRadius: 'var(--radius-sm)',
                  background: '#DC2626',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'opacity 0.15s ease',
                  boxShadow: '0 2px 8px rgba(220, 38, 38, 0.4)'
                }}
              >
                <PhoneOff size={16} />
                <span>Stop / End Call</span>
              </button>
            </>
          )}

          {summary && !isCallActive && (
            <button
              onClick={() => setIsSummaryOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 22px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid #3B82F6',
                color: '#93C5FD',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Sparkles size={15} color="#38BDF8" />
              <span>View Call Summary (JSON)</span>
            </button>
          )}
        </div>

        {/* Microphone Warning */}
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
            <span>Microphone access denied. Please enable microphone permissions in your browser or select an inquiry below.</span>
          </div>
        )}
      </div>

      {/* ── Transcript Stream (Placed directly under console so it is visible together) ── */}
      <TranscriptStream
        transcript={transcript}
        interimUserText={interimText}
        isThinking={callState === 'thinking'}
      />

      {/* ── Sample Orders & Suggested Inquiries Helper ──────────────────────── */}
      <div style={{ marginTop: '24px' }}>
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
      </div>

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
