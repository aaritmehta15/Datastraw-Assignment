'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Mic,
  Package,
  ShieldCheck,
  Sparkles,
  User,
  LogIn,
  LogOut,
  ChevronDown,
  ArrowRight,
  BarChart3
} from 'lucide-react';
import {
  ExtendedCustomerAccount,
  getActiveCustomer,
  isCustomerAuthenticated,
  logoutCustomer
} from '@/lib/customerAccounts';

const CUSTOMER_NAV = [
  { href: '/', label: 'Voice Concierge', icon: Mic, badge: 'Aria' },
  { href: '/orders', label: 'Order Management', icon: Package, badge: 'Live OMS' },
  { href: '/policies', label: 'Brand Policies', icon: ShieldCheck, badge: 'FAQ' },
  { href: '/analytics', label: 'Call Telemetry', icon: BarChart3, badge: 'Live CRM' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [customer, setCustomer] = useState<ExtendedCustomerAccount | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    setCustomer(getActiveCustomer());

    const handleCustomerChange = (e: any) => {
      if (e.detail) {
        setCustomer(e.detail);
      }
    };

    window.addEventListener('aura:customer-changed', handleCustomerChange);
    return () => window.removeEventListener('aura:customer-changed', handleCustomerChange);
  }, []);

  const handleLogout = () => {
    const guest = logoutCustomer();
    setCustomer(guest);
    setIsDropdownOpen(false);
  };

  const authenticated = isCustomerAuthenticated(customer);

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: 'rgba(11, 17, 32, 0.96)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-default)',
      padding: '14px 0',
      transition: 'border-color 0.2s ease'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Brand Identity */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--brand-light)'
          }}>
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '17px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              AURA <span style={{ color: 'var(--brand-light)' }}>SKINCARE</span>
            </div>
            <div style={{
              fontSize: '11px',
              letterSpacing: '0.02em',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>Customer Voice Support</span>
              <span style={{ color: 'var(--border-default)' }}>•</span>
              <span style={{ color: 'var(--brand-light)' }}>Aria (en-IN)</span>
            </div>
          </div>
        </Link>

        {/* ── Primary Navigation ────────────────────────────── */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'var(--bg-inset)',
          padding: '4px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-subtle)'
        }}>
          {CUSTOMER_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 16px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                  border: isActive ? '1px solid var(--border-default)' : '1px solid transparent',
                  boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={14} color={isActive ? 'var(--gold-primary)' : 'currentColor'} />
                <span>{item.label}</span>
                {item.badge && (
                  <span style={{
                    fontSize: '9px',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                    background: isActive ? 'var(--gold-subtle)' : 'rgba(255, 255, 255, 0.05)',
                    color: isActive ? 'var(--gold-light)' : 'var(--text-muted)',
                    fontWeight: 700,
                    letterSpacing: '0.04em'
                  }}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── User Auth & Real-Time Status ─────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* User Account State */}
          {authenticated && customer ? (
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-default)',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <User size={13} color="var(--brand-light)" />
                <span>{customer.name}</span>
                <span style={{
                  fontSize: '10px',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: 'var(--gold-light)',
                  fontWeight: 700
                }}>
                  {customer.tier.replace(' Member', '')}
                </span>
                <ChevronDown size={12} color="var(--text-secondary)" />
              </button>

              {/* User Dropdown Menu */}
              {isDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  width: '260px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 200,
                  padding: '8px',
                  animation: 'fadeIn 0.15s ease-out'
                }}>
                  {/* Account Header */}
                  <div style={{
                    padding: '8px 10px 10px',
                    borderBottom: '1px solid var(--border-subtle)',
                    marginBottom: '6px'
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                      {customer.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {customer.email}
                    </div>
                    {customer.activeOrderId && (
                      <Link
                        href="/orders"
                        onClick={() => setIsDropdownOpen(false)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginTop: '6px',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-full)',
                          background: 'rgba(59, 130, 246, 0.12)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          color: '#93C5FD',
                          fontSize: '11px',
                          fontWeight: 600,
                          textDecoration: 'none'
                        }}
                      >
                        <Package size={11} />
                        <span>Order: {customer.activeOrderId} ({customer.orderStatus || 'Active'})</span>
                      </Link>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <Link
                      href="/orders"
                      onClick={() => setIsDropdownOpen(false)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '12px',
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Package size={13} color="var(--brand-light)" />
                      <span>View Orders & Tracking</span>
                    </Link>

                    <Link
                      href="/login"
                      onClick={() => setIsDropdownOpen(false)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '12px',
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <User size={13} color="var(--gold-primary)" />
                      <span>Switch / Demo Logins</span>
                    </Link>

                    <div style={{ paddingTop: '6px', borderTop: '1px solid var(--border-subtle)', marginTop: '4px' }}>
                      <button
                        type="button"
                        onClick={handleLogout}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '12px',
                          color: '#F87171',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <LogOut size={13} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-default)',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <LogIn size={13} color="var(--brand-light)" />
              <span>Sign In</span>
            </Link>
          )}

          {/* Online Status Pill */}
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(37, 99, 235, 0.14)',
            border: '1px solid rgba(59, 130, 246, 0.35)',
            color: '#60A5FA',
            fontSize: '12px',
            fontWeight: 600
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3B82F6' }} />
            <span>Aria (en-IN) • Online</span>
          </span>
        </div>
      </div>
    </header>
  );
}
