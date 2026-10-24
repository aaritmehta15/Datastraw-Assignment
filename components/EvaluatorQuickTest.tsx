'use client';

import { Package, CheckCircle2, AlertTriangle, XCircle, HelpCircle, MessageSquare } from 'lucide-react';

interface EvaluatorQuickTestProps {
  onSelectScenario: (prompt: string) => void;
  disabled?: boolean;
}

export default function EvaluatorQuickTest({ onSelectScenario, disabled }: EvaluatorQuickTestProps) {
  const SAMPLE_ORDERS = [
    {
      id: 'ORD-101',
      customer: 'Priya Sharma',
      product: 'Vitamin C Serum (30ml)',
      value: '₹699',
      carrier: 'BlueDart (BD-982103)',
      status: 'Out for Delivery',
      statusColor: '#38BDF8',
      prompts: [
        { label: 'Track Order', text: 'Where is my order ORD-101?' },
        { label: 'Request Cancel', text: 'I want to cancel my order ORD-101' },
        { label: '48h Damaged Bottle', text: 'My serum bottle arrived shattered today. Can you replace it?' }
      ],
      policyNote: 'Dispatched with carrier. Cancellation forbidden. 48h replacement eligible with photo.'
    },
    {
      id: 'ORD-102',
      customer: 'Rahul Verma',
      product: 'Hydrating Sunscreen SPF 50',
      value: '₹499',
      carrier: 'Delhivery (DL-441029)',
      status: 'Delivered (14d ago)',
      statusColor: '#10B981',
      prompts: [
        { label: 'Request Return', text: 'Can I return order ORD-102? I bought it 14 days ago.' },
        { label: '14d Damaged Claim', text: 'My sunscreen arrived damaged 14 days ago. Can I get a replacement?' }
      ],
      policyNote: 'Delivered 14 days ago. Exceeds 7-day return and 48-hour damage reporting window.'
    },
    {
      id: 'ORD-103',
      customer: 'Ananya Patel',
      product: 'Green Tea Face Wash + Toner',
      value: '₹850',
      carrier: 'Warehouse (Unassigned)',
      status: 'Processing',
      statusColor: '#F59E0B',
      prompts: [
        { label: 'Cancel Order', text: 'Please cancel my order ORD-103' },
      ],
      policyNote: 'In warehouse queue. Fully eligible for instant cancellation.'
    }
  ];

  const COMMON_INQUIRIES = [
    { label: 'Vitamin C Ingredients', prompt: 'What active ingredients are in your Vitamin C serum and how do I apply it?' },
    { label: 'Sunscreen on Oily Skin', prompt: 'Is your sunscreen suitable for oily skin and does it leave a white cast?' },
    { label: 'Kumkumadi Oil Benefits', prompt: 'What are the ingredients and skin benefits of Kumkumadi Night Oil?' },
    { label: 'Lookup by Customer Name', prompt: 'Hi, I am Priya Sharma. What is the status of my order?' },
    { label: 'Product Exchange Rule', prompt: 'Can I exchange my sunscreen for the Kumkumadi night oil?' },
    { label: 'Shipping Rules', prompt: 'What are your delivery charges and timelines?' },
    { label: 'COD Limit', prompt: 'Is Cash on Delivery available, and what is the limit?' },
    { label: 'Out of Scope', prompt: 'Can you book me a flight ticket to Goa?' },
  ];

  return (
    <div className="enterprise-card" style={{ marginTop: '20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        paddingBottom: '14px',
        borderBottom: '1px solid var(--border-subtle)',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Package size={16} color="var(--gold-primary)" />
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', letterSpacing: '0.02em' }}>
            Sample Customer Orders & Common Inquiries
          </h3>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Click any prompt below to test Aria&apos;s live database lookup and policy verification
        </span>
      </div>

      {/* Sample Orders Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '12px',
        marginBottom: '16px'
      }}>
        {SAMPLE_ORDERS.map((ord) => (
          <div
            key={ord.id}
            style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                  {ord.id}
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${ord.statusColor}50`,
                  color: ord.statusColor
                }}>
                  {ord.status}
                </span>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>
                {ord.product}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {ord.customer} • <span style={{ color: 'var(--text-gold)' }}>{ord.value}</span> • {ord.carrier}
              </div>
            </div>

            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {ord.prompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSelectScenario(p.text)}
                    disabled={disabled}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-inset)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <MessageSquare size={11} color="var(--gold-primary)" />
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Common Policy Questions Strip */}
      <div style={{
        padding: '12px 14px',
        background: 'var(--bg-inset)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Suggested Inquiries:
        </span>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {COMMON_INQUIRIES.map((inq, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectScenario(inq.prompt)}
              disabled={disabled}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                fontSize: '11px',
                fontWeight: 500,
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{inq.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
