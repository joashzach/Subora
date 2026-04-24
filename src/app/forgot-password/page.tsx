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
          <div className="sidebar-logo-mark" style={{ width: 38, height: 38 }}>💳</div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Sub<span style={{ color: 'var(--accent)' }}>ora</span>
          </span>
        </div>

        <h1 style={{ fontSize: '1.5rem', marginBottom: 6 }}>Reset password</h1>
        <p className="text-secondary text-sm" style={{ marginBottom: 24 }}>
          Enter your email and we&apos;ll send a reset link
        </p>

        {sent ? (
          <div style={{
            background: 'var(--success-bg)', border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 10, padding: '20px', textAlign: 'center', color: 'var(--success)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>📧</div>
            <div style={{ fontWeight: 600 }}>Check your email!</div>
            <div style={{ fontSize: '0.875rem', marginTop: 4, opacity: 0.8 }}>
              We sent a reset link to {email}
            </div>
          </div>
        ) : (
          <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {error && (
              <div style={{ background: 'var(--danger-bg)', borderRadius: 8, padding: '10px 14px', fontSize: '0.875rem', color: 'var(--danger)' }}>
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
          <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>← Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
