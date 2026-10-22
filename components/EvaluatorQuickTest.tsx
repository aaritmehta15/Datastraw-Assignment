'use client';

import { Sparkles, Send, CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';

interface EvaluatorQuickTestProps {
  onSelectScenario: (prompt: string) => void;
  disabled?: boolean;
}

export default function EvaluatorQuickTest({ onSelectScenario, disabled }: EvaluatorQuickTestProps) {
  const SCENARIOS = [
    {
      id: 'ord-101-track',
      label: 'Track ORD-101',
      badge: 'BlueDart • Out for Delivery',
      prompt: 'Where is my order ORD-101?',
      intent: 'Order Tracking',
      expected: 'Aria reports expected delivery by 6 PM today via BlueDart.',
      color: '#10B981',
      icon: CheckCircle2
    },
    {
      id: 'ord-101-cancel',
      label: 'Try Cancel ORD-101',
      badge: 'Policy Rejection Test',
      prompt: 'I want to cancel my order ORD-101',
      intent: 'Dispatched Cancellation',
      expected: 'Aria strictly denies cancellation; advises doorstep delivery refusal.',
      color: '#EF4444',
      icon: XCircle
    },
    {
      id: 'ord-102-return',
      label: 'Return ORD-102',
      badge: '14-Day Policy Expiry Test',
      prompt: 'Can I return order ORD-102? I bought it 14 days ago.',
      intent: 'Expired Return',
      expected: 'Aria politely declines refund under 7-day unopened policy.',
      color: '#F59E0B',
      icon: AlertTriangle
    },
    {
      id: 'ord-103-cancel',
      label: 'Cancel ORD-103',
      badge: 'Eligible Processing Mutation',
      prompt: 'Please cancel my order ORD-103',
      intent: 'Valid Cancellation',
      expected: 'Aria executes cancellation; status mutates to Cancelled in DB.',
      color: '#8B5CF6',
      icon: CheckCircle2
    },
    {
      id: 'ord-999-invalid',
      label: 'Test Invalid ORD-999',
      badge: 'Graceful Error Recovery',
      prompt: 'What is the status of ORD-999?',
      intent: 'Missing Order Recovery',
      expected: 'Aria politely explains order not found and asks to verify ID.',
      color: '#6B7280',
      icon: HelpCircle
    },
    {
      id: 'out-of-scope',
      label: 'Out of Scope Query',
      badge: 'Brand Guardrail Test',
      prompt: 'Can you book me a flight to Goa for this weekend?',
      intent: 'Out of Scope Guardrail',
      expected: 'Aria politely clarifies she only handles Aura Skincare inquiries.',
      color: '#EC4899',
      icon: Sparkles
    }
  ];

  return (
    <div className="glass-card" style={{ marginTop: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="var(--gold-primary)" />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.02em' }}>
            Evaluator Quick-Test Helper (1-Click Scenarios)
          </h3>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Click any scenario to simulate speech directly into Aria's audio loop
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '12px'
      }}>
        {SCENARIOS.map((sc) => {
          const Icon = sc.icon;
          return (
            <button
              key={sc.id}
              onClick={() => onSelectScenario(sc.prompt)}
              disabled={disabled}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                textAlign: 'left',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(7, 25, 18, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!disabled) {
                  e.currentTarget.style.borderColor = sc.color;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 4px 16px ${sc.color}25`;
                }
              }}
              onMouseLeave={(e) => {
                if (!disabled) {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                  {sc.label}
                </span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: `${sc.color}20`,
                  color: sc.color,
                  border: `1px solid ${sc.color}40`
                }}>
                  {sc.badge}
                </span>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-gold)', fontStyle: 'italic', marginBottom: '6px' }}>
                &ldquo;{sc.prompt}&rdquo;
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon size={12} color={sc.color} />
                <span>{sc.expected}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
