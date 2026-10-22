import { Cpu, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ArchitecturePage() {
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
          System Architecture & Evaluator Technical Dossier
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Interactive voice pipeline diagram, latency budget waterfall, and full answers to Section 9 questions.
        </p>
      </div>

      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--gold-primary)', marginBottom: '16px' }}>
          <Cpu size={24} />
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>Architecture Inspector</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Mounting pipeline flowchart, latency waterfall, and Section 9 architectural reasoning in Chunk 5.
        </p>
      </div>
    </div>
  );
}
