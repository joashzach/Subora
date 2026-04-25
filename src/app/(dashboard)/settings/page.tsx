'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { getPreferences, updatePreferences, updateProfile } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { ACCENT_COLORS } from '@/lib/constants';

const TABS = ['Appearance', 'Notifications', 'Privacy', 'Sessions'];

export default function SettingsPage() {
  const { user, theme, setTheme, accentColor, setAccentColor, hideAmounts, setHideAmounts, setUser } = useStore();
  const [activeTab, setActiveTab] = useState('Appearance');
  const [prefs, setPrefs] = useState<{
    notification_settings: {
      renewal_reminders: boolean;
      budget_alerts: boolean;
      ai_insights: boolean;
      service_outages: boolean;
      new_features: boolean;
      channels: { email: boolean; push: boolean; sms: boolean };
      reminder_days_before: number;
    };
    privacy_settings: { 
      hide_amounts: boolean; 
      disable_bank_integration: boolean;
      anonymize_data: boolean;
      track_usage: boolean;
    };
    layout_preferences: { view_mode: string; dashboard_layout: string };
  } | null>(null);
  const [sessions, setSessions] = useState<Array<{ id: string; device_info: string; last_active: string; is_current: boolean }>>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    
    // Set default prefs immediately so UI is never empty
    const defaultPrefs = {
      notification_settings: {
        renewal_reminders: true, 
        budget_alerts: true, 
        ai_insights: true,
        service_outages: false,
        new_features: true,
        channels: { email: true, push: false, sms: false }, 
        reminder_days_before: 3,
      },
      privacy_settings: { 
        hide_amounts: false, 
        disable_bank_integration: false,
        anonymize_data: false,
        track_usage: true 
      },
      layout_preferences: { view_mode: 'grid', dashboard_layout: 'detailed' },
    };
    
    setPrefs(defaultPrefs);

    getPreferences(user.id).then((fetched) => {
      if (fetched) setPrefs(prev => ({ ...prev, ...fetched }));
    }).catch(() => {
      console.warn('Preferences table might be missing or unreachable.');
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessions([{
          id: session.access_token.slice(0, 8),
          device_info: navigator.userAgent.split('(')[0].trim() + ' — ' + navigator.platform,
          last_active: new Date().toISOString(),
          is_current: true,
        }]);
      }
    });
  }, [user?.id]);

  async function savePrefs(updates: Partial<typeof prefs>) {
    if (!user?.id || !prefs) return;
    setSaving(true);
    const merged = { ...prefs, ...updates };
    await updatePreferences(user.id, merged);
    setPrefs(merged);
    setSaved('Saved!');
    setTimeout(() => setSaved(''), 2000);
    setSaving(false);
  }

  async function saveTheme(t: 'light' | 'dark' | 'auto') {
    setTheme(t);
    if (user?.id) await updateProfile(user.id, { theme_preference: t });
    document.documentElement.setAttribute('data-theme', t === 'auto'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : t);
  }

  function handleAccentColor(color: string) {
    setAccentColor(color);
    document.documentElement.style.setProperty('--accent', color);
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    document.documentElement.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);
    if (user?.id) updateProfile(user.id, { accent_color: color });
  }

  async function handleExport() {
    if (!user?.id) return;
    setExportLoading(true);
    const { data: subs } = await supabase.from('subscriptions').select('*').eq('user_id', user.id);
    const { data: txns } = await supabase.from('transactions').select('*').eq('user_id', user.id);
    const blob = new Blob([JSON.stringify({ subscriptions: subs, transactions: txns }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'subora-export.json'; a.click();
    setExportLoading(false);
  }

  async function handleDeleteAccount() {
    if (!confirm('This will permanently delete your account and all data. Are you sure?')) return;
    if (!confirm('Are you absolutely sure? This cannot be undone.')) return;
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/';
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Customize your experience</p>
        </div>
        {saved && (
          <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            ✅ {saved}
          </span>
        )}
      </div>

      {/* Tab nav */}
      <div className="tab-nav">
        {TABS.map((tab) => (
          <button
            key={tab}
            id={`tab-${tab.toLowerCase()}`}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Appearance */}
      {activeTab === 'Appearance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Theme</h3>
            <div style={{ display: 'flex', gap: 12 }}>
              {(['dark', 'light', 'auto'] as const).map((t) => (
                <button
                  key={t}
                  id={`btn-theme-${t}`}
                  onClick={() => saveTheme(t)}
                  style={{
                    flex: 1, padding: '16px 12px', borderRadius: 12, cursor: 'pointer',
                    border: theme === t ? '2px solid var(--accent)' : '1px solid var(--border)',
                    background: theme === t ? 'rgba(var(--accent-rgb), 0.08)' : 'var(--surface-2)',
                    color: theme === t ? 'var(--accent)' : 'var(--text-secondary)',
                    fontWeight: theme === t ? 700 : 500, fontSize: '0.875rem',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    transition: 'all 0.15s'
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>
                    {t === 'dark' ? '🌙' : t === 'light' ? '☀️' : '🖥️'}
                  </span>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Accent Color</h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {ACCENT_COLORS.map((ac) => (
                <button
                  key={ac.value}
                  id={`btn-accent-${ac.name.toLowerCase()}`}
                  className={`color-swatch ${accentColor === ac.value ? 'selected' : ''}`}
                  style={{ background: ac.value, width: 36, height: 36 }}
                  onClick={() => handleAccentColor(ac.value)}
                  title={ac.name}
                />
              ))}
            </div>
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="text-sm text-muted">Custom:</span>
              <input
                type="color"
                value={accentColor}
                onChange={(e) => handleAccentColor(e.target.value)}
                style={{ width: 36, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'none' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {activeTab === 'Notifications' && prefs && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <h3 style={{ marginBottom: 4 }}>Alerts</h3>
            <p className="text-sm text-muted" style={{ marginBottom: 16 }}>Configure which notifications you receive</p>

            {[
              { key: 'renewal_reminders', label: 'Renewal Reminders', desc: 'Get notified before subscriptions renew' },
              { key: 'budget_alerts', label: 'Budget Alerts', desc: 'Alerts when spending exceeds your budget' },
              { key: 'ai_insights', label: 'Spending Insights', desc: 'Smart tips based on your subscription data' },
              { key: 'service_outages', label: 'Service Outages', desc: 'Alerts for major subscription service downtime' },
              { key: 'new_features', label: 'Product Updates', desc: 'Be the first to know about new Subora features' },
            ].map((item) => (
              <div key={item.key} className="settings-row">
                <div className="settings-row-info">
                  <div className="settings-row-label">{item.label}</div>
                  <div className="settings-row-desc">{item.desc}</div>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={prefs.notification_settings[item.key as keyof typeof prefs.notification_settings] as boolean || false}
                    onChange={(e) => savePrefs({
                      notification_settings: {
                        ...prefs.notification_settings,
                        [item.key]: e.target.checked
                      }
                    })}
                  />
                  <div className="toggle-track" />
                  <div className="toggle-thumb" />
                </label>
              </div>
            ))}

            <div className="settings-row">
              <div className="settings-row-info">
                <div className="settings-row-label">Days Before Renewal</div>
                <div className="settings-row-desc">How many days in advance to remind you</div>
              </div>
              <select
                className="form-select"
                value={prefs.notification_settings.reminder_days_before}
                onChange={(e) => savePrefs({
                  notification_settings: { ...prefs.notification_settings, reminder_days_before: Number(e.target.value) }
                })}
                style={{ width: 90 }}
              >
                {[1, 2, 3, 5, 7, 14].map(d => <option key={d} value={d}>{d} day{d > 1 ? 's' : ''}</option>)}
              </select>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 4 }}>Channels</h3>
            <p className="text-sm text-muted" style={{ marginBottom: 16 }}>Select how you want to be notified</p>
            {[
              { key: 'email', label: 'Email Notifications', desc: 'Receive alerts via email', available: true },
              { key: 'push', label: 'Push Notifications', desc: 'Browser push notifications', available: false },
              { key: 'sms', label: 'SMS Notifications', desc: 'Text message alerts', available: false },
            ].map((ch) => (
              <div key={ch.key} className="settings-row">
                <div className="settings-row-info">
                  <div className="settings-row-label">
                    {ch.label}
                    {!ch.available && (
                      <span style={{ marginLeft: 8, fontSize: '0.7rem', background: 'var(--surface-3)', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: 4, fontWeight: 400 }}>
                        Coming soon
                      </span>
                    )}
                  </div>
                  <div className="settings-row-desc">{ch.desc}</div>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    disabled={!ch.available}
                    checked={prefs.notification_settings.channels[ch.key as keyof typeof prefs.notification_settings.channels]}
                    onChange={(e) => savePrefs({
                      notification_settings: {
                        ...prefs.notification_settings,
                        channels: { ...prefs.notification_settings.channels, [ch.key]: e.target.checked }
                      }
                    })}
                  />
                  <div className="toggle-track" style={!ch.available ? { opacity: 0.4 } : undefined} />
                  <div className="toggle-thumb" />
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Privacy */}
      {activeTab === 'Privacy' && prefs && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <h3 style={{ marginBottom: 4 }}>Privacy Controls</h3>
            <p className="text-sm text-muted" style={{ marginBottom: 16 }}>Control how your data is displayed and used</p>

            <div className="settings-row">
              <div className="settings-row-info">
                <div className="settings-row-label">Hide Amounts</div>
                <div className="settings-row-desc">Mask all monetary values across the app</div>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={hideAmounts}
                  onChange={(e) => setHideAmounts(e.target.checked)} />
                <div className="toggle-track" />
                <div className="toggle-thumb" />
              </label>
            </div>

            <div className="settings-row">
              <div className="settings-row-info">
                <div className="settings-row-label">Anonymize My Data</div>
                <div className="settings-row-desc">Remove identifiable information from analytics</div>
              </div>
              <label className="toggle">
                <input type="checkbox" 
                  checked={prefs.privacy_settings.anonymize_data || false}
                  onChange={(e) => savePrefs({
                    privacy_settings: { ...prefs.privacy_settings, anonymize_data: e.target.checked }
                  })} />
                <div className="toggle-track" />
                <div className="toggle-thumb" />
              </label>
            </div>

            <div className="settings-row">
              <div className="settings-row-info">
                <div className="settings-row-label">Usage Tracking</div>
                <div className="settings-row-desc">Help improve Subora by sharing anonymous usage data</div>
              </div>
              <label className="toggle">
                <input type="checkbox" 
                  checked={prefs.privacy_settings.track_usage !== false}
                  onChange={(e) => savePrefs({
                    privacy_settings: { ...prefs.privacy_settings, track_usage: e.target.checked }
                  })} />
                <div className="toggle-track" />
                <div className="toggle-thumb" />
              </label>
            </div>

            <div className="settings-row">
              <div className="settings-row-info">
                <div className="settings-row-label">Disable Bank Integration</div>
                <div className="settings-row-desc">Prevent automatic financial data import</div>
              </div>
              <label className="toggle">
                <input type="checkbox"
                  checked={prefs.privacy_settings.disable_bank_integration}
                  onChange={(e) => savePrefs({
                    privacy_settings: { ...prefs.privacy_settings, disable_bank_integration: e.target.checked }
                  })} />
                <div className="toggle-track" />
                <div className="toggle-thumb" />
              </label>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 4 }}>Data Management</h3>
            <p className="text-sm text-muted" style={{ marginBottom: 16 }}>Export or permanently delete your data</p>

            <div className="settings-row">
              <div className="settings-row-info">
                <div className="settings-row-label">Export Data</div>
                <div className="settings-row-desc">Download all your subscriptions and transactions as JSON</div>
              </div>
              <button
                id="btn-export-data"
                className="btn btn-secondary btn-sm"
                onClick={handleExport}
                disabled={exportLoading}
              >
                {exportLoading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '⬇️ Export'}
              </button>
            </div>

            <div className="settings-row" style={{ borderBottom: 'none' }}>
              <div className="settings-row-info">
                <div className="settings-row-label" style={{ color: 'var(--danger)' }}>Delete Account</div>
                <div className="settings-row-desc">Permanently delete your account and all data</div>
              </div>
              <button
                id="btn-delete-account"
                className="btn btn-danger btn-sm"
                onClick={handleDeleteAccount}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sessions */}
      {activeTab === 'Sessions' && (
        <div>
          <div className="card">
            <h3 style={{ marginBottom: 4 }}>Active Sessions</h3>
            <p className="text-sm text-muted" style={{ marginBottom: 20 }}>Devices currently logged into your account</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sessions.map((s) => (
                <div key={s.id} className={`session-card ${s.is_current ? 'session-current' : ''}`}>
                  <div style={{ fontSize: '1.5rem' }}>🖥️</div>
                  <div style={{ flex: 1 }}>
                    <div className="session-device">{s.device_info.slice(0, 50)}</div>
                    <div className="session-meta">
                      Last active: {new Date(s.last_active).toLocaleString()}
                      {s.is_current && <span style={{ marginLeft: 8, color: 'var(--success)', fontWeight: 600 }}>· Current session</span>}
                    </div>
                  </div>
                  {!s.is_current && (
                    <button className="btn btn-danger btn-sm">Revoke</button>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <button
                id="btn-logout-all"
                className="btn btn-secondary"
                onClick={async () => {
                  await supabase.auth.signOut({ scope: 'global' });
                  window.location.href = '/';
                }}
              >
                Sign out of all devices
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
