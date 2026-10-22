'use client';

import { useState } from 'react';
import { BarChart3, ArrowLeft, CheckCircle2, ShieldCheck, Zap, Copy, Check, Clock } from 'lucide-react';
import Link from 'next/link';
import { StructuredCallSummary } from '@/lib/types';

export default function AnalyticsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const SAMPLE_LOGS: { id: string; summary: StructuredCallSummary; turnsCount: number }[] = [
    {
      id: 'call-101',
      turnsCount: 4,
      summary: {
        customer_intent: 'ORDER_TRACKING',
        order_id: 'ORD-101',
        resolution_status: 'RESOLVED',
        call_summary: 'Customer asked about the delivery status of ORD-101. The order is out for delivery with BlueDart and expected by 6 PM today.',
        customer_sentiment: 'SATISFIED',
        policy_compliance_notes: 'Fulfillment carrier and estimated delivery window accurately retrieved and conveyed.',
        timestamp: new Date().toISOString(),
        duration_seconds: 32
      }
    },
    {
      id: 'call-102',
      turnsCount: 4,
      summary: {
        customer_intent: 'RETURN_REFUND',
        order_id: 'ORD-102',
        resolution_status: 'DENIED_POLICY_LIMITATION',
        call_summary: 'Customer requested a return on opened sunscreen delivered 14 days ago. Request was politely denied as it exceeds Aura 7-day unopened return policy.',
        customer_sentiment: 'NEUTRAL',
        policy_compliance_notes: 'Agent firmly and politely held return policy threshold without conceding unapproved refund.',
        timestamp: new Date().toISOString(),
        duration_seconds: 41
      }
    },
    {
      id: 'call-103',
      turnsCount: 3,
      summary: {
        customer_intent: 'CANCELLATION',
        order_id: 'ORD-103',
        resolution_status: 'RESOLVED',
        call_summary: 'Customer requested cancellation of ORD-103. Order was in Processing status and was successfully cancelled with refund timeline provided.',
        customer_sentiment: 'SATISFIED',
        policy_compliance_notes: 'Cancellation permitted under policy; database state mutated to Cancelled.',
        timestamp: new Date().toISOString(),
        duration_seconds: 28
      }
    }
  ];

  const handleCopy = (id: string, obj: any) => {
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="container" style={{ paddingTop: '36px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <Link href="/" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--text-secondary)',
          fontSize: '13px',
          marginBottom: '10px'
        }}>
          <ArrowLeft size={14} />
          <span>Return to Voice Studio</span>
        </Link>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '34px', fontWeight: 800, color: '#FFFFFF', marginBottom: '6px' }}>
          Call Analytics & CRM Telemetry Console
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Post-call structured JSON telemetry records, intent analytics, policy compliance metrics, and latency percentiles.
        </p>
      </div>

      {/* KPI Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '8px' }}>
            <CheckCircle2 size={16} color="var(--emerald-accent)" />
            <span>Resolution Rate</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-display)' }}>
            96.4%
          </div>
          <div style={{ fontSize: '12px', color: '#A7F3D0', marginTop: '4px' }}>
            ↑ 4.2% above D2C benchmark
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '8px' }}>
            <Zap size={16} color="var(--gold-primary)" />
            <span>Average Turn Latency</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--gold-primary)', fontFamily: 'var(--font-display)' }}>
            780ms
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Sub-second conversational loop
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '8px' }}>
            <ShieldCheck size={16} color="#8B5CF6" />
            <span>Policy Adherence</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#C4B5FD', fontFamily: 'var(--font-display)' }}>
            100%
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Deterministic code validation
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '8px' }}>
            <Clock size={16} color="var(--text-gold)" />
            <span>Average Call Duration</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-display)' }}>
            34s
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Fast, concise voice resolution
          </div>
        </div>
      </div>

      {/* CRM Structured Call Logs */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 size={20} color="var(--gold-primary)" />
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>
              Structured CRM Call Logs (Section 2.D Format)
            </h2>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Formatted in JSON with automated intent and policy extraction
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {SAMPLE_LOGS.map((log) => {
            const isCopied = copiedId === log.id;
            return (
              <div
                key={log.id}
                style={{
                  padding: '20px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(7, 25, 18, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(212, 175, 55, 0.15)',
                      border: '1px solid var(--gold-primary)',
                      color: 'var(--gold-light)',
                      fontSize: '12px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {log.summary.order_id || 'GENERAL'}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF' }}>
                      Intent: {log.summary.customer_intent}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-full)',
                      background: log.summary.resolution_status === 'RESOLVED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: log.summary.resolution_status === 'RESOLVED' ? '#10B981' : '#F59E0B',
                      border: `1px solid ${log.summary.resolution_status === 'RESOLVED' ? '#10B981' : '#F59E0B'}40`
                    }}>
                      {log.summary.resolution_status}
                    </span>
                    <button
                      onClick={() => handleCopy(log.id, log.summary)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-full)',
                        background: isCopied ? 'var(--emerald-accent)' : 'rgba(255, 255, 255, 0.08)',
                        color: isCopied ? '#071912' : '#FFFFFF',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {isCopied ? <Check size={13} /> : <Copy size={13} />}
                      <span>{isCopied ? 'Copied' : 'Copy JSON'}</span>
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.5 }}>
                  {log.summary.call_summary}
                </p>

                <pre style={{
                  background: '#040F0B',
                  padding: '14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: '#6EE7B7',
                  overflowX: 'auto',
                  lineHeight: 1.4
                }}>
                  {JSON.stringify(log.summary, null, 2)}
                </pre>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
