import { Package, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function OrdersPage() {
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
          Live Order Management System (OMS)
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Live mock order database with real-time state mutation and fulfillment tracking.
        </p>
      </div>

      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--gold-primary)', marginBottom: '16px' }}>
          <Package size={24} />
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>Database Orders</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Mounting live reactive order cards for ORD-101, ORD-102, and ORD-103 in Chunk 2.
        </p>
      </div>
    </div>
  );
}
