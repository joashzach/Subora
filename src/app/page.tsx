import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Subora — Master Your Subscriptions',
  description:
    "Subora gives you a single place to track every subscription, understand your spending, and get smart alerts before you are charged. Premium, real-time, and beautifully simple.",
};

const FEATURES = [
  {
    tag: '01',
    title: 'Real-time sync',
    desc: 'Add a subscription on your phone, see it instantly on your laptop. Every device, always up to date.',
  },
  {
    tag: '02',
    title: 'Smart analytics',
    desc: 'Charts that actually tell you something — monthly trends, category breakdown, and where your money really goes.',
  },
  {
    tag: '03',
    title: 'Proactive insights',
    desc: 'Subora flags unused subscriptions, upcoming renewals, and potential savings before you even think to look.',
  },
  {
    tag: '04',
    title: 'Bank-grade security',
    desc: 'Your data is encrypted and private. Hide all amounts with one tap and stay in full control.',
  },
  {
    tag: '05',
    title: 'Universal support',
    desc: 'Netflix, Spotify, AWS and more — add any subscription in seconds with our intelligent quick-pickers.',
  },
  {
    tag: '06',
    title: 'Smart reminders',
    desc: "Get notified days before you are charged. Decide to keep or cancel without the last-minute stress.",
  },
];

const STATS = [
  { value: '2k+', label: 'Users' },
  { value: '500+', label: 'Services' },
  { value: '100%', label: 'Private' },
];

export default function LandingPage() {
  return (
    <div style={{ background: '#0a0a0a', color: '#ffffff', minHeight: '100vh' }}>

      {/* ─── Navbar ─── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: 64,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(10,10,10,0.9)',
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.03em',
          }}>
            S<span style={{ color: '#666' }}>ubora</span>
          </span>
        </div>

        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          <Link href="/login" style={{
            fontSize: '0.8rem', color: '#888', fontWeight: 500,
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: '0.04em',
          }}>Sign In</Link>
          <Link href="/signup" className="btn btn-primary" style={{
            padding: '10px 24px', fontSize: '0.75rem',
          }}>Get Started</Link>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="landing-hero animate-fade-in">
        <div className="landing-badge">TRACK &middot; ANALYZE &middot; SAVE</div>
        <h1 className="landing-title">
          Master your<br />subscriptions
        </h1>
        <p className="landing-subtitle">
          Minimal effort. Maximum clarity. Subora tracks every service you pay for
          and gives you total control over recurring costs.
        </p>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center' }}>
          <Link href="/signup" className="btn btn-primary btn-lg">
            Get Started
          </Link>
          <Link href="/login" style={{
            fontSize: '0.8rem', color: '#888', fontWeight: 500,
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: '0.08em', textTransform: 'uppercase' as const,
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: '0.7rem' }}>&#9654;</span> VIEW DEMO
          </Link>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section style={{
        padding: '64px 48px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{
          maxWidth: 800, margin: '0 auto',
          display: 'flex', justifyContent: 'center', gap: 80,
          flexWrap: 'wrap',
        }}>
          {STATS.map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '2.5rem', fontWeight: 700,
                fontFamily: "'Space Grotesk', sans-serif",
                letterSpacing: '-0.03em', lineHeight: 1,
              }}>{s.value}</div>
              <div style={{
                fontSize: '0.7rem', color: '#555',
                fontWeight: 600, marginTop: 8,
                textTransform: 'uppercase', letterSpacing: '0.15em',
                fontFamily: "'Space Grotesk', sans-serif",
              }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ─── */}
      <section style={{ padding: '80px 48px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <h2 style={{
            fontSize: '2.5rem', fontWeight: 700,
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: '-0.03em', marginBottom: 16,
          }}>Built for clarity</h2>
          <p style={{
            color: '#555', fontSize: '1rem', maxWidth: 460,
            margin: '0 auto', lineHeight: 1.7,
          }}>
            A powerful suite of tools to help you navigate the subscription economy.
          </p>
        </div>

        <div className="feature-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.tag}</div>
              <h3 style={{ marginBottom: 12 }}>{f.title}</h3>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section style={{ padding: '0 48px 100px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{
          padding: '80px 48px', textAlign: 'center',
          border: '1px solid rgba(255,255,255,0.08)',
          background: '#0e0e0e',
        }}>
          <h2 style={{
            fontSize: '2.25rem', fontWeight: 700,
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: '-0.03em', marginBottom: 20,
          }}>Ready to save?</h2>
          <p style={{
            color: '#555', fontSize: '0.95rem', maxWidth: 420,
            margin: '0 auto 40px', lineHeight: 1.7,
          }}>
            Join thousands who have optimized their spending. No credit card required.
          </p>
          <Link href="/signup" className="btn btn-primary btn-lg">
            Create Free Account
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: '40px 48px', textAlign: 'center',
      }}>
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '0.95rem', fontWeight: 700,
          letterSpacing: '-0.02em', marginBottom: 12,
        }}>
          S<span style={{ color: '#555' }}>ubora</span>
        </div>
        <div style={{ color: '#333', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
          &copy; {new Date().getFullYear()} Subora. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
