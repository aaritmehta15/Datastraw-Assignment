import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Aura Skincare — AI Voice CX Agent (Aria)',
  description: 'Enterprise browser-based AI Voice Customer Experience Agent for Aura Skincare. Built with real-time Indian neural speech, live order tracking, and deterministic policy guardrails.',
  keywords: ['AI Voice Agent', 'Aura Skincare', 'Voice CX', 'Datastraw Assignment', 'Customer Support AI'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Navbar />
        <main style={{ minHeight: 'calc(100vh - 160px)', paddingBottom: '60px' }}>
          {children}
        </main>
        <footer style={{
          borderTop: '1px solid rgba(212, 175, 55, 0.12)',
          backgroundColor: 'rgba(7, 25, 18, 0.95)',
          padding: '24px 0',
          fontSize: '13px',
          color: 'var(--text-muted)',
          textAlign: 'center'
        }}>
          <div className="container" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Aura Skincare CX Platform</span> • Pure Organic Botanical Care • Aria Voice Concierge
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span>Persona: <strong style={{ color: 'var(--gold-primary)' }}>Aria (en-IN)</strong></span>
              <span>•</span>
              <span>Deterministic Policy Engine</span>
              <span>•</span>
              <span>Sub-Second Latency</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
