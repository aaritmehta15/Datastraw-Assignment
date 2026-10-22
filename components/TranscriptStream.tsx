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
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, interimUserText, isThinking]);

  return (
    <div className="glass-card" style={{ marginTop: '24px', maxHeight: '380px', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--emerald-accent)' }} />
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
            Live Call Transcript & Function Execution Stream
          </h3>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {transcript.length} turns recorded
        </span>
      </div>

      <div style={{
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        paddingRight: '6px'
      }}>
        {transcript.length === 0 && !interimUserText && !isThinking && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '14px' }}>
            Click &ldquo;Start Call&rdquo; to begin speaking with Aria. Your real-time voice turns and tool executions will appear here.
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
                color: isUser ? '#A7F3D0' : 'var(--gold-primary)'
              }}>
                {isUser ? <User size={12} /> : <Sparkles size={12} />}
                <span>{isUser ? 'Customer (You)' : 'Aria (Aura Skincare Specialist)'}</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>• {turn.timestamp}</span>
              </div>

              <div style={{
                maxWidth: '85%',
                padding: '12px 16px',
                borderRadius: '16px',
                borderBottomRightRadius: isUser ? '4px' : '16px',
                borderBottomLeftRadius: isUser ? '16px' : '4px',
                backgroundColor: isUser ? 'rgba(16, 75, 56, 0.5)' : 'rgba(212, 175, 55, 0.1)',
                border: isUser ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(212, 175, 55, 0.25)',
                color: '#FFFFFF',
                fontSize: '14px',
                lineHeight: 1.5,
                boxShadow: 'var(--shadow-sm)'
              }}>
                {turn.text}

                {/* Visible Tool Execution telemetry */}
                {turn.toolCalls && turn.toolCalls.length > 0 && (
                  <div style={{
                    marginTop: '8px',
                    paddingTop: '8px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
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
                          borderRadius: '6px',
                          background: 'rgba(0, 0, 0, 0.4)',
                          border: '1px solid rgba(212, 175, 55, 0.3)',
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

        {/* Live Interim Speech Bubble (real-time streaming as user speaks) */}
        {interimUserText && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#A7F3D0' }}>
              <User size={12} />
              <span>Customer (Speaking...)</span>
            </div>
            <div style={{
              maxWidth: '85%',
              padding: '10px 14px',
              borderRadius: '16px',
              borderBottomRightRadius: '4px',
              backgroundColor: 'rgba(16, 75, 56, 0.3)',
              border: '1px dashed rgba(16, 185, 129, 0.5)',
              color: '#A7F3D0',
              fontSize: '14px',
              fontStyle: 'italic'
            }}>
              {interimUserText}
            </div>
          </div>
        )}

        {/* Thinking Pulse */}
        {isThinking && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-thinking)', fontSize: '13px', fontStyle: 'italic' }}>
            <Sparkles size={14} className="animate-pulse-dot" />
            <span>Aria is querying database and reasoning over brand policies...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
