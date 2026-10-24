'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Package,
  ArrowLeft,
  RefreshCw,
  Plus,
  ShieldCheck,
  Truck,
  X,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { Order, OrderStatus } from '@/lib/types';

const PRODUCT_CATALOG = [
  { name: 'Vitamin C Glow Serum (30ml)', defaultPrice: 699, category: 'Serum' },
  { name: 'Hydrating Sunscreen SPF 50', defaultPrice: 499, category: 'SPF 50' },
  { name: 'Green Tea Face Wash + Toner', defaultPrice: 850, category: 'Cleanser' },
  { name: 'Kumkumadi Night Oil (15ml)', defaultPrice: 1299, category: 'Oil' },
  { name: 'Ceramide Barrier Cream', defaultPrice: 749, category: 'Cream' },
  { name: 'Rosewater Balancing Mist', defaultPrice: 399, category: 'Mist' },
];

const PRESET_CUSTOMERS = ['Pooja Hegde', 'Vikram Mehra', 'Aditi Rao', 'Sameer Khan', 'Deepika Sen'];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Form state for creating a manual order
  const [formOrderId, setFormOrderId] = useState('');
  const [autoOrderId, setAutoOrderId] = useState(true);
  const [formCustomer, setFormCustomer] = useState('Pooja Hegde');
  const [formProduct, setFormProduct] = useState(PRODUCT_CATALOG[0].name);
  const [customProduct, setCustomProduct] = useState('');
  const [formValue, setFormValue] = useState<number>(699);
  const [formStatus, setFormStatus] = useState<OrderStatus>('Processing');
  const [formCarrier, setFormCarrier] = useState('BlueDart');
  const [formDeliveryETA, setFormDeliveryETA] = useState('Expected by 6 PM today');
  const [formDaysSinceDelivery, setFormDaysSinceDelivery] = useState<number>(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchOrders = async (reset = false) => {
    setLoading(true);
    try {
      const url = reset ? '/api/orders?reset=true' : '/api/orders';
      const res = await fetch(url);
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
        if (reset) {
          setActionMessage('Order database reset to default seed state.');
          setTimeout(() => setActionMessage(null), 4000);
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

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const chosenProduct = customProduct.trim() ? customProduct.trim() : formProduct;

    const payload = {
      orderId: autoOrderId ? undefined : formOrderId.trim(),
      customerName: formCustomer.trim() || 'Valued Customer',
      product: chosenProduct,
      value: Number(formValue) || 699,
      status: formStatus,
      carrier: formStatus === 'Processing' ? 'Unassigned (Warehouse)' : formCarrier,
      estimatedDelivery: formStatus === 'Out for Delivery' || formStatus === 'Shipped' ? formDeliveryETA : undefined,
      deliveredDate: formStatus === 'Delivered' ? `${formDaysSinceDelivery} days ago` : undefined,
      daysSinceDelivery: formStatus === 'Delivered' ? formDaysSinceDelivery : undefined,
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', orderData: payload })
      });
      const data = await res.json();

      if (data.success && data.orders) {
        setOrders(data.orders);
        setIsCreateModalOpen(false);
        setActionMessage(data.result?.message || 'New order recorded in live database!');
        setTimeout(() => setActionMessage(null), 5000);
      } else {
        alert(data.message || 'Failed to create order');
      }
    } catch (err) {
      console.error('Create order error:', err);
      alert('Error connecting to order database');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Processing':
        return { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', label: 'Processing' };
      case 'Out for Delivery':
        return { color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.12)', label: 'Out for Delivery' };
      case 'Delivered':
        return { color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', label: 'Delivered' };
      case 'Cancelled':
        return { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)', label: 'Cancelled' };
      case 'Shipped':
        return { color: '#C5A059', bg: 'rgba(197, 160, 89, 0.12)', label: 'Shipped' };
      default:
        return { color: '#94A3B8', bg: 'rgba(255, 255, 255, 0.05)', label: status };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Processing': return '#F59E0B';
      case 'Out for Delivery': return '#38BDF8';
      case 'Delivered': return '#10B981';
      case 'Cancelled': return '#EF4444';
      case 'Shipped': return '#8B5CF6';
      default: return '#9CA3AF';
    }
  };

  const nextOrderNumber = useMemo(() => {
    if (orders.length === 0) return 104;
    const nums = orders.map(o => parseInt(o.orderId.replace(/\D/g, ''), 10)).filter(n => !isNaN(n));
    return nums.length > 0 ? Math.max(...nums) + 1 : 104;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'All') return orders;
    return orders.filter(o => o.status === statusFilter);
  }, [orders, statusFilter]);

  const counts = useMemo(() => {
    return {
      all: orders.length,
      processing: orders.filter(o => o.status === 'Processing').length,
      transit: orders.filter(o => o.status === 'Out for Delivery' || o.status === 'Shipped').length,
      delivered: orders.filter(o => o.status === 'Delivered').length,
      cancelled: orders.filter(o => o.status === 'Cancelled').length,
    };
  }, [orders]);

  return (
    <div className="container" style={{ paddingTop: '32px', paddingBottom: '60px' }}>
      {/* ── Page Header ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
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
            Order Management System (OMS)
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Live transactional database. Order status mutations executed by Aria over voice synchronize with this dashboard in real time.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 18px',
              borderRadius: 'var(--radius-sm)',
              background: '#2563EB',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 600,
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <Plus size={15} />
            <span>New Custom Order</span>
          </button>

          <button
            type="button"
            onClick={() => fetchOrders(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Reset Seed Database</span>
          </button>
        </div>
      </div>

      {/* ── Metric Summary Bar ────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div className="sub-card" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Orders</span>
          <strong style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF' }}>{counts.all}</strong>
        </div>
        <div className="sub-card" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>In Warehouse Queue</span>
          <strong style={{ fontSize: '20px', fontWeight: 700, color: '#F59E0B' }}>{counts.processing}</strong>
        </div>
        <div className="sub-card" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Out for Delivery</span>
          <strong style={{ fontSize: '20px', fontWeight: 700, color: '#38BDF8' }}>{counts.transit}</strong>
        </div>
        <div className="sub-card" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Delivered</span>
          <strong style={{ fontSize: '20px', fontWeight: 700, color: '#10B981' }}>{counts.delivered}</strong>
        </div>
        <div className="sub-card" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cancelled</span>
          <strong style={{ fontSize: '20px', fontWeight: 700, color: '#EF4444' }}>{counts.cancelled}</strong>
        </div>
      </div>

      {/* ── Status Toast ────────────────────────────────────────── */}
      {actionMessage && (
        <div style={{
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--emerald-subtle)',
          border: '1px solid var(--emerald-border)',
          color: '#FFFFFF',
          fontSize: '13px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} color="var(--emerald-accent)" />
            <span>{actionMessage}</span>
          </div>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--emerald-accent)',
              color: '#071912',
              fontSize: '11px',
              fontWeight: 700
            }}
          >
            <PhoneCall size={11} />
            <span>Test with Aria</span>
          </Link>
        </div>
      )}

      {/* ── Filter Tabs ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {['All', 'Processing', 'Out for Delivery', 'Delivered', 'Cancelled'].map((tab) => {
          const isSelected = statusFilter === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                background: isSelected ? 'var(--bg-surface-elevated)' : 'transparent',
                border: `1px solid ${isSelected ? 'var(--border-gold)' : 'var(--border-subtle)'}`,
                color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: isSelected ? 600 : 500,
                transition: 'all 0.15s ease'
              }}
            >
              <span>{tab}</span>
            </button>
          );
        })}
      </div>

      {/* ── Orders Grid ────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '16px'
      }}>
        {filteredOrders.map((order) => {
          const badge = getStatusBadge(order.status);
          return (
            <div
              key={order.orderId}
              className="glass-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '20px'
              }}
            >
              <div>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Package size={16} color="var(--gold-primary)" />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
                      {order.orderId}
                    </span>
                  </div>

                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 9px',
                    borderRadius: 'var(--radius-full)',
                    background: badge.bg,
                    color: badge.color,
                    border: `1px solid ${badge.color}40`
                  }}>
                    {badge.label}
                  </span>
                </div>

                {/* Details */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', marginBottom: '2px' }}>
                    {order.product}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Customer: <span style={{ color: '#FFFFFF' }}>{order.customerName}</span> • Total: <span style={{ color: 'var(--text-gold)', fontWeight: 600 }}>₹{order.value}</span>
                  </div>
                </div>

                {/* Tracking Note */}
                <div style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-inset)',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '14px',
                  fontSize: '11px',
                  lineHeight: 1.5
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-gold)', fontWeight: 600, marginBottom: '2px' }}>
                    <Truck size={12} />
                    <span>Fulfillment ({order.carrier || 'Standard'})</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    {order.notes}
                  </div>
                </div>

                {/* Policy Enforcement Guardrail */}
                <div style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '16px',
                  fontSize: '11px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--gold-primary)', fontWeight: 600 }}>
                    <ShieldCheck size={12} />
                    <span>POLICY ENFORCEMENT</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Cancel Allowed:</span>
                    <strong style={{ color: order.canCancel ? 'var(--emerald-accent)' : '#EF4444' }}>
                      {order.canCancel ? 'Yes (Processing Queue)' : 'No (Dispatched)'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Return Eligible:</span>
                    <strong style={{ color: order.canReturn ? 'var(--emerald-accent)' : '#EF4444' }}>
                      {order.canReturn ? 'Yes (≤ 7 Days Unopened)' : 'No (Ineligible/Past Window)'}
                    </strong>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '2px', lineHeight: 1.4 }}>
                    {order.policyNotes}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div>
                {order.status === 'Processing' ? (
                  <button
                    type="button"
                    onClick={() => handleCancelClick(order.orderId)}
                    style={{
                      width: '100%',
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      color: '#F87171',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel Order Manually
                  </button>
                ) : (
                  <div style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-inset)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)',
                    fontSize: '11px',
                    textAlign: 'center'
                  }}>
                    {order.status === 'Cancelled' ? 'Order Cancelled' : 'Cancellation Locked (In Transit / Delivered)'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── CREATE ORDER MODAL ───────────────────────────────────────── */}
      {isCreateModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-card" style={{
            maxWidth: '680px',
            width: '100%',
            maxHeight: '92vh',
            overflowY: 'auto',
            background: '#071912',
            border: '1px solid rgba(212, 175, 55, 0.35)',
            padding: '28px',
            borderRadius: '16px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(212, 175, 55, 0.08)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px', paddingBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  border: '1px solid var(--gold-primary)',
                  background: 'rgba(212, 175, 55, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--gold-primary)'
                }}>
                  <Plus size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Create Manual Order</h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px', margin: 0 }}>
                    Add a custom transaction to test order lookups and policy guardrails live with Aria.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                style={{
                  color: 'var(--text-secondary)',
                  padding: '6px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '6px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateOrder}>
              {/* Field 1: Order ID */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px' }}>
                  Order Identifier (ID)
                </label>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--gold-light)', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="orderIdType"
                      checked={autoOrderId}
                      onChange={() => setAutoOrderId(true)}
                      style={{ accentColor: 'var(--gold-primary)' }}
                    />
                    <span>Auto-assign Next: <strong>ORD-{nextOrderNumber}</strong></span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="orderIdType"
                      checked={!autoOrderId}
                      onChange={() => setAutoOrderId(false)}
                      style={{ accentColor: 'var(--gold-primary)' }}
                    />
                    <span>Manual Input</span>
                  </label>
                </div>
                {!autoOrderId && (
                  <input
                    type="text"
                    placeholder="e.g. ORD-105"
                    value={formOrderId}
                    onChange={(e) => setFormOrderId(e.target.value)}
                    style={{
                      marginTop: '8px',
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      fontFamily: 'var(--font-mono)'
                    }}
                  />
                )}
              </div>

              {/* Field 2: Customer Name */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px' }}>
                  Customer Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pooja Hegde"
                  value={formCustomer}
                  onChange={(e) => setFormCustomer(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    marginBottom: '8px'
                  }}
                />
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {PRESET_CUSTOMERS.map((cust) => (
                    <button
                      key={cust}
                      type="button"
                      onClick={() => setFormCustomer(cust)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        background: formCustomer === cust ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${formCustomer === cust ? 'var(--gold-primary)' : 'rgba(255, 255, 255, 0.1)'}`,
                        fontSize: '11px',
                        color: formCustomer === cust ? 'var(--gold-light)' : 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      {cust}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 3: Product Selection (Catalog Cards) */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px' }}>
                  Aura Skincare Product
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '10px',
                  marginBottom: '10px'
                }}>
                  {PRODUCT_CATALOG.map((prod) => {
                    const isSelected = formProduct === prod.name && !customProduct;
                    return (
                      <button
                        key={prod.name}
                        type="button"
                        onClick={() => {
                          setFormProduct(prod.name);
                          setCustomProduct('');
                          setFormValue(prod.defaultPrice);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-sm)',
                          background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                          border: `1px solid ${isSelected ? 'var(--emerald-accent)' : 'rgba(255, 255, 255, 0.08)'}`,
                          color: '#FFFFFF',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: isSelected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                          color: isSelected ? '#A7F3D0' : 'var(--text-secondary)',
                          flexShrink: 0
                        }}>
                          {prod.category}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {prod.name}
                          </div>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gold-primary)', marginTop: '2px' }}>
                            ₹{prod.defaultPrice}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <input
                  type="text"
                  placeholder="Or type custom product name..."
                  value={customProduct}
                  onChange={(e) => setCustomProduct(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#FFFFFF',
                    fontSize: '12px'
                  }}
                />
              </div>

              {/* Field 4: Order Value Slider & Policy Rules */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                    Order Total Value
                  </label>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gold-primary)' }}>
                    ₹{formValue}
                  </span>
                </div>

                <input
                  type="range"
                  min={199}
                  max={3500}
                  step={50}
                  value={formValue}
                  onChange={(e) => setFormValue(Number(e.target.value))}
                  style={{
                    width: '100%',
                    cursor: 'pointer',
                    accentColor: 'var(--gold-primary)',
                    marginBottom: '10px'
                  }}
                />

                {/* Dynamic Policy Badges */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {formValue >= 499 ? (
                    <span style={{
                      fontSize: '11px',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(16, 185, 129, 0.12)',
                      color: '#10B981',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 600
                    }}>
                      <CheckCircle2 size={12} />
                      <span>Free Delivery Applied (&gt; ₹499)</span>
                    </span>
                  ) : (
                    <span style={{
                      fontSize: '11px',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(245, 158, 11, 0.12)',
                      color: '#F59E0B',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 600
                    }}>
                      <AlertCircle size={12} />
                      <span>₹50 Shipping Fee Applies (&lt; ₹499)</span>
                    </span>
                  )}

                  {formValue <= 2500 ? (
                    <span style={{
                      fontSize: '11px',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(56, 189, 248, 0.12)',
                      color: '#38BDF8',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 600
                    }}>
                      <CheckCircle2 size={12} />
                      <span>Cash on Delivery Eligible (≤ ₹2,500)</span>
                    </span>
                  ) : (
                    <span style={{
                      fontSize: '11px',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(239, 68, 68, 0.12)',
                      color: '#EF4444',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 600
                    }}>
                      <XCircle size={12} />
                      <span>Exceeds ₹2,500 COD Limit (Prepaid Only)</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Field 5: Order Fulfillment Status */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px' }}>
                  Order Fulfillment Status
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {(['Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'] as OrderStatus[]).map((status) => {
                    const isSelected = formStatus === status;
                    const color = getStatusColor(status);
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setFormStatus(status)}
                        style={{
                          padding: '7px 14px',
                          borderRadius: 'var(--radius-full)',
                          background: isSelected ? `${color}25` : 'rgba(255, 255, 255, 0.04)',
                          border: `1px solid ${isSelected ? color : 'rgba(255, 255, 255, 0.1)'}`,
                          color: isSelected ? color : 'var(--text-secondary)',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {status}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Field 6: Carrier & Conditionals */}
              {formStatus !== 'Processing' && formStatus !== 'Cancelled' && (
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: formStatus === 'Delivered' ? '12px' : '0' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Carrier Courier
                      </label>
                      <select
                        value={formCarrier}
                        onChange={(e) => setFormCarrier(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          borderRadius: 'var(--radius-sm)',
                          background: '#071912',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#FFF',
                          fontSize: '12px'
                        }}
                      >
                        <option value="BlueDart">BlueDart</option>
                        <option value="Delhivery">Delhivery</option>
                        <option value="Shadowfax">Shadowfax</option>
                        <option value="Ekart Logistics">Ekart Logistics</option>
                      </select>
                    </div>

                    {(formStatus === 'Out for Delivery' || formStatus === 'Shipped') && (
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                          Delivery Timing Note
                        </label>
                        <input
                          type="text"
                          value={formDeliveryETA}
                          onChange={(e) => setFormDeliveryETA(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: 'var(--radius-sm)',
                            background: '#071912',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#FFF',
                            fontSize: '12px'
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {formStatus === 'Delivered' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Days Since Delivery:</span>
                        <strong style={{ color: formDaysSinceDelivery <= 7 ? '#10B981' : '#EF4444' }}>
                          {formDaysSinceDelivery} days ago ({formDaysSinceDelivery <= 7 ? 'Eligible for Return' : 'Return Window Expired (> 7 days)'})
                        </strong>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={21}
                        value={formDaysSinceDelivery}
                        onChange={(e) => setFormDaysSinceDelivery(Number(e.target.value))}
                        style={{ width: '100%', cursor: 'pointer', accentColor: formDaysSinceDelivery <= 7 ? '#10B981' : '#EF4444' }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  {isSubmitting ? 'Syncing...' : 'Save Order to Live Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
