'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Copy,
  Check,
  Clock,
  MessageSquare,
  FileCode,
  RotateCcw,
  User,
  Sparkles,
  PhoneCall
} from 'lucide-react';
import {
  CallTelemetryRecord,
  getTelemetryRecords,
  computeTelemetryKPIs,
  resetTelemetryStorage
} from '@/lib/telemetryStore';

export default function AnalyticsPage() {
  const [records, setRecords] = useState<CallTelemetryRecord[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [cardViews, setCardViews] = useState<Record<string, 'json' | 'dialogue'>>({});

  useEffect(() => {
    setRecords(getTelemetryRecords());

    const handleUpdate = () => {
      setRecords(getTelemetryRecords());
    };

    window.addEventListener('aura:telemetry-updated', handleUpdate);
    return () => window.removeEventListener('aura:telemetry-updated', handleUpdate);
  }, []);

  const kpis = computeTelemetryKPIs(records);

  const handleCopy = (id: string, obj: any) => {
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleCardView = (id: string, view: 'json' | 'dialogue') => {
    setCardViews(prev => ({ ...prev, [id]: view }));
  };

  const handleReset = () => {
    if (confirm('Reset live calls back to baseline benchmark records?')) {
      resetTelemetryStorage();
      setRecords(getTelemetryRecords());
    }
  };

  return (
    <div className="container" style={{ padding: '36px 16px 80px' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div>
          <Link href="/" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-secondary)',
            fontSize: '13px',
            textDecoration: 'none',
            marginBottom: '10px'
          }}>
            <ArrowLeft size={14} />
            <span>Return to Voice Concierge</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
              Live CRM Call Telemetry & Audit Logs
            </h1>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(16, 185, 129, 0.16)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34D399',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              <span>LIVE LOGGING ACTIVE</span>
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '6px', maxWidth: '720px' }}>
            Real-time structured JSON telemetry records, automated intent classification, and brand policy compliance audits logged directly from voice interactions.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-secondary)',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          <RotateCcw size={13} />
          <span>Reset to Benchmarks</span>
        </button>
      </div>

      {/* KPI Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div className="enterprise-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '8px' }}>
            <CheckCircle2 size={16} color="#34D399" />
            <span>Resolution Rate</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-display)' }}>
            {kpis.resolutionRate}
          </div>
          <div style={{ fontSize: '12px', color: '#34D399', marginTop: '4px' }}>
            ↑ 4.2% above D2C benchmark
          </div>
        </div>

        <div className="enterprise-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '8px' }}>
            <Zap size={16} color="var(--gold-light)" />
            <span>Average Turn Latency</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--gold-light)', fontFamily: 'var(--font-display)' }}>
            {kpis.avgLatencyMs}ms
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Sub-second conversational loop
          </div>
        </div>

        <div className="enterprise-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '8px' }}>
            <ShieldCheck size={16} color="#60A5FA" />
            <span>Policy Adherence</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#93C5FD', fontFamily: 'var(--font-display)' }}>
            {kpis.policyAdherence}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Deterministic code validation
          </div>
        </div>

        <div className="enterprise-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '8px' }}>
            <PhoneCall size={16} color="#A78BFA" />
            <span>Total Calls Logged</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-display)' }}>
            {kpis.totalCalls}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Avg duration: {kpis.avgDuration}
          </div>
        </div>
      </div>

      {/* CRM Structured Call Logs */}
      <div className="enterprise-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 size={20} color="var(--brand-light)" />
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
              Audit Telemetry Stream ({records.length} Recorded Sessions)
            </h2>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Every voice call completed in the concierge logs here automatically in real time
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {records.map((log) => {
            const isCopied = copiedId === log.id;
            const currentView = cardViews[log.id] || (log.isLive ? 'dialogue' : 'json');

            return (
              <div
                key={log.id}
                style={{
                  padding: '20px',
                  borderRadius: 'var(--radius-md)',
                  background: log.isLive ? 'rgba(37, 99, 235, 0.08)' : 'var(--bg-surface-elevated)',
                  border: `1px solid ${log.isLive ? 'rgba(59, 130, 246, 0.4)' : 'var(--border-default)'}`,
                  position: 'relative'
                }}
              >
                {/* Top Strip */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {log.isLive && (
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(16, 185, 129, 0.2)',
                        border: '1px solid #10B981',
                        color: '#34D399',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10B981' }} />
                        <span>LIVE RECENT CALL</span>
                      </span>
                    )}

                    <span style={{
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(59, 130, 246, 0.14)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      color: '#93C5FD',
                      fontSize: '11px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {log.summary.order_id || 'GENERAL'}
                    </span>

                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                      Intent: {log.summary.customer_intent}
                    </span>

                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      • {log.customerName} ({log.customerTier})
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-full)',
                      background: log.summary.resolution_status === 'RESOLVED' ? 'rgba(16, 185, 129, 0.16)' : 'rgba(245, 158, 11, 0.16)',
                      color: log.summary.resolution_status === 'RESOLVED' ? '#34D399' : '#F59E0B',
                      border: `1px solid ${log.summary.resolution_status === 'RESOLVED' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`
                    }}>
                      {log.summary.resolution_status}
                    </span>

                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {log.timeFormatted} ({log.durationSeconds}s)
                    </span>

                    <button
                      type="button"
                      onClick={() => handleCopy(log.id, log.summary)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '5px 10px',
                        borderRadius: 'var(--radius-sm)',
                        background: isCopied ? '#059669' : 'var(--bg-inset)',
                        border: '1px solid var(--border-default)',
                        color: isCopied ? '#FFFFFF' : 'var(--text-primary)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {isCopied ? <Check size={12} /> : <Copy size={12} />}
                      <span>{isCopied ? 'Copied' : 'Copy JSON'}</span>
                    </button>
                  </div>
                </div>

                {/* Executive Call Summary Sentence */}
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '12px', lineHeight: 1.5 }}>
                  {log.summary.call_summary}
                </p>

                {log.summary.policy_compliance_notes && (
                  <div style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <ShieldCheck size={14} color="#34D399" />
                    <span>Compliance Audit: <strong style={{ color: '#E2E8F0' }}>{log.summary.policy_compliance_notes}</strong></span>
                  </div>
                )}

                {/* View Switcher: Dialogue vs JSON */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                  <button
                    type="button"
                    onClick={() => toggleCardView(log.id, 'dialogue')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11px',
                      fontWeight: currentView === 'dialogue' ? 700 : 500,
                      background: currentView === 'dialogue' ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
                      border: currentView === 'dialogue' ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
                      color: currentView === 'dialogue' ? '#FFFFFF' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <MessageSquare size={12} />
                    <span>Spoken Dialogue ({log.transcript.length} turns)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleCardView(log.id, 'json')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11px',
                      fontWeight: currentView === 'json' ? 700 : 500,
                      background: currentView === 'json' ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
                      border: currentView === 'json' ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
                      color: currentView === 'json' ? '#FFFFFF' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <FileCode size={12} />
                    <span>Structured JSON Payload</span>
                  </button>
                </div>

                {/* Content Display */}
                {currentView === 'dialogue' ? (
                  <div style={{
                    background: 'var(--bg-inset)',
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    maxHeight: '220px',
                    overflowY: 'auto'
                  }}>
                    {log.transcript.map((turn, idx) => {
                      const isAria = turn.speaker === 'aria';
                      return (
                        <div key={turn.id || idx} style={{ fontSize: '12px', lineHeight: 1.45 }}>
                          <span style={{ fontWeight: 700, color: isAria ? '#60A5FA' : 'var(--gold-light)' }}>
                            {isAria ? 'Aria: ' : `${log.customerName.split(' ')[0]}: `}
                          </span>
                          <span style={{ color: '#E2E8F0' }}>{turn.text}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <pre style={{
                    background: '#040810',
                    padding: '14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: '#34D399',
                    overflowX: 'auto',
                    lineHeight: 1.45,
                    margin: 0
                  }}>
                    {JSON.stringify(log.summary, null, 2)}
                  </pre>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
