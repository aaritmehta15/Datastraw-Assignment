'use client';

import { useState } from 'react';
import { StructuredCallSummary, CallTranscriptTurn } from '@/lib/types';
import { Check, Copy, X, FileText, CheckCircle2, AlertCircle, Clock, ShieldCheck, Download } from 'lucide-react';

interface PostCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: StructuredCallSummary | null;
  transcript: CallTranscriptTurn[];
}

export default function PostCallModal({ isOpen, onClose, summary, transcript }: PostCallModalProps) {
  const [copied, setCopied] = useState(false);

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
    if (status === 'RESOLVED') return '#10B981';
    if (status === 'DENIED_POLICY_LIMITATION') return '#F59E0B';
    if (status === 'ESCALATED') return '#EF4444';
    return '#8B5CF6';
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-card" style={{
        maxWidth: '820px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        backgroundColor: 'rgba(13, 38, 30, 0.95)',
        border: '1px solid var(--bg-glass-border)',
        boxShadow: 'var(--shadow-lg), 0 0 50px rgba(212, 175, 55, 0.25)',
        padding: '32px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(212, 175, 55, 0.2)',
              border: '1px solid var(--gold-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold-primary)'
            }}>
              <FileText size={22} />
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, color: '#FFFFFF' }}>
                Post-Call Intelligence & Structured Outcome
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Automated CRM telemetry and brand policy audit record
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '8px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--text-secondary)'
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
          marginBottom: '24px'
        }}>
          <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(7, 25, 18, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Customer Intent</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gold-light)' }}>
              {summary.customer_intent}
            </div>
          </div>

          <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(7, 25, 18, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Resolution Status</div>
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

          <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(7, 25, 18, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Target Order ID</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
              {summary.order_id || 'N/A'}
            </div>
          </div>

          <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'rgba(7, 25, 18, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Call Duration</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#A7F3D0', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={13} />
              <span>{summary.duration_seconds || 0} seconds</span>
            </div>
          </div>
        </div>

        {/* Executive Summary Card */}
        <div style={{
          padding: '16px 20px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(212, 175, 55, 0.08)',
          border: '1px solid rgba(212, 175, 55, 0.25)',
          marginBottom: '24px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gold-primary)', marginBottom: '6px' }}>
            EXECUTIVE CALL SUMMARY
          </div>
          <p style={{ fontSize: '14px', color: '#FFFFFF', lineHeight: 1.6 }}>
            {summary.call_summary}
          </p>
          {summary.policy_compliance_notes && (
            <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} color="var(--emerald-accent)" />
              <span>Policy Compliance: {summary.policy_compliance_notes}</span>
            </div>
          )}
        </div>

        {/* Formatted JSON Telemetry Payload */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Structured JSON Payload (Section 2.D Format)
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleCopy}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  background: copied ? 'var(--emerald-accent)' : 'rgba(255, 255, 255, 0.1)',
                  color: copied ? '#071912' : '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 600,
                  transition: 'all 0.2s ease'
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied JSON!' : 'Copy JSON'}</span>
              </button>
              <button
                onClick={handleDownload}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(212, 175, 55, 0.2)',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  color: 'var(--gold-light)',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                <Download size={14} />
                <span>Export Audit</span>
              </button>
            </div>
          </div>

          <pre style={{
            background: '#040F0B',
            padding: '18px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            color: '#6EE7B7',
            overflowX: 'auto',
            maxHeight: '220px',
            lineHeight: 1.5
          }}>
            {JSON.stringify(summary, null, 2)}
          </pre>
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 28px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--gold-primary)',
              color: '#071912',
              fontWeight: 700,
              fontSize: '14px'
            }}
          >
            Done & Return to Studio
          </button>
        </div>
      </div>
    </div>
  );
}
