'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mic, Package, ShieldCheck, BarChart3, Cpu, Sparkles } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Voice Studio', icon: Mic, badge: 'Live' },
  { href: '/orders', label: 'Live Orders', icon: Package, badge: 'DB' },
  { href: '/policies', label: 'Brand Policies', icon: ShieldCheck, badge: 'Guardrails' },
  { href: '/analytics', label: 'Analytics & Logs', icon: BarChart3, badge: 'CRM' },
  { href: '/architecture', label: 'System Design', icon: Cpu, badge: 'Docs' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: 'rgba(7, 25, 18, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(212, 175, 55, 0.15)',
      padding: '14px 0',
      transition: 'all 0.3s ease'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Brand Identity */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #104B38 0%, #D4AF37 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(212, 175, 55, 0.3)',
            color: '#FFFFFF'
          }}>
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '18px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              AURA <span style={{ color: 'var(--gold-primary)' }}>SKINCARE</span>
            </div>
            <div style={{
              fontSize: '11px',
              letterSpacing: '0.04em',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>Voice CX Specialist</span>
              <span style={{ color: 'var(--gold-primary)' }}>•</span>
              <span style={{ color: 'var(--gold-light)' }}>Aria Persona</span>
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(16, 42, 33, 0.6)',
          padding: '5px 8px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {NAV_ITEMS.map((item) => {
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
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'rgba(212, 175, 55, 0.18)' : 'transparent',
                  border: isActive ? '1px solid rgba(212, 175, 55, 0.4)' : '1px solid transparent',
                  boxShadow: isActive ? '0 2px 10px rgba(212, 175, 55, 0.2)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon size={15} color={isActive ? 'var(--gold-primary)' : 'currentColor'} />
                <span>{item.label}</span>
                {item.badge && (
                  <span style={{
                    fontSize: '9px',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                    background: isActive ? 'var(--gold-primary)' : 'rgba(255, 255, 255, 0.1)',
                    color: isActive ? '#071912' : 'var(--text-muted)',
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

        {/* Live Engine Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '6px 14px',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: 'var(--radius-full)',
          fontSize: '12px',
          color: 'var(--text-primary)'
        }}>
          <span
            className="animate-pulse-dot"
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--emerald-accent)',
              display: 'inline-block'
            }}
          />
          <span style={{ fontWeight: 600, color: '#A7F3D0' }}>Aria Engine Ready</span>
        </div>
      </div>
    </header>
  );
}
