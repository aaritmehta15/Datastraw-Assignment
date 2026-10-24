'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sparkles,
  Lock,
  Mail,
  User,
  Phone,
  Eye,
  EyeOff,
  CheckCircle2,
  Package,
  ArrowRight,
  LogOut,
  ShieldCheck,
  UserCheck,
  Zap
} from 'lucide-react';
import {
  ExtendedCustomerAccount,
  SEED_CUSTOMERS,
  getActiveCustomer,
  setActiveCustomer,
  loginCustomer,
  logoutCustomer,
  createCustomerAccount,
  isCustomerAuthenticated
} from '@/lib/customerAccounts';
import { AURA_PRODUCT_CATALOG } from '@/lib/brandKnowledge';
import { OrderStatus } from '@/lib/types';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/';

  // Tabs: 'signin' | 'signup'
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');

  // Active customer state
  const [currentCustomer, setCurrentCustomer] = useState<ExtendedCustomerAccount | null>(null);

  // Sign In form fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('demo123');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');

  // Sign Up form fields
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('+91 ');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupTier, setSignupTier] = useState<'Gold Member' | 'Silver Member' | 'First-Time Customer'>('Gold Member');
  const [attachOrder, setAttachOrder] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(AURA_PRODUCT_CATALOG[0].name);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('Processing');
  const [daysSinceDelivery, setDaysSinceDelivery] = useState(1);
  const [signupError, setSignupError] = useState('');

  useEffect(() => {
    const cust = getActiveCustomer();
    setCurrentCustomer(cust);

    const handleCustomerChange = (e: any) => {
      if (e.detail) {
        setCurrentCustomer(e.detail);
      }
    };

    window.addEventListener('aura:customer-changed', handleCustomerChange);
    return () => window.removeEventListener('aura:customer-changed', handleCustomerChange);
  }, []);

  // Handle standard login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginIdentifier.trim()) {
      setLoginError('Please enter your email or phone number.');
      return;
    }

    const account = loginCustomer(loginIdentifier);
    if (account) {
      setLoginSuccess(`Welcome back, ${account.name}! Redirecting to concierge...`);
      setTimeout(() => {
        router.push(redirectTarget);
      }, 700);
    } else {
      setLoginError('No account found with this email or phone. Try one of the 1-click demo accounts below or create a new account.');
    }
  };

  // 1-Click Quick Demo Login
  const handleQuickDemoLogin = (customer: ExtendedCustomerAccount) => {
    setActiveCustomer(customer);
    setCurrentCustomer(customer);
    setLoginSuccess(`Signed in as ${customer.name}. Redirecting...`);
    setTimeout(() => {
      router.push(redirectTarget);
    }, 600);
  };

  // Handle Sign Out
  const handleLogout = () => {
    const guest = logoutCustomer();
    setCurrentCustomer(guest);
    setLoginSuccess('You have been signed out.');
    setTimeout(() => setLoginSuccess(''), 2000);
  };

  // Handle Signup Submit
  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    if (!signupName.trim()) {
      setSignupError('Please enter your full name.');
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      setSignupError('Please enter a valid email address.');
      return;
    }

    try {
      const newAcc = createCustomerAccount({
        name: signupName.trim(),
        email: signupEmail.trim(),
        phone: signupPhone.trim(),
        tier: signupTier,
        createOrder: attachOrder,
        product: selectedProduct,
        orderStatus: selectedStatus,
        daysSinceDelivery: selectedStatus === 'Delivered' ? Number(daysSinceDelivery) : undefined
      });

      setLoginSuccess(`Account created successfully! Welcome to Aura, ${newAcc.name}. Redirecting...`);
      setTimeout(() => {
        router.push(redirectTarget);
      }, 800);
    } catch (err: any) {
      setSignupError(err?.message || 'Failed to create account.');
    }
  };

  const isAuthenticated = isCustomerAuthenticated(currentCustomer);

  return (
    <div className="container" style={{ padding: '40px 16px 80px', maxWidth: '640px', margin: '0 auto' }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-default)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--brand-light)',
          marginBottom: '16px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <Sparkles size={24} />
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '26px',
          fontWeight: 700,
          color: '#FFFFFF',
          letterSpacing: '0.02em',
          margin: 0
        }}>
          Aura Customer Portal
        </h1>
        <p style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          marginTop: '8px',
          lineHeight: 1.5
        }}>
          Sign in to access your orders, track shipments, and receive personalized voice consultations with Aria.
        </p>
      </div>

      {/* Already Logged In Banner */}
      {isAuthenticated && currentCustomer && (
        <div className="enterprise-card" style={{
          padding: '18px 22px',
          marginBottom: '24px',
          background: 'rgba(37, 99, 235, 0.12)',
          border: '1px solid rgba(59, 130, 246, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 700
            }}>
              {currentCustomer.name.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Signed in as {currentCustomer.name}</span>
                <span style={{
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: 'var(--gold-light)',
                  border: '1px solid rgba(245, 158, 11, 0.4)'
                }}>
                  {currentCustomer.tier}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {currentCustomer.email} {currentCustomer.activeOrderId ? `• Order: ${currentCustomer.activeOrderId}` : ''}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link
              href="/"
              className="btn btn-primary"
              style={{ padding: '8px 16px', fontSize: '12px', textDecoration: 'none' }}
            >
              <span>Go to Concierge</span>
              <ArrowRight size={13} />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-secondary"
              style={{ padding: '8px 14px', fontSize: '12px' }}
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Authentication Card */}
      <div className="enterprise-card" style={{ padding: '28px 24px', overflow: 'hidden' }}>
        {/* Tab Headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4px',
          background: 'var(--bg-inset)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '24px',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            type="button"
            onClick={() => { setTab('signin'); setLoginError(''); setSignupError(''); }}
            style={{
              padding: '10px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: tab === 'signin' ? 700 : 500,
              color: tab === 'signin' ? '#FFFFFF' : 'var(--text-secondary)',
              background: tab === 'signin' ? 'var(--bg-surface-elevated)' : 'transparent',
              border: tab === 'signin' ? '1px solid var(--border-default)' : '1px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab('signup'); setLoginError(''); setSignupError(''); }}
            style={{
              padding: '10px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: tab === 'signup' ? 700 : 500,
              color: tab === 'signup' ? '#FFFFFF' : 'var(--text-secondary)',
              background: tab === 'signup' ? 'var(--bg-surface-elevated)' : 'transparent',
              border: tab === 'signup' ? '1px solid var(--border-default)' : '1px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Create Account
          </button>
        </div>

        {/* Success Alert */}
        {loginSuccess && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(16, 185, 129, 0.14)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#34D399',
            fontSize: '13px',
            fontWeight: 500,
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} />
            <span>{loginSuccess}</span>
          </div>
        )}

        {/* ── TAB 1: SIGN IN ────────────────────────────────────────────────── */}
        {tab === 'signin' && (
          <div>
            {loginError && (
              <div style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#F87171',
                fontSize: '13px',
                marginBottom: '20px'
              }}>
                {loginError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Email Address or Mobile Number
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="e.g. priya.sharma@aura.in or 9820144321"
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 38px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-inset)',
                      border: '1px solid var(--border-default)',
                      color: '#FFFFFF',
                      fontSize: '13px'
                    }}
                  />
                  <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Password
                  </label>
                  <span style={{ fontSize: '11px', color: 'var(--brand-light)', cursor: 'pointer' }}>
                    Forgot password?
                  </span>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '10px 38px 10px 38px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-inset)',
                      border: '1px solid var(--border-default)',
                      color: '#FFFFFF',
                      fontSize: '13px'
                    }}
                  />
                  <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', fontSize: '14px', justifyContent: 'center', marginBottom: '24px' }}
              >
                <span>Sign In to Account</span>
                <ArrowRight size={15} />
              </button>
            </form>

            {/* Evaluator 1-Click Demo Accounts Section */}
            <div style={{
              paddingTop: '20px',
              borderTop: '1px solid var(--border-subtle)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '14px',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={14} color="var(--gold-primary)" />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                    1-Click Demo Accounts (Evaluator Access)
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Instant login with linked orders
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {SEED_CUSTOMERS.filter(c => c.id !== 'guest').map((cust) => (
                  <div
                    key={cust.id}
                    onClick={() => handleQuickDemoLogin(cust)}
                    style={{
                      background: 'var(--bg-inset)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#3B82F6';
                      e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-default)';
                      e.currentTarget.style.backgroundColor = 'var(--bg-inset)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(37, 99, 235, 0.16)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#60A5FA',
                        fontWeight: 700,
                        fontSize: '12px'
                      }}>
                        {cust.name.split(' ')[0][0]}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{cust.name}</span>
                          <span style={{ fontSize: '10px', color: 'var(--gold-light)' }}>
                            • {cust.tier}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {cust.activeOrderId}: {cust.orderProduct} ({cust.orderStatus})
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(37, 99, 235, 0.16)',
                        border: '1px solid rgba(59, 130, 246, 0.35)',
                        color: '#60A5FA',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Sign In
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: CREATE ACCOUNT (SIGN UP) ───────────────────────────────── */}
        {tab === 'signup' && (
          <form onSubmit={handleSignupSubmit}>
            {signupError && (
              <div style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#F87171',
                fontSize: '13px',
                marginBottom: '20px'
              }}>
                {signupError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Full Name *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="e.g. Vikram Malhotra"
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 34px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-inset)',
                      border: '1px solid var(--border-default)',
                      color: '#FFFFFF',
                      fontSize: '13px'
                    }}
                  />
                  <User size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Email Address *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="vikram@example.com"
                    required
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 34px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-inset)',
                      border: '1px solid var(--border-default)',
                      color: '#FFFFFF',
                      fontSize: '13px'
                    }}
                  />
                  <Mail size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Mobile Number
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 34px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-inset)',
                      border: '1px solid var(--border-default)',
                      color: '#FFFFFF',
                      fontSize: '13px'
                    }}
                  />
                  <Phone size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Loyalty Membership
                </label>
                <select
                  value={signupTier}
                  onChange={(e) => setSignupTier(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-inset)',
                    border: '1px solid var(--border-default)',
                    color: '#FFFFFF',
                    fontSize: '13px'
                  }}
                >
                  <option value="Gold Member">Gold Member (Priority Concierge)</option>
                  <option value="Silver Member">Silver Member</option>
                  <option value="First-Time Customer">First-Time Customer</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Set Password
              </label>
              <input
                type="password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                placeholder="Create a password (min. 6 characters)"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-inset)',
                  border: '1px solid var(--border-default)',
                  color: '#FFFFFF',
                  fontSize: '13px'
                }}
              />
            </div>

            {/* Attach Order Option */}
            <div style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-inset)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '20px'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: attachOrder ? '12px' : 0 }}>
                <input
                  type="checkbox"
                  checked={attachOrder}
                  onChange={(e) => setAttachOrder(e.target.checked)}
                  style={{ accentColor: '#3B82F6', width: '15px', height: '15px' }}
                />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>
                  Attach an active botanical order to test voice lookup
                </span>
              </label>

              {attachOrder && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Botanical Product:
                    </label>
                    <select
                      value={selectedProduct}
                      onChange={(e) => setSelectedProduct(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-default)',
                        color: '#FFFFFF',
                        fontSize: '12px'
                      }}
                    >
                      {AURA_PRODUCT_CATALOG.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name} (₹{p.price})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Initial Order Status:
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value as any)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-default)',
                        color: '#FFFFFF',
                        fontSize: '12px'
                      }}
                    >
                      <option value="Processing">Processing (Can cancel)</option>
                      <option value="Out for Delivery">Out for Delivery (Courier)</option>
                      <option value="Delivered">Delivered (Test returns/damage)</option>
                    </select>
                  </div>

                  {selectedStatus === 'Delivered' && (
                    <div style={{ gridColumn: 'span 2', marginTop: '4px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="signupDays"
                            checked={daysSinceDelivery === 1}
                            onChange={() => setDaysSinceDelivery(1)}
                            style={{ accentColor: '#3B82F6' }}
                          />
                          <span>Delivered 1 day ago (Eligible for 48h damaged replacement)</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="signupDays"
                            checked={daysSinceDelivery === 14}
                            onChange={() => setDaysSinceDelivery(14)}
                            style={{ accentColor: '#3B82F6' }}
                          />
                          <span>14 days ago (Ineligible)</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '14px', justifyContent: 'center' }}
            >
              <span>Create Account & Continue</span>
              <ArrowRight size={15} />
            </button>
          </form>
        )}
      </div>

      {/* Trust & Policy Micro-copy */}
      <div style={{
        marginTop: '24px',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        fontSize: '12px',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={14} color="#10B981" />
          <span>SSL 256-bit Encrypted</span>
        </div>
        <span>•</span>
        <span>7-Day Return Policy</span>
        <span>•</span>
        <span>Free Shipping over ₹499</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="container" style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading authentication portal...
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
