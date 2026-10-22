import { BarChart3, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AnalyticsPage() {
  return (
    <div className="container" style={{ paddingTop: '40px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--text-secondary)',
          fontSize: '13px',
          marginBottom: '12px'
        }}>
          <ArrowLeft size={14} />
          <span>Back to Voice Studio</span>
        </Link>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 800, color: '#FFFFFF' }}>
          Call Analytics & CRM Telemetry
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Post-call structured JSON logs, intent categorization, CSAT sentiment scores, and latency benchmarks.
        </p>
      </div>

      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--gold-primary)', marginBottom: '16px' }}>
          <BarChart3 size={24} />
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>Telemetry Console</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Mounting real-time call telemetry log stream and JSON inspector in Chunk 5.
        </p>
      </div>
    </div>
  );
}
