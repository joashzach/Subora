'use client';

import { useEffect, useState, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { updateProfile } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { CURRENCIES, TIMEZONES } from '@/lib/constants';

export default function ProfilePage() {
  const { user, setUser } = useStore();
  const [name, setName] = useState(user?.name || '');
  const [currency, setCurrency] = useState(user?.currency || 'USD');
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setCurrency(user.currency || 'USD');
      setTimezone(user.timezone || 'UTC');
    }
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) return;
    setLoading(true);
    const updated = await updateProfile(user.id, { name, currency, timezone });
    setUser({ ...user, ...updated });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setLoading(false);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setAvatarLoading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const avatar_url = data.publicUrl + `?t=${Date.now()}`;
      await updateProfile(user.id, { avatar_url });
      setUser({ ...user, avatar_url });
    }
    setAvatarLoading(false);
  }

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Manage your personal information</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24 }}>
        {/* Avatar card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: 32 }}>
          <div
            className="avatar-upload"
            onClick={() => fileRef.current?.click()}
            title="Click to upload avatar"
          >
            {user?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar_url} alt="avatar" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div className="avatar-placeholder" style={{ width: 100, height: 100, fontSize: '2.5rem' }}>
                {initials}
              </div>
            )}
            <div className="avatar-upload-overlay">
              {avatarLoading ? <span className="spinner" /> : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              )}
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>{user?.name}</div>
            <div className="text-sm text-muted">{user?.email}</div>
          </div>

          <div style={{ width: '100%', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <div className="text-xs text-muted" style={{ marginBottom: 10 }}>Member since</div>
            <div className="text-sm font-semibold">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
            </div>
          </div>
        </div>

        {/* Edit form */}
        <div className="card">
          <h3 style={{ marginBottom: 20 }}>Personal Information</h3>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="profile-name">Full Name</label>
              <input
                id="profile-name"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                value={user?.email || ''}
                disabled
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
              />
              <span className="text-xs text-muted">Email cannot be changed from here</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="profile-currency">Currency</label>
                <select
                  id="profile-currency"
                  className="form-select"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.symbol} {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="profile-timezone">Timezone</label>
                <select
                  id="profile-timezone"
                  className="form-select"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ paddingTop: 4 }}>
              <button
                id="btn-save-profile"
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? <span className="spinner" /> : saved ? '✅ Saved!' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
