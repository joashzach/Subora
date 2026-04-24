import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Subora — Master Your Subscriptions',
  description:
    "Subora gives you a single place to track every subscription, understand your spending, and get smart alerts before you are charged. Premium, real-time, and beautifully simple.",
};

const FEATURES = [
  {
    icon: '⚡',
    title: 'Real-time sync',
    desc: 'Add a subscription on your phone, see it instantly on your laptop. Every device, always up to date.',
  },
  {
    icon: '📊',
    title: 'Smart analytics',
    desc: 'Charts that actually tell you something — monthly trends, category breakdown, and where your money really goes.',
  },
  {
    icon: '💡',
    title: 'Proactive insights',
    desc: 'Subora flags unused subscriptions, upcoming renewals, and potential savings before you even think to look.',
  },
  {
    icon: '🔒',
    title: 'Bank-grade security',
    desc: 'Your data is encrypted and private. Hide all amounts with one tap and stay in full control.',
  },
  {
    icon: '🌐',
    title: 'Universal support',
    desc: 'Netflix, Spotify, AWS and more — add any subscription in seconds with our intelligent quick-pickers.',
  },
  {
    icon: '🔔',
    title: 'Smart reminders',
    desc: "Get notified days before you are charged. Decide to keep or cancel without the last-minute stress.",
  },
];

const STATS = [
  { value: '2k+', label: 'Monthly users' },
  { value: '500+', label: 'Services tracked' },
  { value: '100%', label: 'Privacy focused' },
];

export default function LandingPage() {
  return (
    <div className="landing-wrapper" style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}>
      
      {/* ─── Navbar ─────────────────────────────────────────────────────── */}
      <nav className="glass" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', height: 'var(--header-height)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="sidebar-logo-mark" style={{ width: 32, height: 32, borderRadius: 8, fontSize: '0.9rem' }}>💳</div>
          <span className="sidebar-logo-text">Sub<span>ora</span></span>
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link href="/login" className="btn btn-ghost" style={{ fontSize: '0.875rem' }}>Sign In</Link>
          <Link href="/signup" className="btn btn-primary" style={{ padding: '8px 20px', borderRadius: '100px' }}>Get Started</Link>
        </div>
      </nav>

      {/* ─── Hero ───────────────────────────────────────────────────────── */}
      <section className="landing-hero animate-fade-in">
        <div className="landing-badge">✨ Now with AI-powered insights</div>
        <h1 className="landing-title">
          Master your subscriptions,<br />
          Maximize your wealth.
        </h1>
        <p className="landing-subtitle">
          Subora tracks every service you pay for, surfaces wasteful spending, 
          and gives you total control over your digital recurring costs.
        </p>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <Link href="/signup" className="btn btn-primary btn-lg" style={{ borderRadius: '100px' }}>
            Start Tracking Free
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M5 12h14m-7-7l7 7-7 7" />
            </svg>
          </Link>
          <Link href="/login" className="btn btn-secondary btn-lg" style={{ borderRadius: '100px' }}>View Demo</Link>
        </div>

        {/* Hero Image Mockup (Conceptual) */}
        <div style={{ marginTop: 80, position: 'relative' }}>
          <div style={{
            maxWidth: 1000, margin: '0 auto',
            background: 'var(--surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: '24px 24px 0 0',
            padding: '12px',
            boxShadow: '0 20px 80px rgba(0,0,0,0.5)',
            transform: 'perspective(1000px) rotateX(5deg)',
          }}>
            <div style={{ background: 'var(--bg)', borderRadius: 12, height: 500, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Dashboard Preview</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats ──────────────────────────────────────────────────────── */}
      <section style={{ padding: '60px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 100, flexWrap: 'wrap' }}>
          {STATS.map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ───────────────────────────────────────────────────── */}
      <section style={{ padding: '120px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 80 }}>
          <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: 20 }}>Built for modern finance</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', maxWidth: 600, margin: '0 auto' }}>
            A powerful suite of tools to help you navigate the subscription economy.
          </p>
        </div>

        <div className="feature-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3 style={{ marginBottom: 12 }}>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ────────────────────────────────────────────────────────── */}
      <section style={{ padding: '0 40px 120px', maxWidth: 1000, margin: '0 auto' }}>
        <div className="card glass animate-slide-up" style={{ padding: '80px 40px', textAlign: 'center', border: '1px solid var(--accent)', boxShadow: 'var(--shadow-accent)' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 24 }}>Ready to save?</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', maxWidth: 500, margin: '0 auto 40px' }}>
            Join thousands of users who have optimized their spending with Subora. No credit card required.
          </p>
          <Link href="/signup" className="btn btn-primary btn-lg" style={{ padding: '16px 48px', borderRadius: '100px', fontSize: '1.125rem' }}>Create Free Account</Link>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '48px 40px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
          <div className="sidebar-logo-mark" style={{ width: 28, height: 28, borderRadius: 6, fontSize: '0.8rem' }}>💳</div>
          <span className="sidebar-logo-text" style={{ fontSize: '1rem' }}>Sub<span>ora</span></span>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          © {new Date().getFullYear()} Subora Finance. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
