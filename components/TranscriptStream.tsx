'use client';

import { useEffect, useRef } from 'react';
import { CallTranscriptTurn } from '@/lib/types';
import { User, Sparkles, Terminal } from 'lucide-react';

interface TranscriptStreamProps {
  transcript: CallTranscriptTurn[];
  interimUserText?: string;
  isThinking?: boolean;
}

export default function TranscriptStream({
  transcript,
  interimUserText,
  isThinking
}: TranscriptStreamProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll ONLY the internal transcript container, NEVER the window!
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [transcript, interimUserText, isThinking]);

  return (
    <div className="enterprise-card" style={{ marginTop: '20px', maxHeight: '420px', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '12px',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--brand-primary)' }} />
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Live Conversation Stream &amp; Tool Telemetry
          </h3>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
          {transcript.length} turns recorded
        </span>
      </div>

      <div
        ref={containerRef}
        style={{
          overflowY: 'auto',
          maxHeight: '340px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          paddingRight: '6px'
        }}
      >
        {transcript.length === 0 && !interimUserText && !isThinking && (
          <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
            Awaiting voice input. Start the call or select an inquiry below to begin speaking with Aria.
          </div>
        )}

        {transcript.map((turn) => {
          const isUser = turn.speaker === 'customer';
          return (
            <div
              key={turn.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
                gap: '4px'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: 600,
                color: isUser ? 'var(--emerald-accent)' : 'var(--gold-primary)'
              }}>
                {isUser ? <User size={12} /> : <Sparkles size={12} />}
                <span>{isUser ? 'Customer' : 'Aria (Voice Concierge)'}</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>• {turn.timestamp}</span>
              </div>

              <div style={{
                maxWidth: '85%',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isUser ? 'var(--bg-surface-elevated)' : 'rgba(197, 160, 89, 0.08)',
                border: isUser ? '1px solid var(--border-default)' : '1px solid var(--border-gold)',
                color: '#FFFFFF',
                fontSize: '13px',
                lineHeight: 1.5,
                boxShadow: 'var(--shadow-sm)'
              }}>
                {turn.text}

                {/* Visible Tool Execution Telemetry */}
                {turn.toolCalls && turn.toolCalls.length > 0 && (
                  <div style={{
                    marginTop: '8px',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    {turn.toolCalls.map((tc, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-xs)',
                          background: 'var(--bg-inset)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--gold-light)'
                        }}
                      >
                        <Terminal size={11} color="var(--gold-primary)" />
                        <span>tool: {tc.toolName}({JSON.stringify(tc.params)})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Interim Speech Feedback */}
        {interimUserText && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '4px',
            opacity: 0.75
          }}>
            <div style={{ fontSize: '11px', color: 'var(--emerald-accent)', fontWeight: 600 }}>
              Listening...
            </div>
            <div style={{
              maxWidth: '85%',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px dashed var(--emerald-accent)',
              color: '#FFFFFF',
              fontSize: '13px',
              fontStyle: 'italic'
            }}>
              &ldquo;{interimUserText}&rdquo;
            </div>
          </div>
        )}

        {/* Thinking Indicator */}
        {isThinking && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            color: 'var(--status-thinking)',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            alignSelf: 'flex-start'
          }}>
            <div className="animate-pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
            <span>Aria checking database & policy rules...</span>
          </div>
        )}
      </div>
    </div>
  );
}
