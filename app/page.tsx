'use client';

import { ArrowRight, ShieldCheck, Zap, Headphones, Sparkles } from 'lucide-react';
import Link from 'next/link';
import CallCockpit from '@/components/CallCockpit';

export default function HomePage() {
  return (
    <div className="container" style={{ paddingTop: '32px', paddingBottom: '60px' }}>
      {/* ── Brand & Contact Center Mission Header ─────────────────────── */}
      <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 28px auto' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(37, 99, 235, 0.12)',
          border: '1px solid rgba(59, 130, 246, 0.35)',
          color: '#60A5FA',
          fontSize: '12px',
          fontWeight: 700,
          marginBottom: '14px',
          letterSpacing: '0.04em'
        }}>
          <Sparkles size={14} color="#38BDF8" />
          <span>AURA SKINCARE • REAL-TIME CUSTOMER SUPPORT &amp; ORDER RESOLUTION DESK</span>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '34px',
          fontWeight: 800,
          lineHeight: 1.25,
          color: '#FFFFFF',
          marginBottom: '12px',
          letterSpacing: '-0.02em'
        }}>
          Customer Voice Care &amp; Order Resolution Portal
        </h1>

        <p style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          maxWidth: '680px',
          margin: '0 auto 18px auto'
        }}>
          Official browser-based voice support desk for <strong>Aura Skincare</strong> customers. Speak directly with <strong style={{ color: '#FFFFFF' }}>Aria (en-IN)</strong> to track active courier shipments, check return eligibility against brand policy, or execute instant cancellations for orders in processing.
        </p>

        {/* 4 Core Brand Service Pillars */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px',
          marginTop: '16px',
          textAlign: 'left'
        }}>
          <div style={{ padding: '10px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '11px', color: '#60A5FA', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
              🚚 Live Courier Tracking
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              BlueDart &amp; Delhivery ETAs
            </div>
          </div>

          <div style={{ padding: '10px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '11px', color: '#38BDF8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
              ⚡ Order Cancellation
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Instant warehouse refund flow
            </div>
          </div>

          <div style={{ padding: '10px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '11px', color: '#F59E0B', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
              🔄 Return Verification
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              7-Day unopened hygiene rule
            </div>
          </div>

          <div style={{ padding: '10px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '11px', color: '#10B981', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>
              💳 Shipping &amp; COD Rules
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              ₹499 Free Ship • ₹2.5k COD
            </div>
          </div>
        </div>
      </div>

      {/* Voice Console & Order Helper */}
      <CallCockpit />

      {/* Enterprise Operations Links */}
      <div style={{
        marginTop: '36px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '16px'
      }}>
        <Link href="/orders" className="enterprise-card" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Order Management Dashboard</span>
            <ArrowRight size={15} color="var(--gold-primary)" />
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Inspect live shipments, carrier tracking numbers, and watch database states mutate in real time upon cancellation.
          </p>
        </Link>

        <Link href="/policies" className="enterprise-card" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Brand Policies &amp; Knowledge Center</span>
            <ArrowRight size={15} color="var(--gold-primary)" />
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Official brand guidelines for ₹499 free delivery, 7-day unopened returns, 48h defect window, and COD rules.
          </p>
        </Link>
      </div>
    </div>
  );
}
