'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Mic,
  Package,
  ShieldCheck,
  BarChart3,
  Cpu,
  Sparkles,
  ChevronDown,
  FileCode2,
  Terminal,
  ExternalLink
} from 'lucide-react';

const CUSTOMER_NAV = [
  { href: '/', label: 'Voice Concierge', icon: Mic, badge: 'Aria' },
  { href: '/orders', label: 'Track Orders', icon: Package, badge: 'Live OMS' },
  { href: '/policies', label: 'Brand Policies', icon: ShieldCheck, badge: 'FAQ' },
];

const EVALUATOR_DOCS = [
  {
    href: '/architecture',
    label: 'System Design & Architecture',
    desc: 'Pipeline flowcharts, latency breakdown & state machines',
    icon: Cpu,
    tag: 'Docs'
  },
  {
    href: '/analytics',
    label: 'CRM Analytics & Call Logs',
    desc: 'Post-call structured JSON telemetry & sentiment logs',
    icon: BarChart3,
    tag: 'CRM'
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isEvaluatorPage = pathname === '/architecture' || pathname === '/analytics';

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDocsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: 'rgba(7, 25, 18, 0.90)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(212, 175, 55, 0.15)',
      padding: '12px 0',
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

        {/* ── Primary Customer-Facing Navigation ────────────────────────────── */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(16, 42, 33, 0.6)',
          padding: '4px 6px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
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
                  padding: '8px 16px',
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
                    background: isActive ? 'var(--gold-primary)' : 'rgba(255, 255, 255, 0.08)',
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

        {/* ── Evaluator & Engineering Docs Menu (Separated from Customer View) ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setIsDocsOpen(!isDocsOpen)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 14px',
                borderRadius: 'var(--radius-full)',
                background: isEvaluatorPage
                  ? 'rgba(212, 175, 55, 0.18)'
                  : 'rgba(255, 255, 255, 0.05)',
                border: isEvaluatorPage
                  ? '1px solid var(--gold-primary)'
                  : '1px solid rgba(255, 255, 255, 0.12)',
                color: isEvaluatorPage ? 'var(--gold-light)' : '#E2E8F0',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isEvaluatorPage ? '0 0 12px rgba(212, 175, 55, 0.25)' : 'none'
              }}
            >
              <Cpu size={14} color="var(--gold-primary)" />
              <span>Evaluator & Docs</span>
              <span style={{
                fontSize: '9px',
                padding: '1px 5px',
                borderRadius: '4px',
                background: 'rgba(212, 175, 55, 0.2)',
                color: 'var(--gold-light)',
                fontWeight: 700
              }}>
                DataStraw
              </span>
              <ChevronDown
                size={13}
                style={{
                  transform: isDocsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }}
              />
            </button>

            {/* Dropdown Menu */}
            {isDocsOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '320px',
                background: '#0B2219',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 16px 40px rgba(0, 0, 0, 0.7)',
                padding: '8px',
                zIndex: 200,
                animation: 'fadeIn 0.15s ease'
              }}>
                <div style={{
                  padding: '8px 12px 6px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  marginBottom: '6px'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gold-primary)', letterSpacing: '0.06em' }}>
                    DATASTRAW HIRING EVALUATION
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Engineering documentation, telemetry & architecture
                  </div>
                </div>

                {EVALUATOR_DOCS.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsDocsOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: isActive ? 'rgba(212, 175, 55, 0.12)' : 'transparent',
                        border: isActive ? '1px solid rgba(212, 175, 55, 0.2)' : '1px solid transparent',
                        color: '#FFFFFF',
                        transition: 'background 0.15s ease',
                        marginBottom: '4px'
                      }}
                    >
                      <div style={{
                        marginTop: '2px',
                        padding: '6px',
                        borderRadius: '8px',
                        background: 'rgba(212, 175, 55, 0.15)',
                        color: 'var(--gold-primary)'
                      }}>
                        <Icon size={16} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: isActive ? 'var(--gold-light)' : '#FFF' }}>
                            {item.label}
                          </span>
                          <span style={{
                            fontSize: '9px',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: 'var(--text-secondary)',
                            fontWeight: 700
                          }}>
                            {item.tag}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>
                          {item.desc}
                        </div>
                      </div>
                    </Link>
                  );
                })}

                {/* External GitHub / README Link */}
                <a
                  href="https://github.com/aaritmehta15/Datastraw-Assignment#readme"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    marginTop: '4px',
                    color: 'var(--text-secondary)',
                    fontSize: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileCode2 size={14} color="var(--gold-primary)" />
                    <span>View Assessment README.md</span>
                  </div>
                  <ExternalLink size={12} />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

