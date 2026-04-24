'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  }

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-logo">
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.03em',
          }}>
            S<span style={{ color: '#666' }}>ubora</span>
          </span>
        </div>

        <h1 style={{
          fontSize: '1.35rem', marginBottom: 6,
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700, letterSpacing: '-0.02em',
        }}>Reset password</h1>
        <p className="text-secondary text-sm" style={{ marginBottom: 24 }}>
          Enter your email and we&apos;ll send a reset link
        </p>

        {sent ? (
          <div style={{
            background: 'var(--success-bg)', border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 4, padding: '20px', textAlign: 'center', color: 'var(--success)'
          }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Check your email</div>
            <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
              We sent a reset link to {email}
            </div>
          </div>
        ) : (
          <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {error && (
              <div style={{
                background: 'var(--danger-bg)', borderRadius: 4,
                padding: '10px 14px', fontSize: '0.875rem', color: 'var(--danger)'
              }}>
                {error}
              </div>
            )}
            <div className="form-group">
              <label className="form-label" htmlFor="reset-email">Email</label>
              <input id="reset-email" type="email" className="form-input" value={email}
                onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}
              style={{ justifyContent: 'center' }}>
              {loading ? <span className="spinner" /> : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p className="text-sm text-secondary" style={{ textAlign: 'center', marginTop: 20 }}>
          <Link href="/login" style={{ color: '#fff', fontWeight: 600 }}>Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
