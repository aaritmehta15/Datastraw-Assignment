'use client';

import { Sparkles, Mic, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="container" style={{ paddingTop: '40px' }}>
      {/* Hero Header */}
      <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 40px auto' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(212, 175, 55, 0.12)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          color: 'var(--gold-light)',
          fontSize: '13px',
          fontWeight: 600,
          marginBottom: '16px'
        }}>
          <Sparkles size={14} color="var(--gold-primary)" />
          <span>Next-Generation AI Voice Support Agent</span>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '44px',
          fontWeight: 800,
          lineHeight: 1.15,
          color: '#FFFFFF',
          marginBottom: '16px'
        }}>
          Meet <span style={{ color: 'var(--gold-primary)' }}>Aria</span> — Voice CX for <span style={{ color: '#6EE7B7' }}>Aura Skincare</span>
        </h1>

        <p style={{
          fontSize: '17px',
          color: 'var(--text-secondary)',
          lineHeight: 1.6
        }}>
          Speak naturally using your microphone. Aria answers brand questions, looks up real-time orders, enforces return and cancellation policies, and handles speech interruptions in a natural Indian accent.
        </p>
      </div>

      {/* Voice Studio Placeholder - Will be wired with CallCockpit in Chunk 4 */}
      <div className="glass-card" style={{ maxWidth: '860px', margin: '0 auto', textAlign: 'center', padding: '48px 32px' }}>
        <div style={{
          width: '90px',
          height: '90px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.25) 0%, rgba(16, 75, 56, 0.5) 100%)',
          border: '2px solid rgba(212, 175, 55, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px auto',
          boxShadow: '0 0 35px rgba(212, 175, 55, 0.25)'
        }}>
          <Mic size={40} color="var(--gold-primary)" />
        </div>

        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, marginBottom: '12px', color: '#FFFFFF' }}>
          Voice Studio Live Cockpit
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 28px auto', fontSize: '15px' }}>
          Foundation Chunk 1 active. The full speech recognition loop, neural audio streaming, reactive waveform, and one-click evaluator chips are being mounted in sequence.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <Link href="/orders" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            borderRadius: 'var(--radius-full)',
            background: 'linear-gradient(135deg, #104B38 0%, #071912 100%)',
            border: '1px solid rgba(212, 175, 55, 0.4)',
            color: 'var(--gold-light)',
            fontWeight: 600,
            fontSize: '14px'
          }}>
            <span>Inspect Live Order Database</span>
            <ArrowRight size={16} />
          </Link>
          <Link href="/policies" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'var(--text-primary)',
            fontWeight: 500,
            fontSize: '14px'
          }}>
            <span>View Brand Guardrails</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
