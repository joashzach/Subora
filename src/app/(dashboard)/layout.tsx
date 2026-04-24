'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { getProfile } from '@/lib/db';

const NAV_ITEMS = [
  { href: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { href: '/subscriptions', icon: '📋', label: 'Subscriptions' },
  { href: '/analytics', icon: '📊', label: 'Analytics' },
];

const SETTINGS_ITEMS = [
  { href: '/profile', icon: '👤', label: 'Profile' },
  { href: '/settings', icon: '⚙️', label: 'Settings' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser, theme, accentColor, sidebarOpen, setSidebarOpen } = useStore();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.push('/login');
        return;
      }
      try {
        const profile = await getProfile(session.user.id);
        setUser({ ...profile, email: session.user.email! });
      } catch (err) {
        console.error('Error fetching profile:', err);
        // Fallback user if profile fetch fails
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          currency: 'USD',
          theme_preference: 'dark'
        } as any);
      } finally {
        setLoading(false);
      }
    }).catch(err => {
      console.error('Session error:', err);
      router.push('/login');
    });
  }, [router, setUser]);

  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute('data-theme', theme === 'auto'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme);
      // Apply accent color
      const color = accentColor || '#6366f1';
      document.documentElement.style.setProperty('--accent', color);
      const hex = color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      document.documentElement.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);
    }
  }, [theme, accentColor, mounted]);

  if (!mounted || loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div className="spinner" style={{ width: 40, height: 40, border: '3px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style jsx>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
  }

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">💳</div>
          <span className="sidebar-logo-text">Sub<span>ora</span></span>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <span className="nav-section-label">Main</span>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname === item.href ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}

          <span className="nav-section-label">Settings</span>
          {SETTINGS_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname === item.href ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
              {user?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar_url} alt="avatar" className="avatar" style={{ width: 36, height: 36 }} />
              ) : (
                <div className="avatar-placeholder" style={{ width: 36, height: 36, fontSize: '0.8rem' }}>
                  {initials}
                </div>
              )}
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, lineHeight: 1.2, color: 'var(--text-primary)' }} className="truncate" >
                  {user?.name || 'User'}
                </div>
                <div className="text-xs text-muted truncate" style={{ opacity: 0.7 }}>{user?.email}</div>
              </div>
            </div>
            <button
              className="btn-icon"
              onClick={handleLogout}
              title="Sign out"
              style={{ flexShrink: 0, width: 32, height: 32 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <main className="main-content">
        {/* Mobile top bar */}
        <div style={{
          display: 'none', alignItems: 'center', gap: 12,
          padding: '16px', borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
          position: 'sticky', top: 0, zIndex: 50
        }} className="mobile-topbar">
          <button
            className="btn-icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="sidebar-logo-mark" style={{ width: 24, height: 24, borderRadius: 6, fontSize: '0.7rem' }}>💳</div>
            <span style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em' }}>Sub<span style={{ color: 'var(--accent)' }}>ora</span></span>
          </div>
        </div>

        <div className="page-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
}
