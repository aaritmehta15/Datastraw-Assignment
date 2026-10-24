'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StructuredCallSummary, CallTranscriptTurn } from '@/lib/types';
import {
  Check,
  Copy,
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Download,
  BarChart3,
  MessageSquare,
  ArrowRight,
  User,
  Sparkles
} from 'lucide-react';

interface PostCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: StructuredCallSummary | null;
  transcript: CallTranscriptTurn[];
}

export default function PostCallModal({ isOpen, onClose, summary, transcript }: PostCallModalProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'json'>('summary');

  if (!isOpen || !summary) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(summary, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const payload = {
      summary,
      transcript,
      generated_at: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aura-cx-call-${summary.order_id || 'summary'}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    if (status === 'RESOLVED') return '#34D399';
    if (status === 'DENIED_POLICY_LIMITATION') return '#F59E0B';
    if (status === 'ESCALATED') return '#EF4444';
    return '#60A5FA';
  };

  const handleGoToAnalytics = () => {
    onClose();
    router.push('/analytics');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 10, 20, 0.85)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="enterprise-card" style={{
        maxWidth: '840px',
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        position: 'relative',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-xl)',
        padding: '28px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(37, 99, 235, 0.16)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60A5FA'
            }}>
              <FileText size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                  Post-Call Transcript & Telemetry Audit
                </h2>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(16, 185, 129, 0.16)',
                  color: '#34D399',
                  border: '1px solid rgba(16, 185, 129, 0.35)'
                }}>
                  Logged Live
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                Structured CRM conversation outcome and automated policy compliance review
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Metric Badges */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '12px',
          marginBottom: '20px'
        }}>
          <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-inset)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Customer Intent</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gold-light)' }}>
              {summary.customer_intent}
            </div>
          </div>

          <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-inset)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Resolution Status</div>
            <div style={{
              fontSize: '13px',
              fontWeight: 700,
              color: getStatusColor(summary.resolution_status),
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <CheckCircle2 size={13} />
              <span>{summary.resolution_status}</span>
            </div>
          </div>

          <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-inset)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Linked Order</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
              {summary.order_id || 'GENERAL INQUIRY'}
            </div>
          </div>

          <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-inset)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Call Duration</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#60A5FA', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={13} />
              <span>{summary.duration_seconds || 18} seconds</span>
            </div>
          </div>
        </div>

        {/* View Selection Tabs */}
        <div style={{
          display: 'flex',
          gap: '6px',
          background: 'var(--bg-inset)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '18px',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: activeTab === 'summary' ? 700 : 500,
              color: activeTab === 'summary' ? '#FFFFFF' : 'var(--text-secondary)',
              background: activeTab === 'summary' ? 'var(--bg-surface-elevated)' : 'transparent',
              border: activeTab === 'summary' ? '1px solid var(--border-default)' : '1px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <FileText size={13} />
            <span>Executive Summary</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('transcript')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: activeTab === 'transcript' ? 700 : 500,
              color: activeTab === 'transcript' ? '#FFFFFF' : 'var(--text-secondary)',
              background: activeTab === 'transcript' ? 'var(--bg-surface-elevated)' : 'transparent',
              border: activeTab === 'transcript' ? '1px solid var(--border-default)' : '1px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <MessageSquare size={13} />
            <span>Spoken Dialogue ({transcript.length} turns)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('json')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: activeTab === 'json' ? 700 : 500,
              color: activeTab === 'json' ? '#FFFFFF' : 'var(--text-secondary)',
              background: activeTab === 'json' ? 'var(--bg-surface-elevated)' : 'transparent',
              border: activeTab === 'json' ? '1px solid var(--border-default)' : '1px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <BarChart3 size={13} />
            <span>Structured CRM JSON</span>
          </button>
        </div>

        {/* Tab 1: Executive Summary */}
        {activeTab === 'summary' && (
          <div style={{
            padding: '18px 20px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-inset)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gold-light)', marginBottom: '8px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Summary & Outcome
            </div>
            <p style={{ fontSize: '14px', color: '#FFFFFF', lineHeight: 1.6, margin: 0 }}>
              {summary.call_summary}
            </p>
            {summary.policy_compliance_notes && (
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={16} color="#34D399" />
                <span>Policy Compliance: <strong style={{ color: '#FFFFFF' }}>{summary.policy_compliance_notes}</strong></span>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Spoken Dialogue Transcript */}
        {activeTab === 'transcript' && (
          <div style={{
            background: 'var(--bg-inset)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            maxHeight: '280px',
            overflowY: 'auto',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {transcript.map((turn, idx) => {
              const isAria = turn.speaker === 'aria';
              return (
                <div
                  key={turn.id || idx}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: isAria ? 'rgba(37, 99, 235, 0.12)' : 'var(--bg-surface-elevated)',
                    border: `1px solid ${isAria ? 'rgba(59, 130, 246, 0.3)' : 'var(--border-default)'}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: isAria ? '#60A5FA' : 'var(--gold-light)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isAria ? <Sparkles size={12} /> : <User size={12} />}
                      <span>{isAria ? 'Aria (AI Specialist)' : 'Customer'}</span>
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {turn.timestamp}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#FFFFFF', margin: 0, lineHeight: 1.5 }}>
                    {turn.text}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 3: Structured JSON */}
        {activeTab === 'json' && (
          <div style={{ marginBottom: '20px' }}>
            <pre style={{
              background: '#040810',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: '#34D399',
              overflowX: 'auto',
              maxHeight: '240px',
              lineHeight: 1.55,
              margin: 0
            }}>
              {JSON.stringify(summary, null, 2)}
            </pre>
          </div>
        )}

        {/* Footer Actions */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleCopy}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: 'var(--radius-sm)',
                background: copied ? '#059669' : 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-default)',
                color: copied ? '#FFFFFF' : 'var(--text-primary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied JSON' : 'Copy JSON'}</span>
            </button>

            <button
              onClick={handleDownload}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Download size={14} />
              <span>Export Audit</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                background: 'transparent',
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleGoToAnalytics}
              className="btn btn-primary"
              style={{ padding: '8px 18px', fontSize: '13px', gap: '6px' }}
            >
              <span>View in CRM Telemetry</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
