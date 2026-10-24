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
  AlertCircle
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
            maxWidth: '620px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            padding: '28px',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>Create Custom Transaction</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Simulate an order to test lookups, cancellation eligibility, or delivery verification with Aria.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                style={{ color: 'var(--text-secondary)', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateOrder}>
              {/* Order ID */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#FFFFFF', marginBottom: '6px' }}>
                  Order Identifier
                </label>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--gold-light)', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="orderIdType"
                      checked={autoOrderId}
                      onChange={() => setAutoOrderId(true)}
                    />
                    <span>Auto: ORD-{nextOrderNumber}</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="orderIdType"
                      checked={!autoOrderId}
                      onChange={() => setAutoOrderId(false)}
                    />
                    <span>Manual</span>
                  </label>
                </div>
                {!autoOrderId && (
                  <input
                    type="text"
                    placeholder="e.g. ORD-105"
                    value={formOrderId}
                    onChange={(e) => setFormOrderId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-inset)',
                      border: '1px solid var(--border-default)',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      fontFamily: 'var(--font-mono)'
                    }}
                  />
                )}
              </div>

              {/* Customer */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#FFFFFF', marginBottom: '6px' }}>
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
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-inset)',
                    border: '1px solid var(--border-default)',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    marginBottom: '6px'
                  }}
                />
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {PRESET_CUSTOMERS.map((cust) => (
                    <button
                      key={cust}
                      type="button"
                      onClick={() => setFormCustomer(cust)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-xs)',
                        background: formCustomer === cust ? 'var(--gold-subtle)' : 'var(--bg-inset)',
                        border: `1px solid ${formCustomer === cust ? 'var(--border-gold)' : 'var(--border-subtle)'}`,
                        fontSize: '11px',
                        color: formCustomer === cust ? 'var(--gold-light)' : 'var(--text-secondary)'
                      }}
                    >
                      {cust}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#FFFFFF', marginBottom: '6px' }}>
                  Product
                </label>
                <select
                  value={formProduct}
                  onChange={(e) => {
                    setFormProduct(e.target.value);
                    const prod = PRODUCT_CATALOG.find(p => p.name === e.target.value);
                    if (prod) setFormValue(prod.defaultPrice);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-inset)',
                    border: '1px solid var(--border-default)',
                    color: '#FFFFFF',
                    fontSize: '13px'
                  }}
                >
                  {PRODUCT_CATALOG.map((p) => (
                    <option key={p.name} value={p.name} style={{ background: '#0A1410', color: '#FFF' }}>
                      {p.name} — ₹{p.defaultPrice}
                    </option>
                  ))}
                </select>
              </div>

              {/* Value & Status Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#FFFFFF', marginBottom: '6px' }}>
                    Order Value (₹)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formValue}
                    onChange={(e) => setFormValue(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-inset)',
                      border: '1px solid var(--border-default)',
                      color: '#FFFFFF',
                      fontSize: '13px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#FFFFFF', marginBottom: '6px' }}>
                    Order Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as OrderStatus)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-inset)',
                      border: '1px solid var(--border-default)',
                      color: '#FFFFFF',
                      fontSize: '13px'
                    }}
                  >
                    <option value="Processing" style={{ background: '#0A1410' }}>Processing (Cancel Eligible)</option>
                    <option value="Out for Delivery" style={{ background: '#0A1410' }}>Out for Delivery (Locked)</option>
                    <option value="Delivered" style={{ background: '#0A1410' }}>Delivered</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'transparent',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    fontWeight: 500
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--emerald-accent)',
                    border: 'none',
                    color: '#071912',
                    fontSize: '13px',
                    fontWeight: 700
                  }}
                >
                  {isSubmitting ? 'Recording...' : 'Save Order to Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
