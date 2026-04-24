'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  }

  async function handleGoogleOAuth() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    });
  }

  return (
    <div className="auth-bg">
      <div className="auth-card">
        {/* Logo */}
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
        }}>Welcome back</h1>
        <p className="text-secondary text-sm" style={{ marginBottom: 24 }}>
          Sign in to manage your subscriptions
        </p>

        {error && (
          <div style={{
            background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 4, padding: '10px 14px', marginBottom: 16,
            fontSize: '0.875rem', color: 'var(--danger)'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="login-password">Password</label>
              <Link href="/forgot-password" style={{ fontSize: '0.75rem', color: '#888' }}>
                Forgot password?
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            id="btn-login"
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={loading}
            style={{ marginTop: 4, justifyContent: 'center' }}
          >
            {loading ? <span className="spinner" /> : 'Sign In'}
          </button>
        </form>

        <div className="auth-divider">or continue with</div>

        <button className="oauth-btn" onClick={handleGoogleOAuth} id="btn-google-oauth">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </button>

        <p className="text-sm text-secondary" style={{ textAlign: 'center', marginTop: 24 }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" style={{ color: '#fff', fontWeight: 600 }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
