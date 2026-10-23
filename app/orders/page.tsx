'use client';

import { useState, useEffect } from 'react';
import {
  Package,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Truck,
  Plus,
  ShieldAlert,
  Sliders,
  DollarSign,
  User,
  X,
  Sparkles,
  PhoneCall
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
          setActionMessage('Order database reset to seed state.');
          setTimeout(() => setActionMessage(null), 3500);
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
        setActionMessage(data.result?.message || 'New order created successfully and synced to live OMS!');
        setTimeout(() => setActionMessage(null), 6000);
      } else {
        alert(data.message || 'Failed to create order');
      }
    } catch (err) {
      console.error('Create order error:', err);
      alert('Error connecting to OMS server');
    } finally {
      setIsSubmitting(false);
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

  // Compute next auto Order ID preview
  const nextOrderNumber = orders.length > 0
    ? Math.max(...orders.map(o => parseInt(o.orderId.replace(/\D/g, ''), 10)).filter(n => !isNaN(n))) + 1
    : 104;

  return (
    <div className="container" style={{ paddingTop: '36px', paddingBottom: '60px' }}>
      {/* ── Page Header ───────────────────────────────────────────────────────── */}
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
            Real-time transactional mock order database. When Aria checks or cancels an order over voice, its status mutates live on this dashboard.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 700,
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.35)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Plus size={16} />
            <span>Create Custom Order</span>
          </button>

          <button
            onClick={() => fetchOrders(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
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
            <span>Reset Seed DB</span>
          </button>
        </div>
      </div>

      {/* ── Action Notification Toast ────────────────────────────────────────── */}
      {actionMessage && (
        <div style={{
          padding: '14px 20px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid var(--emerald-accent)',
          color: '#FFFFFF',
          fontSize: '14px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={18} color="var(--emerald-accent)" />
            <span>{actionMessage}</span>
          </div>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--emerald-accent)',
              color: '#071912',
              fontSize: '12px',
              fontWeight: 700
            }}
          >
            <PhoneCall size={12} />
            <span>Test with Aria Now</span>
          </Link>
        </div>
      )}

      {/* ── Live Order Cards Grid ────────────────────────────────────────────── */}
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
                    Total Value: <strong style={{ color: '#FFFFFF' }}>₹{order.value}</strong> ({order.value >= 499 ? 'Free Shipping' : '₹50 Shipping Fee'})
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
                    <span>Fulfillment Status ({order.carrier || 'Standard'})</span>
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
                      {order.canCancel ? 'YES (Processing)' : 'NO (Locked by Policy)'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Eligible for Return:</span>
                    <strong style={{ color: order.canReturn ? '#10B981' : '#EF4444' }}>
                      {order.canReturn ? 'YES (Within 7d)' : 'NO (Ineligible / Expired)'}
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
                      padding: '10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid #EF4444',
                      color: '#F87171',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <XCircle size={14} />
                    <span>Execute Manual Cancellation</span>
                  </button>
                )}
                {order.status !== 'Processing' && (
                  <div style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    color: 'var(--text-muted)',
                    fontSize: '11px',
                    textAlign: 'center'
                  }}>
                    {order.status === 'Cancelled' ? 'Order Cancelled (Refund Pending)' : 'Protected by Courier State Machine'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── CREATE ORDER MODAL / STUDIO ───────────────────────────────────────── */}
      {isCreateModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-card" style={{
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'linear-gradient(135deg, rgba(13, 38, 30, 0.98) 0%, rgba(7, 25, 18, 0.98) 100%)',
            border: '1px solid var(--gold-primary)',
            padding: '32px',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(212, 175, 55, 0.15)',
                  border: '1px solid var(--gold-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--gold-primary)'
                }}>
                  <Plus size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFF' }}>Create Manual Order</h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Add a custom transaction to test order lookups and policy guardrails live with Aria.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                style={{ color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateOrder}>
              {/* Field 1: Order ID */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#FFF', marginBottom: '8px' }}>
                  Order Identifier (ID)
                </label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--gold-light)', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="orderIdType"
                      checked={autoOrderId}
                      onChange={() => setAutoOrderId(true)}
                    />
                    <span>Auto-assign Next: <strong>ORD-{nextOrderNumber}</strong></span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="orderIdType"
                      checked={!autoOrderId}
                      onChange={() => setAutoOrderId(false)}
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
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#FFF',
                      fontSize: '14px',
                      fontFamily: 'var(--font-mono)'
                    }}
                  />
                )}
              </div>

              {/* Field 2: Customer Name */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#FFF', marginBottom: '8px' }}>
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
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#FFF',
                    fontSize: '14px',
                    marginBottom: '8px'
                  }}
                />
                {/* Preset Chips */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {PRESET_CUSTOMERS.map((cust) => (
                    <button
                      key={cust}
                      type="button"
                      onClick={() => setFormCustomer(cust)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        background: formCustomer === cust ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${formCustomer === cust ? 'var(--gold-primary)' : 'rgba(255,255,255,0.1)'}`,
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

              {/* Field 3: Product Selection (Catalog Chips) */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#FFF', marginBottom: '8px' }}>
                  Aura Skincare Product
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', marginBottom: '10px' }}>
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
                          gap: '8px',
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-sm)',
                          background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isSelected ? 'var(--emerald-accent)' : 'rgba(255,255,255,0.08)'}`,
                          color: isSelected ? '#FFF' : 'var(--text-secondary)',
                          fontSize: '12px',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '3px 7px',
                          borderRadius: '4px',
                          background: 'rgba(212, 175, 55, 0.15)',
                          color: 'var(--gold-light)',
                          letterSpacing: '0.04em'
                        }}>
                          {prod.category}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{prod.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--gold-primary)' }}>₹{prod.defaultPrice}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Product Option */}
                <input
                  type="text"
                  placeholder="Or type custom product name..."
                  value={customProduct}
                  onChange={(e) => setCustomProduct(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#FFF',
                    fontSize: '12px'
                  }}
                />
              </div>

              {/* Field 4: Order Value Slider & Policy Rules */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#FFF' }}>
                    Order Total Value
                  </label>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--gold-primary)' }}>
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
                  style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--gold-primary)', marginBottom: '10px' }}
                />

                {/* Live Policy Compliance Badges */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {formValue >= 499 ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', padding: '4px 10px', borderRadius: 'var(--radius-full)', background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid #10B981' }}>
                      <CheckCircle2 size={12} />
                      <span>Free Delivery Applied (&gt; ₹499)</span>
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', padding: '4px 10px', borderRadius: 'var(--radius-full)', background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid #F59E0B' }}>
                      <AlertCircle size={12} />
                      <span>₹50 Shipping Fee Applies (&lt; ₹499)</span>
                    </span>
                  )}

                  {formValue <= 2500 ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', padding: '4px 10px', borderRadius: 'var(--radius-full)', background: 'rgba(56,189,248,0.15)', color: '#38BDF8', border: '1px solid #38BDF8' }}>
                      <CheckCircle2 size={12} />
                      <span>Cash on Delivery Eligible (≤ ₹2,500)</span>
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', padding: '4px 10px', borderRadius: 'var(--radius-full)', background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid #EF4444' }}>
                      <XCircle size={12} />
                      <span>Exceeds ₹2,500 COD Limit (Prepaid Required)</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Field 5: Order Status Selection Chips */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#FFF', marginBottom: '8px' }}>
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
                          padding: '8px 14px',
                          borderRadius: 'var(--radius-full)',
                          background: isSelected ? `${color}25` : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${isSelected ? color : 'rgba(255,255,255,0.1)'}`,
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

              {/* Field 6: Carrier & Dynamic Status Conditionals */}
              {formStatus !== 'Processing' && formStatus !== 'Cancelled' && (
                <div style={{
                  background: 'rgba(0,0,0,0.3)',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
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
                          border: '1px solid rgba(255,255,255,0.15)',
                          color: '#FFF',
                          fontSize: '13px'
                        }}
                      >
                        <option value="BlueDart">BlueDart</option>
                        <option value="Delhivery">Delhivery</option>
                        <option value="Shadowfax">Shadowfax</option>
                        <option value="Ekart Logistics">Ekart Logistics</option>
                      </select>
                    </div>

                    {formStatus === 'Out for Delivery' && (
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
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: '#FFF',
                            fontSize: '13px'
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Delivered Days Ago Slider */}
                  {formStatus === 'Delivered' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Days Since Delivery:</span>
                        <strong style={{ color: formDaysSinceDelivery <= 7 ? '#10B981' : '#EF4444' }}>
                          {formDaysSinceDelivery} days ago ({formDaysSinceDelivery <= 7 ? 'Eligible for Return' : 'Return Expired'})
                        </strong>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={21}
                        value={formDaysSinceDelivery}
                        onChange={(e) => setFormDaysSinceDelivery(Number(e.target.value))}
                        style={{ width: '100%', accentColor: formDaysSinceDelivery <= 7 ? '#10B981' : '#EF4444' }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  style={{
                    padding: '12px 20px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255,255,255,0.05)',
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
                    padding: '12px 28px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
                    border: '1px solid rgba(255,255,255,0.2)'
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
