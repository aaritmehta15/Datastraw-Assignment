'use client';

import { Sparkles, ArrowRight, ShieldCheck, Zap, Headphones } from 'lucide-react';
import Link from 'next/link';
import CallCockpit from '@/components/CallCockpit';

export default function HomePage() {
  return (
    <div className="container" style={{ paddingTop: '36px' }}>
      {/* Hero Header */}
      <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 36px auto' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 18px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(212, 175, 55, 0.12)',
          border: '1px solid rgba(212, 175, 55, 0.35)',
          color: 'var(--gold-light)',
          fontSize: '13px',
          fontWeight: 600,
          marginBottom: '16px',
          boxShadow: '0 2px 10px rgba(212, 175, 55, 0.15)'
        }}>
          <Sparkles size={14} color="var(--gold-primary)" />
          <span>Aura Skincare • AI Voice Customer Experience Agent</span>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '46px',
          fontWeight: 800,
          lineHeight: 1.15,
          color: '#FFFFFF',
          marginBottom: '16px'
        }}>
          Meet <span style={{ color: 'var(--gold-primary)' }}>Aria</span> — Voice CX Specialist
        </h1>

        <p style={{
          fontSize: '17px',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          maxWidth: '680px',
          margin: '0 auto'
        }}>
          Click <strong style={{ color: '#FFFFFF' }}>Start Call</strong> and speak naturally into your microphone. Aria answers brand policies, checks live order statuses, enforces return/cancellation rules, and responds in an authentic Indian voice with real-time barge-in.
        </p>

        {/* Feature Badges */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '20px',
          marginTop: '18px',
          flexWrap: 'wrap',
          fontSize: '13px',
          color: 'var(--text-muted)'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Headphones size={14} color="var(--gold-primary)" />
            <span>Indian English Voice Persona (en-IN)</span>
          </span>
          <span>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} color="var(--emerald-accent)" />
            <span>Deterministic Policy Guardrails</span>
          </span>
          <span>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={14} color="var(--status-thinking)" />
            <span>Active Barge-In Interruption</span>
          </span>
        </div>
      </div>

      {/* Hero Live Voice Cockpit */}
      <CallCockpit />

      {/* Direct Quick Links to Multi-Page Suite */}
      <div style={{
        marginTop: '48px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '16px'
      }}>
        <Link href="/orders" className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Live Order Management</span>
            <ArrowRight size={16} color="var(--gold-primary)" />
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Inspect ORD-101, ORD-102, and ORD-103. Watch database status mutate live upon cancellation.
          </p>
        </Link>

        <Link href="/policies" className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Brand Knowledge Hub</span>
            <ArrowRight size={16} color="var(--gold-primary)" />
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Review Aura&apos;s shipping rules, 7-day return policy, 48h damaged window, and COD rules.
          </p>
        </Link>

        <Link href="/architecture" className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>System Architecture Dossier</span>
            <ArrowRight size={16} color="var(--gold-primary)" />
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Detailed breakdown of voice pipeline, latency budget, and answers to Section 9 questions.
          </p>
        </Link>
      </div>
    </div>
  );
}
