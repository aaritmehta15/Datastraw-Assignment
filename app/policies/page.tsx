'use client';

import { useState } from 'react';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Ban,
  CreditCard,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Sparkles,
  Compass,
  Play,
  Sliders,
  Code2
} from 'lucide-react';
import Link from 'next/link';
import { BRAND_POLICIES, AURA_BRAND_OVERVIEW } from '@/lib/brandKnowledge';

interface PolicyScenario {
  id: string;
  title: string;
  customerPrompt: string;
  category: 'returns' | 'cancellations' | 'shipping' | 'payments' | 'out_of_scope' | 'invalid_id';
  policyClause: string;
  codeCheck: string;
  verdict: 'REFUSED' | 'APPROVED' | 'DEFLECTED' | 'CLARIFICATION_REQUESTED';
  ariaResponse: string;
  rationale: string;
}

const POLICY_SCENARIOS: PolicyScenario[] = [
  {
    id: 'return-20-days',
    title: 'Return Request After 20 Days (Opened Product)',
    customerPrompt: '"I bought this serum 20 days ago and have opened it. Can I return it for a refund?"',
    category: 'returns',
    policyClause: 'Section 3: Return & Refund Policy — Returns accepted within 7 days of delivery for unopened, unused products in original packaging.',
    codeCheck: "isReturnAllowed(order) => deliveredDaysAgo > 7 || isOpened => returns false",
    verdict: 'REFUSED',
    ariaResponse: '"I completely understand, but our return policy only covers unopened products returned within 7 days of delivery for hygiene and safety reasons. Since your product has been opened and was delivered 20 days ago, I won\'t be able to process a return."',
    rationale: 'Aria stands firm on brand hygiene rules with warm empathy, strictly avoiding hallucinated refund promises.'
  },
  {
    id: 'cancel-out-for-delivery',
    title: 'Cancel Order In Transit (ORD-101 Out for Delivery)',
    customerPrompt: '"Please cancel my order ORD-101 immediately, I changed my mind."',
    category: 'cancellations',
    policyClause: 'Section 3: Cancellation Policy — Orders can be cancelled ONLY while status is Processing. Once Shipped or Out for Delivery, cannot be cancelled.',
    codeCheck: "cancelOrder('ORD-101') => status === 'Out for Delivery' => rejection with refusal advice",
    verdict: 'REFUSED',
    ariaResponse: '"I checked order ORD-101 for you. Since it is already out for delivery with BlueDart and expected by 6 PM today, I cannot cancel it in the system. However, you can simply refuse the delivery when the courier arrives at your doorstep."',
    rationale: 'Deterministic cancellation state machine blocks database mutation and provides actionable doorstep refusal advice.'
  },
  {
    id: 'cancel-processing',
    title: 'Cancel Eligible Processing Order (ORD-103)',
    customerPrompt: '"I placed order ORD-103 3 hours ago. Can you cancel it?"',
    category: 'cancellations',
    policyClause: 'Section 3: Cancellation Policy — Orders can be cancelled while status is Processing.',
    codeCheck: "cancelOrder('ORD-103') => status === 'Processing' => status mutated to 'Cancelled'",
    verdict: 'APPROVED',
    ariaResponse: '"I have successfully cancelled your order ORD-103 for the Green Tea Face Wash and Toner. Since it was still processing, your cancellation was processed instantly and a confirmation has been sent to your email."',
    rationale: 'Aria executes the cancellation tool and immediately mutates in-memory order state to Cancelled.'
  },
  {
    id: 'out-of-scope-flight',
    title: 'Out of Scope Request (Flight Booking)',
    customerPrompt: '"Can you book me a flight ticket to Goa this weekend?"',
    category: 'out_of_scope',
    policyClause: 'Brand Guardrails — Agent strictly restricts conversation to Aura Skincare products, policies, and orders.',
    codeCheck: "isOutOfScope(prompt) => matches airline/booking intent => deflects politely",
    verdict: 'DEFLECTED',
    ariaResponse: '"I am specifically specialized in Aura Skincare products and order assistance. While I would love to help you plan a holiday, I can only assist with skincare recommendations, order tracking, and brand policies!"',
    rationale: 'Immediate polite deflection preserves brand reputation and operational integrity.'
  },
  {
    id: 'cod-threshold',
    title: 'High-Value COD Inquiry (₹3,200 Cart Value)',
    customerPrompt: '"My total cart is 3,200 Rupees. Can I pay Cash on Delivery?"',
    category: 'payments',
    policyClause: 'Section 3: Cash on Delivery — COD is supported for domestic orders up to ₹2,500 maximum.',
    codeCheck: "isCodEligible(cartValue) => 3200 > 2500 => requires prepaid checkout",
    verdict: 'REFUSED',
    ariaResponse: '"Our Cash on Delivery service is available for orders up to 2,500 Rupees. Because your order total is 3,200 Rupees, it will need to be placed via prepaid payment such as UPI or card at checkout."',
    rationale: 'Aria accurately explains the ₹2,500 COD threshold and guides the customer to prepaid payment methods.'
  },
  {
    id: 'invalid-order-lookup',
    title: 'Non-Existent Order ID (ORD-999)',
    customerPrompt: '"Can you tell me where my order ORD-999 is?"',
    category: 'invalid_id',
    policyClause: 'Graceful Degradation — Handle missing orders without crashing or hallucinating delivery dates.',
    codeCheck: "getOrderDetails('ORD-999') => returns null => prompts customer for correct ID",
    verdict: 'CLARIFICATION_REQUESTED',
    ariaResponse: '"I could not locate order ORD-999 in our system. Could you please double-check your order confirmation email or SMS and verify the ID for me?"',
    rationale: 'Aria reports the absence of the order clearly without inventing fake tracking numbers or ETA.'
  }
];

export default function PoliciesPage() {
  const [selectedScenario, setSelectedScenario] = useState<PolicyScenario>(POLICY_SCENARIOS[0]);

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
    <div className="container" style={{ paddingTop: '32px', paddingBottom: '60px' }}>
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '24px' }}>
        <Link href="/" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--text-secondary)',
          fontSize: '12px',
          marginBottom: '8px'
        }}>
          <ArrowLeft size={13} />
          <span>Return to Voice Concierge</span>
        </Link>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
          Brand Policies &amp; Knowledge Center
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '780px' }}>
          Official rules governing delivery thresholds, return eligibility, order cancellations, and payment limits for Aura Skincare.
        </p>
      </div>

      {/* ── Brand Overview Banner ────────────────────────────────────────────── */}
      <div className="glass-card" style={{
        marginBottom: '24px',
        padding: '20px 24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold-primary)'
            }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>{AURA_BRAND_OVERVIEW.name}</h2>
              <span style={{ fontSize: '12px', color: 'var(--gold-light)' }}>{AURA_BRAND_OVERVIEW.tagline}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--emerald-subtle)',
              border: '1px solid var(--emerald-border)',
              fontSize: '11px',
              color: 'var(--emerald-accent)',
              fontWeight: 600
            }}>
              <CheckCircle2 size={12} />
              <span>Deterministic Enforcement</span>
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--gold-subtle)',
              border: '1px solid var(--border-gold)',
              fontSize: '11px',
              color: 'var(--gold-light)',
              fontWeight: 600
            }}>
              <span>Indian English Cadence (en-IN)</span>
            </span>
          </div>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '10px' }}>
          {AURA_BRAND_OVERVIEW.description}
        </p>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-muted)' }}>
          <span>Agent Persona: <strong style={{ color: '#FFF' }}>Aria</strong></span>
          <span>•</span>
          <span>Spoken Turn Budget: <strong style={{ color: '#FFF' }}>Max 2–3 Sentences</strong></span>
          <span>•</span>
          <span>Validation Gate: <strong style={{ color: '#FFF' }}>TypeScript Rules in Code</strong></span>
        </div>
      </div>

      {/* ── Core Policy Matrix ────────────────────────────────────────────── */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Compass size={16} color="var(--gold-primary)" />
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>Core Brand Policy Matrix</h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px'
        }}>
          {BRAND_POLICIES.map((policy) => {
            const Icon = getPolicyIcon(policy.category);
            return (
              <div
                key={policy.id}
                className="glass-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '20px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: 'var(--radius-xs)',
                      background: 'var(--bg-inset)',
                      border: '1px solid var(--border-gold)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--gold-primary)'
                    }}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#FFFFFF' }}>
                        {policy.title}
                      </h3>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {policy.category}
                      </span>
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-gold)',
                    fontSize: '12px',
                    color: 'var(--gold-light)',
                    marginBottom: '14px',
                    lineHeight: 1.5
                  }}>
                    <strong style={{ color: '#FFFFFF' }}>Rule:</strong> {policy.summary}
                  </div>

                  {/* Detailed clauses */}
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {policy.details.map((detail, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        <CheckCircle2 size={13} color="var(--emerald-accent)" style={{ flexShrink: 0, marginTop: '3px' }} />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{
                  marginTop: '16px',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  color: 'var(--text-muted)'
                }}>
                  <span>Enforcement Type:</span>
                  <span style={{ color: 'var(--emerald-accent)', fontWeight: 600 }}>Deterministic Code Gate</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Interactive Policy Enforcement Simulator ────────────────────────── */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={16} color="var(--gold-primary)" />
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>Interactive Policy Enforcement Simulator</h2>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Inspect how Aria evaluates real customer inquiries against brand code gates
          </span>
        </div>

        {/* Scenario Selection Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {POLICY_SCENARIOS.map((sc) => {
            const isSelected = selectedScenario.id === sc.id;
            return (
              <button
                key={sc.id}
                type="button"
                onClick={() => setSelectedScenario(sc)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-inset)',
                  border: `1px solid ${isSelected ? 'var(--border-gold)' : 'var(--border-subtle)'}`,
                  color: isSelected ? 'var(--gold-light)' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: isSelected ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Play size={10} fill={isSelected ? 'var(--gold-primary)' : 'transparent'} color={isSelected ? 'var(--gold-primary)' : 'currentColor'} />
                <span>{sc.title}</span>
              </button>
            );
          })}
        </div>

        {/* Active Scenario Card */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--gold-primary)', fontWeight: 600 }}>
                Selected Test Scenario
              </span>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
                {selectedScenario.title}
              </h3>
            </div>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              background: selectedScenario.verdict === 'APPROVED' ? 'var(--emerald-subtle)' : 'rgba(239, 68, 68, 0.12)',
              border: `1px solid ${selectedScenario.verdict === 'APPROVED' ? 'var(--emerald-border)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: selectedScenario.verdict === 'APPROVED' ? 'var(--emerald-accent)' : '#F87171',
              fontSize: '11px',
              fontWeight: 700
            }}>
              {selectedScenario.verdict === 'APPROVED' ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
              <span>DECISION: {selectedScenario.verdict}</span>
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '16px' }}>
            <div className="sub-card">
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                1. Customer Utterance
              </span>
              <p style={{ fontSize: '13px', color: '#FFFFFF', fontStyle: 'italic', marginTop: '4px', lineHeight: 1.5 }}>
                {selectedScenario.customerPrompt}
              </p>
            </div>

            <div className="sub-card">
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--gold-primary)', fontWeight: 600 }}>
                2. Applicable Brand Policy Clause
              </span>
              <p style={{ fontSize: '12px', color: 'var(--gold-light)', marginTop: '4px', lineHeight: 1.5 }}>
                {selectedScenario.policyClause}
              </p>
            </div>

            <div className="sub-card">
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--emerald-accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Code2 size={11} />
                <span>3. Deterministic Code Gate</span>
              </span>
              <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#A7F3D0', marginTop: '4px', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                {selectedScenario.codeCheck}
              </pre>
            </div>
          </div>

          {/* Voice Response Preview */}
          <div style={{
            padding: '16px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-inset)',
            border: '1px solid var(--border-gold)',
            marginBottom: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Sparkles size={14} color="var(--gold-primary)" />
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--gold-light)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Aria Spoken Response (Synthesized en-IN)
              </span>
            </div>
            <p style={{ fontSize: '14px', color: '#FFFFFF', lineHeight: 1.6, fontWeight: 500 }}>
              {selectedScenario.ariaResponse}
            </p>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} color="var(--emerald-accent)" />
            <span><strong>Engineering Rationale:</strong> {selectedScenario.rationale}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
