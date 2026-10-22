'use client';

import { useState, useEffect } from 'react';
import { Package, ArrowLeft, RefreshCw, AlertCircle, CheckCircle2, XCircle, Truck, Clock, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Order } from '@/lib/types';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchOrders = async (reset = false) => {
    setLoading(true);
    try {
      const url = reset ? '/api/orders?reset=true' : '/api/orders';
      const res = await fetch(url);
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
        if (reset) {
          setActionMessage('Order database reset to seed state.');
          setTimeout(() => setActionMessage(null), 3000);
        }
      }
    } catch (e) {
      console.error('Error fetching orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Auto-refresh every 5 seconds to catch live voice cancellations!
    const interval = setInterval(() => {
      fetchOrders();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCancelClick = async (orderId: string) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', orderId })
      });
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
      }
      if (data.result?.message) {
        setActionMessage(data.result.message);
        setTimeout(() => setActionMessage(null), 5000);
      }
    } catch (e) {
      console.error('Error cancelling order:', e);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Processing': return '#F59E0B';
      case 'Out for Delivery': return '#38BDF8';
      case 'Delivered': return '#10B981';
      case 'Cancelled': return '#EF4444';
      default: return '#9CA3AF';
    }
  };

  return (
    <div className="container" style={{ paddingTop: '36px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <Link href="/" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-secondary)',
            fontSize: '13px',
            marginBottom: '10px'
          }}>
            <ArrowLeft size={14} />
            <span>Return to Voice Studio</span>
          </Link>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '34px', fontWeight: 800, color: '#FFFFFF', marginBottom: '6px' }}>
            Live Order Management System (OMS)
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            Real-time transactional mock order database. When Aria cancels an order over voice, its status mutates live on this dashboard.
          </p>
        </div>

        <button
          onClick={() => fetchOrders(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(212, 175, 55, 0.15)',
            border: '1px solid var(--gold-primary)',
            color: 'var(--gold-light)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Reset Seed Database</span>
        </button>
      </div>

      {/* Action Notification Toast */}
      {actionMessage && (
        <div style={{
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(212, 175, 55, 0.15)',
          border: '1px solid var(--gold-primary)',
          color: '#FFFFFF',
          fontSize: '13px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertCircle size={16} color="var(--gold-primary)" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Live Order Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '20px'
      }}>
        {orders.map((order) => {
          const statusColor = getStatusColor(order.status);
          return (
            <div
              key={order.orderId}
              className="glass-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderTop: `4px solid ${statusColor}`
              }}
            >
              <div>
                {/* Header Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Package size={20} color="var(--gold-primary)" />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>
                      {order.orderId}
                    </span>
                  </div>

                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-full)',
                    background: `${statusColor}20`,
                    color: statusColor,
                    border: `1px solid ${statusColor}50`
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: statusColor }} />
                    {order.status}
                  </span>
                </div>

                {/* Customer & Product Details */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', marginBottom: '2px' }}>
                    {order.product}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Customer: <strong style={{ color: 'var(--gold-light)' }}>{order.customerName}</strong>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Total Value: <strong style={{ color: '#FFFFFF' }}>₹{order.value}</strong> (Paid via COD/Prepaid)
                  </div>
                </div>

                {/* Fulfillment Carrier Notes */}
                <div style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(7, 25, 18, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  marginBottom: '16px',
                  fontSize: '12px',
                  lineHeight: 1.5
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-gold)', fontWeight: 600, marginBottom: '4px' }}>
                    <Truck size={13} />
                    <span>Fulfillment Status</span>
                  </div>
                  <div style={{ color: 'var(--text-primary)' }}>
                    {order.notes}
                  </div>
                </div>

                {/* Deterministic Guardrail Matrix */}
                <div style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(16, 42, 33, 0.4)',
                  border: '1px solid rgba(212, 175, 55, 0.15)',
                  marginBottom: '18px',
                  fontSize: '11px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--gold-primary)', fontWeight: 700 }}>
                    <ShieldAlert size={12} />
                    <span>POLICY STATE MACHINE</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Eligible for Cancellation:</span>
                    <strong style={{ color: order.canCancel ? '#10B981' : '#EF4444' }}>
                      {order.canCancel ? 'YES (Status: Processing)' : 'NO (Non-processing)'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Eligible for Return:</span>
                    <strong style={{ color: order.canReturn ? '#10B981' : '#EF4444' }}>
                      {order.canReturn ? 'YES (Within 7d)' : 'NO (Delivered 14d or Dispatched)'}
                    </strong>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px' }}>
                    {order.policyNotes}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                {order.status === 'Processing' && (
                  <button
                    onClick={() => handleCancelClick(order.orderId)}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid var(--status-error)',
                      color: '#FCA5A5',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel Order (ORD-103)
                  </button>
                )}
                {order.status !== 'Processing' && (
                  <button
                    onClick={() => handleCancelClick(order.orderId)}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'var(--text-muted)',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    Test Policy Rejection
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
