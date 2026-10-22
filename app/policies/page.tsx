'use client';

import { ShieldCheck, Truck, RotateCcw, Ban, CreditCard, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { BRAND_POLICIES, AURA_BRAND_OVERVIEW } from '@/lib/brandKnowledge';

export default function PoliciesPage() {
  const getPolicyIcon = (category: string) => {
    switch (category) {
      case 'shipping': return Truck;
      case 'returns': return RotateCcw;
      case 'cancellations': return Ban;
      case 'payments': return CreditCard;
      default: return ShieldCheck;
    }
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
          Brand Knowledge & Policy Matrix
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '750px' }}>
          Aura Skincare brand guidelines and deterministic business rules. Aria strictly enforces these guardrails during voice conversations to prevent hallucinated commitments.
        </p>
      </div>

      {/* Brand Overview Card */}
      <div className="glass-card" style={{ marginBottom: '28px', background: 'linear-gradient(135deg, rgba(16, 75, 56, 0.4) 0%, rgba(7, 25, 18, 0.8) 100%)', border: '1px solid var(--bg-glass-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--gold-primary)', marginBottom: '8px' }}>
          <ShieldCheck size={22} />
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>{AURA_BRAND_OVERVIEW.name} — Brand Philosophy</h2>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '14px' }}>
          {AURA_BRAND_OVERVIEW.description}
        </p>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '13px' }}>
          <span style={{ color: 'var(--gold-light)' }}>
            🏷️ Persona: <strong>Aria (Voice CX Specialist)</strong>
          </span>
          <span style={{ color: 'var(--text-muted)' }}>•</span>
          <span style={{ color: 'var(--gold-light)' }}>
            🇮🇳 Accent: <strong>Indian English (en-IN)</strong>
          </span>
          <span style={{ color: 'var(--text-muted)' }}>•</span>
          <span style={{ color: 'var(--emerald-accent)' }}>
            🛡️ Guardrails: <strong>Deterministic Policy Code Validation</strong>
          </span>
        </div>
      </div>

      {/* Structured Policy Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px'
      }}>
        {BRAND_POLICIES.map((policy) => {
          const Icon = getPolicyIcon(policy.category);
          return (
            <div key={policy.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(212, 175, 55, 0.15)',
                    border: '1px solid var(--gold-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--gold-primary)'
                  }}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>
                      {policy.title}
                    </h3>
                  </div>
                </div>

                <div style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(212, 175, 55, 0.08)',
                  border: '1px solid rgba(212, 175, 55, 0.2)',
                  fontSize: '12px',
                  color: 'var(--gold-light)',
                  marginBottom: '16px',
                  lineHeight: 1.5
                }}>
                  <strong>Core Rule:</strong> {policy.summary}
                </div>

                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {policy.details.map((detail, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      <CheckCircle2 size={15} color="var(--emerald-accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
