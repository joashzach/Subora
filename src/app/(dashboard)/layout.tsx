'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { getProfile } from '@/lib/db';

const NAV_ITEMS = [
  {
    href: '/dashboard', label: 'Dashboard',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  },
  {
    href: '/subscriptions', label: 'Subscriptions',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="15" y2="16"/></svg>,
  },
  {
    href: '/analytics', label: 'Analytics',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  },
];

const SETTINGS_ITEMS = [
  {
    href: '/profile', label: 'Profile',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },
  {
    href: '/settings', label: 'Settings',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  },
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
      const color = accentColor || '#ffffff';
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
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
        <div style={{ width: 24, height: 24, border: '2px solid #333', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
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
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.03em',
          }}>
            S<span style={{ color: '#555' }}>ubora</span>
          </span>
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
              {item.icon}
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
              {item.icon}
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
                <img src={user.avatar_url} alt="avatar" className="avatar" style={{ width: 32, height: 32, borderRadius: '50%' }} />
              ) : (
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: '#252525', border: '1px solid #333',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 700, color: '#999',
                  fontFamily: "'Space Grotesk', sans-serif",
                }}>
                  {initials}
                </div>
              )}
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.2, color: '#fff' }} className="truncate">
                  {user?.name || 'User'}
                </div>
                <div className="text-xs truncate" style={{ color: '#555', fontSize: '0.7rem' }}>{user?.email}</div>
              </div>
            </div>
            <button
              className="btn-icon"
              onClick={handleLogout}
              title="Sign out"
              style={{ flexShrink: 0, width: 28, height: 28 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
          <button className="btn-icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em'
          }}>
            S<span style={{ color: '#555' }}>ubora</span>
          </span>
        </div>

        <div className="page-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
}
