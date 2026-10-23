'use client';

import { useState } from 'react';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Ban,
  CreditCard,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Sparkles,
  Cpu,
  Code2,
  Compass,
  HelpCircle,
  Play,
  BookOpen,
  Sliders,
  Mic,
  Search,
  Volume2,
  Terminal
} from 'lucide-react';
import Link from 'next/link';
import { BRAND_POLICIES, AURA_BRAND_OVERVIEW } from '@/lib/brandKnowledge';

// Interactive policy scenarios for evaluators & viewers to test
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
    customerPrompt: '"Can you book me a flight ticket to Goa for this weekend?"',
    category: 'out_of_scope',
    policyClause: 'Section 2.B: Out-of-Scope Guardrails — Agent must politely decline queries outside Aura Skincare.',
    codeCheck: "intentClassifier(text) => category === 'OUT_OF_SCOPE' => deflect gracefully",
    verdict: 'DEFLECTED',
    ariaResponse: '"I would love to help, but I am Aria, the customer specialist for Aura Skincare! I can only assist with your skincare orders, shipping, and product recommendations. How can I help you with your skincare routine today?"',
    rationale: 'Maintains brand persona integrity without falling into prompt injection traps or general chatbot drifting.'
  },
  {
    id: 'cod-limit-exceeded',
    title: 'High-Value COD Inquiry (₹3,200 Cart Value)',
    customerPrompt: '"My order total is ₹3,200. Can I choose Cash on Delivery?"',
    category: 'payments',
    policyClause: 'Section 3: Cash on Delivery — COD is available for orders up to ₹2,500 only. Orders above ₹2,500 require prepaid payment.',
    codeCheck: "cartValue > 2500 => cod_eligible = false => suggest UPI / Prepaid",
    verdict: 'REFUSED',
    ariaResponse: '"Cash on Delivery is available for orders up to ₹2,500. For orders above this amount, we require prepaid payment via UPI, Credit Card, or Net Banking for secure fulfillment. You can easily complete payment via UPI at checkout!"',
    rationale: 'Accurately quotes the ₹2,500 threshold and offers smooth prepaid alternatives.'
  },
  {
    id: 'invalid-order-id',
    title: 'Non-Existent Order ID (ORD-999)',
    customerPrompt: '"Where is my package for order ORD-999?"',
    category: 'invalid_id',
    policyClause: 'Section 2.B: Graceful Degradation — If order ID does not exist, ask politely to verify rather than hallucinating.',
    codeCheck: "lookupOrder('ORD-999') => null => graceful recovery prompt",
    verdict: 'CLARIFICATION_REQUESTED',
    ariaResponse: '"I looked through our database, but I couldn\'t locate any order matching ORD-999. Could you please double-check your order confirmation email or SMS and share the 3-digit order number again?"',
    rationale: 'Graceful degradation prevents hallucinating a fake tracking number or courier status.'
  }
];

export default function PoliciesPage() {
  const [selectedScenario, setSelectedScenario] = useState<PolicyScenario>(POLICY_SCENARIOS[0]);
  const [activeTab, setActiveTab] = useState<'all' | 'simulator' | 'architecture'>('all');

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
    <div className="container" style={{ paddingTop: '36px', paddingBottom: '60px' }}>

      {/* ── Page Header ───────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '32px' }}>
        <Link href="/" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--text-secondary)',
          fontSize: '13px',
          marginBottom: '12px',
          transition: 'color 0.2s ease'
        }}>
          <ArrowLeft size={14} />
          <span>Return to Voice Studio</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px' }}>
              Brand Knowledge & Policy Architecture
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '780px' }}>
              Explore the deterministic business rules, hard guardrails, and real-time state machines that govern Aria&apos;s voice decisions for Aura Skincare.
            </p>
          </div>

          {/* Tab Selector */}
          <div style={{
            display: 'inline-flex',
            padding: '4px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--bg-glass-border)'
          }}>
            <button
              onClick={() => setActiveTab('all')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: 'var(--radius-full)',
                fontSize: '13px',
                fontWeight: 600,
                background: activeTab === 'all' ? 'var(--gold-primary)' : 'transparent',
                color: activeTab === 'all' ? '#071912' : 'var(--text-secondary)',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
            >
              <BookOpen size={14} />
              <span>Brand Policies</span>
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: 'var(--radius-full)',
                fontSize: '13px',
                fontWeight: 600,
                background: activeTab === 'simulator' ? 'var(--gold-primary)' : 'transparent',
                color: activeTab === 'simulator' ? '#071912' : 'var(--text-secondary)',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
            >
              <Sliders size={14} />
              <span>Live Policy Simulator</span>
            </button>
            <button
              onClick={() => setActiveTab('architecture')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: 'var(--radius-full)',
                fontSize: '13px',
                fontWeight: 600,
                background: activeTab === 'architecture' ? 'var(--gold-primary)' : 'transparent',
                color: activeTab === 'architecture' ? '#071912' : 'var(--text-secondary)',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
            >
              <ShieldCheck size={14} />
              <span>How It Works Underneath</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Brand Overview Banner ────────────────────────────────────────────── */}
      <div className="glass-card" style={{
        marginBottom: '32px',
        background: 'linear-gradient(135deg, rgba(16, 75, 56, 0.45) 0%, rgba(7, 25, 18, 0.85) 100%)',
        border: '1px solid var(--bg-glass-border)',
        padding: '24px 28px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(212, 175, 55, 0.15)',
              border: '1px solid var(--gold-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold-primary)'
            }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF' }}>{AURA_BRAND_OVERVIEW.name}</h2>
              <span style={{ fontSize: '13px', color: 'var(--gold-light)', fontWeight: 500 }}>{AURA_BRAND_OVERVIEW.tagline}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: 'var(--radius-full)',
              background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--emerald-accent)',
              fontSize: '12px', color: 'var(--emerald-accent)', fontWeight: 600
            }}>
              <CheckCircle2 size={13} />
              <span>Zero-Hallucination Guardrails</span>
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: 'var(--radius-full)',
              background: 'rgba(212, 175, 55, 0.15)', border: '1px solid var(--gold-primary)',
              fontSize: '12px', color: 'var(--gold-light)', fontWeight: 600
            }}>
              <span>🇮🇳 Indian Accent (en-IN)</span>
            </span>
          </div>
        </div>

        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '14px' }}>
          {AURA_BRAND_OVERVIEW.description}
        </p>

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--text-muted)' }}>
          <span>Agent Persona: <strong style={{ color: '#FFF' }}>Aria</strong></span>
          <span>•</span>
          <span>Voice Cadence: <strong style={{ color: '#FFF' }}>Concise (max 2-3 spoken sentences)</strong></span>
          <span>•</span>
          <span>Decision Logic: <strong style={{ color: '#FFF' }}>Code-Level Deterministic Verification</strong></span>
        </div>
      </div>

      {/* ── TAB 1: ALL BRAND POLICIES (DEEP DIVE) ────────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'simulator') && (
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <Compass size={20} color="var(--gold-primary)" />
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#FFF' }}>Core Policy Matrix (DataStraw Specification)</h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '20px'
          }}>
            {BRAND_POLICIES.map((policy) => {
              const Icon = getPolicyIcon(policy.category);
              return (
                <div key={policy.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'rgba(212, 175, 55, 0.12)',
                        border: '1px solid var(--gold-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--gold-primary)'
                      }}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#FFFFFF' }}>
                          {policy.title}
                        </h3>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Category: {policy.category}
                        </span>
                      </div>
                    </div>

                    {/* Summary Rule Box */}
                    <div style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(212, 175, 55, 0.08)',
                      border: '1px solid rgba(212, 175, 55, 0.22)',
                      fontSize: '12px',
                      color: 'var(--gold-light)',
                      marginBottom: '16px',
                      lineHeight: 1.5
                    }}>
                      <strong style={{ color: '#FFF' }}>Canonical Rule:</strong> {policy.summary}
                    </div>

                    {/* Detailed clauses */}
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {policy.details.map((detail, idx) => (
                        <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          <CheckCircle2 size={15} color="var(--emerald-accent)" style={{ flexShrink: 0, marginTop: '3px' }} />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div style={{
                    marginTop: '20px',
                    paddingTop: '14px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px',
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
      )}

      {/* ── TAB 2: LIVE POLICY SIMULATOR / PLAYGROUND ────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'simulator') && (
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={20} color="var(--gold-primary)" />
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#FFF' }}>Interactive Policy Enforcement Simulator</h2>
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Click any scenario below to inspect how Aria&apos;s guardrails execute in real time:
            </span>
          </div>

          {/* Scenario Selection Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
            {POLICY_SCENARIOS.map((sc) => {
              const isSelected = selectedScenario.id === sc.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => setSelectedScenario(sc)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? 'rgba(212, 175, 55, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${isSelected ? 'var(--gold-primary)' : 'rgba(255, 255, 255, 0.1)'}`,
                    color: isSelected ? 'var(--gold-light)' : 'var(--text-secondary)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Play size={12} fill={isSelected ? 'var(--gold-primary)' : 'transparent'} />
                  <span>{sc.title}</span>
                </button>
              );
            })}
          </div>

          {/* Detailed Scenario Execution Card */}
          <div className="glass-card" style={{
            background: 'rgba(7, 25, 18, 0.9)',
            border: '1px solid var(--gold-primary)',
            padding: '28px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold-primary)', fontWeight: 700 }}>
                  Active Test Scenario
                </span>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#FFF', marginTop: '2px' }}>
                  {selectedScenario.title}
                </h3>
              </div>

              {/* Verdict Pill */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                background: selectedScenario.verdict === 'APPROVED' ? 'rgba(16, 185, 129, 0.18)'
                  : selectedScenario.verdict === 'REFUSED' ? 'rgba(239, 68, 68, 0.18)'
                  : selectedScenario.verdict === 'DEFLECTED' ? 'rgba(245, 158, 11, 0.18)'
                  : 'rgba(139, 92, 246, 0.18)',
                border: `1px solid ${selectedScenario.verdict === 'APPROVED' ? 'var(--emerald-accent)'
                  : selectedScenario.verdict === 'REFUSED' ? '#EF4444'
                  : selectedScenario.verdict === 'DEFLECTED' ? '#F59E0B'
                  : '#8B5CF6'}`,
                color: '#FFF',
                fontSize: '12px',
                fontWeight: 700
              }}>
                {selectedScenario.verdict === 'APPROVED' && <CheckCircle2 size={14} color="var(--emerald-accent)" />}
                {selectedScenario.verdict === 'REFUSED' && <XCircle size={14} color="#EF4444" />}
                {selectedScenario.verdict === 'DEFLECTED' && <AlertTriangle size={14} color="#F59E0B" />}
                {selectedScenario.verdict === 'CLARIFICATION_REQUESTED' && <HelpCircle size={14} color="#8B5CF6" />}
                <span>DECISION: {selectedScenario.verdict}</span>
              </div>
            </div>

            {/* Step-by-step Execution Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '20px',
              marginBottom: '20px'
            }}>
              {/* Step 1: User Spoken Prompt */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                  1. Spoken Customer Utterance
                </span>
                <p style={{ fontSize: '14px', color: '#FFF', fontStyle: 'italic', marginTop: '6px', lineHeight: 1.5 }}>
                  {selectedScenario.customerPrompt}
                </p>
              </div>

              {/* Step 2: Triggered Policy Rule */}
              <div style={{
                background: 'rgba(212, 175, 55, 0.05)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(212, 175, 55, 0.15)'
              }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--gold-primary)', fontWeight: 600 }}>
                  2. Applicable Brand Policy Clause
                </span>
                <p style={{ fontSize: '13px', color: 'var(--gold-light)', marginTop: '6px', lineHeight: 1.5 }}>
                  {selectedScenario.policyClause}
                </p>
              </div>

              {/* Step 3: Deterministic Code Validation */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.4)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--emerald-accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Code2 size={12} />
                  <span>3. Deterministic Code Gate</span>
                </span>
                <pre style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: '#A7F3D0',
                  marginTop: '6px',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.4
                }}>
                  {selectedScenario.codeCheck}
                </pre>
              </div>
            </div>

            {/* Step 4: Aria's Spoken Response */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, rgba(16, 75, 56, 0.2) 100%)',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--gold-primary)',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Sparkles size={16} color="var(--gold-primary)" />
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gold-light)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  4. Aria&apos;s Voice Response (Synthesized in NeerjaNeural en-IN)
                </span>
              </div>
              <p style={{ fontSize: '15px', color: '#FFF', lineHeight: 1.6, fontWeight: 500 }}>
                {selectedScenario.ariaResponse}
              </p>
            </div>

            {/* Rationale & Guardrail Explanation */}
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} color="var(--emerald-accent)" />
              <span><strong>Guardrail Rationale:</strong> {selectedScenario.rationale}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: HOW IT WORKS UNDERNEATH (ARCHITECTURE COMPARISON) ─────────── */}
      {(activeTab === 'all' || activeTab === 'architecture') && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <Code2 size={20} color="var(--gold-primary)" />
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#FFF' }}>How the Policy Engine Works Underneath</h2>
          </div>

          {/* Architecture comparison: Probabilistic LLM vs Deterministic Code */}
          <div className="glass-card" style={{ padding: '28px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#FFF', marginBottom: '12px' }}>
              Why Code Guardrails Win Over Generic LLM Prompts
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
              Standard chatbots often succumb to customer pressure or hallucinate unauthorized refunds when given complex prompts. In Aura Skincare&apos;s architecture, all business rules are enforced <strong>deterministically in TypeScript before the voice layer speaks</strong>:
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '16px'
            }}>
              {/* Bad approach */}
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                padding: '20px',
                borderRadius: 'var(--radius-md)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F87171', marginBottom: '8px', fontWeight: 700, fontSize: '14px' }}>
                  <XCircle size={16} />
                  <span>Vulnerable: Pure Probabilistic LLM</span>
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <XCircle size={14} color="#EF4444" style={{ flexShrink: 0 }} />
                    <span>Relies solely on system prompt guidelines.</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <XCircle size={14} color="#EF4444" style={{ flexShrink: 0 }} />
                    <span>Customers can socially engineer refunds (&quot;I know your CEO&quot;).</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <XCircle size={14} color="#EF4444" style={{ flexShrink: 0 }} />
                    <span>Hallucinates fake tracking numbers for non-existent orders.</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <XCircle size={14} color="#EF4444" style={{ flexShrink: 0 }} />
                    <span>Agrees to cancel orders that are already on the delivery truck.</span>
                  </li>
                </ul>
              </div>

              {/* Our approach */}
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '20px',
                borderRadius: 'var(--radius-md)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--emerald-accent)', marginBottom: '8px', fontWeight: 700, fontSize: '14px' }}>
                  <CheckCircle2 size={16} />
                  <span>Aura Skincare: Deterministic State Machine</span>
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={14} color="#10B981" style={{ flexShrink: 0 }} />
                    <span>Tool execution strictly gated by code conditions.</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={14} color="#10B981" style={{ flexShrink: 0 }} />
                    <span>ORD-101 cancellation is physically rejected in `orderDatabase.ts`.</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={14} color="#10B981" style={{ flexShrink: 0 }} />
                    <span>Spoken variations (&quot;order 101&quot;, &quot;ORD one zero one&quot;) canonicalized by regex.</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={14} color="#10B981" style={{ flexShrink: 0 }} />
                    <span>Out-of-scope intent classifier deflects flight/external queries immediately.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Flowchart Diagram */}
          <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--gold-light)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              End-to-End Decision & Voice Flow
            </h4>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px'
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Mic size={14} />
                <span>Speech (en-IN)</span>
              </span>
              <ArrowRight size={14} color="var(--gold-primary)" />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(212,175,55,0.1)', border: '1px solid var(--gold-primary)', color: 'var(--gold-light)' }}>
                <Search size={14} />
                <span>Regex Normalizer</span>
              </span>
              <ArrowRight size={14} color="var(--gold-primary)" />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(16,185,129,0.1)', border: '1px solid var(--emerald-accent)', color: 'var(--emerald-accent)' }}>
                <ShieldCheck size={14} />
                <span>Policy Gate</span>
              </span>
              <ArrowRight size={14} color="var(--gold-primary)" />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(139,92,246,0.1)', border: '1px solid #8B5CF6', color: '#DDD6FE' }}>
                <Terminal size={14} />
                <span>Tool Calling</span>
              </span>
              <ArrowRight size={14} color="var(--gold-primary)" />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(212,175,55,0.15)', border: '1px solid var(--gold-primary)', color: '#FFF' }}>
                <Volume2 size={14} />
                <span>NeerjaNeural Audio</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
