'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { getSubscriptions, getTransactions, computeInsights } from '@/lib/db';
import { Subscription, Transaction } from '@/types';
import { CURRENCY_SYMBOLS, BRANDED_SERVICES } from '@/lib/constants';
import { format, parseISO, differenceInDays } from 'date-fns';
import AddSubscriptionModal from '@/components/subscriptions/AddSubscriptionModal';

export default function DashboardPage() {
  const { user, subscriptions, setSubscriptions, transactions, setTransactions, hideAmounts } = useStore();
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const currencySymbol = CURRENCY_SYMBOLS[user?.currency || 'USD'] || '$';

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [subs, txns] = await Promise.all([
        getSubscriptions(user.id),
        getTransactions(user.id, 20),
      ]);
      setSubscriptions(subs);
      setTransactions(txns as Transaction[]);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, setSubscriptions, setTransactions]);

  useEffect(() => { loadData(); }, [loadData]);

  // Realtime sync
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`subscriptions:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions', filter: `user_id=eq.${user.id}` },
        () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, loadData]);

  const active = subscriptions.filter((s) => s.status === 'active');
  const monthlyTotal = active.reduce((sum, s) => {
    if (s.billing_cycle === 'monthly') return sum + Number(s.amount);
    if (s.billing_cycle === 'yearly') return sum + Number(s.amount) / 12;
    if (s.billing_cycle === 'weekly') return sum + Number(s.amount) * 4.33;
    return sum;
  }, 0);
  const yearlyTotal = monthlyTotal * 12;

  const now = new Date();
  const upcoming = active
    .filter((s) => differenceInDays(parseISO(s.next_billing_date), now) <= 30)
    .sort((a, b) => a.next_billing_date.localeCompare(b.next_billing_date))
    .slice(0, 5);

  const insights = computeInsights(subscriptions, transactions, currencySymbol);

  function maskAmount(val: string) {
    return hideAmounts ? '••••' : val;
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {greeting}, {user?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="page-subtitle">Here&apos;s your subscription overview</p>
        </div>
        <button className="btn btn-primary" id="btn-add-subscription" onClick={() => setShowAddModal(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Subscription
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard
          icon="💰"
          label="Monthly Spend"
          value={`${currencySymbol}${maskAmount(monthlyTotal.toFixed(2))}`}
          sub={`${currencySymbol}${maskAmount(yearlyTotal.toFixed(2))} / year`}
          loading={loading}
        />
        <StatCard
          icon="🔔"
          label="Active Subscriptions"
          value={maskAmount(String(active.length))}
          sub={`${subscriptions.filter(s => s.status === 'cancelled').length} cancelled`}
          loading={loading}
        />
        <StatCard
          icon="📅"
          label="Upcoming Renewals"
          value={maskAmount(String(upcoming.length))}
          sub={upcoming.length > 0 ? `Next: ${upcoming[0]?.name}` : 'None in 30 days'}
          loading={loading}
        />
        <StatCard
          icon="📊"
          label="Avg Per Subscription"
          value={`${currencySymbol}${maskAmount(active.length > 0 ? (monthlyTotal / active.length).toFixed(2) : '0.00')}`}
          sub="per month"
          loading={loading}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Insights */}
          {insights.length > 0 && (
            <div>
              <div className="section-header">
                <h2 className="section-title">💡 Smart Insights</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {insights.map((ins) => (
                  <div key={ins.id} className={`insight-card insight-${ins.type}`}>
                    <div className="insight-icon">{ins.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="insight-title">{ins.title}</div>
                      <div className="insight-desc">{ins.description}</div>
                    </div>
                    {ins.value && (
                      <span className="insight-value">{ins.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Transactions */}
          <div>
            <div className="section-header">
              <h2 className="section-title">🕐 Recent Transactions</h2>
            </div>
            <div className="card" style={{ padding: 0 }}>
              {loading ? (
                <div style={{ padding: 24 }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                      <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 8 }} />
                      <div style={{ flex: 1 }}>
                        <div className="skeleton" style={{ height: 12, width: '60%', marginBottom: 6 }} />
                        <div className="skeleton" style={{ height: 10, width: '40%' }} />
                      </div>
                      <div className="skeleton" style={{ height: 14, width: 60 }} />
                    </div>
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">💳</div>
                  <h3>No transactions yet</h3>
                  <p>Add your first subscription to start tracking</p>
                </div>
              ) : (
                <div style={{ padding: '0 16px' }}>
                  {transactions.map((txn, i) => {
                    const sub = subscriptions.find(s => s.id === txn.subscription_id);
                    const icon = sub ? (BRANDED_SERVICES[sub.name]?.icon || '💳') : '💳';
                    return (
                      <div key={txn.id} className="timeline-item" style={{ borderBottom: i < transactions.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 8,
                          background: sub?.color ? `${sub.color}22` : 'var(--surface-2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1rem', flexShrink: 0
                        }}>{icon}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="font-semibold text-sm">{sub?.name || txn.note || 'Unknown'}</div>
                          <div className="text-xs text-muted">{format(parseISO(txn.date), 'MMM d, yyyy')}</div>
                        </div>
                        <div className="font-bold text-sm" style={{ color: 'var(--danger)' }}>
                          -{currencySymbol}{maskAmount(Number(txn.amount).toFixed(2))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Upcoming */}
        <div>
          <div className="section-header">
            <h2 className="section-title">📅 Upcoming Renewals</h2>
          </div>
          <div className="card" style={{ padding: 0 }}>
            {upcoming.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 20px' }}>
                <div style={{ fontSize: '2rem' }}>🎉</div>
                <p className="text-sm">No renewals in the next 30 days</p>
              </div>
            ) : (
              <div style={{ padding: '0 16px' }}>
                {upcoming.map((sub, i) => {
                  const days = differenceInDays(parseISO(sub.next_billing_date), now);
                  const icon = BRANDED_SERVICES[sub.name]?.icon || '💳';
                  return (
                    <div key={sub.id} className="timeline-item" style={{ borderBottom: i < upcoming.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 8,
                        background: `${sub.color}22`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1rem', flexShrink: 0
                      }}>{icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="font-semibold text-sm">{sub.name}</div>
                        <div className="text-xs" style={{ color: days <= 3 ? 'var(--danger)' : 'var(--text-muted)', marginTop: 1 }}>
                          {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `in ${days} days`}
                        </div>
                      </div>
                      <div className="font-bold text-sm">
                        {currencySymbol}{maskAmount(Number(sub.amount).toFixed(2))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active subs mini list */}
          <div style={{ marginTop: 20 }}>
            <div className="section-header">
              <h2 className="section-title">🚀 Active Services</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {loading ? (
                [1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 12 }} />)
              ) : active.slice(0, 5).map((sub) => {
                const icon = BRANDED_SERVICES[sub.name]?.icon || '📦';
                return (
                  <div key={sub.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 10, padding: '10px 12px'
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: `${sub.color}22`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.9rem', flexShrink: 0
                    }}>{icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="font-semibold text-sm truncate">{sub.name}</div>
                    </div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: sub.color }}>
                      {currencySymbol}{maskAmount(Number(sub.amount).toFixed(2))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddSubscriptionModal
          onClose={() => setShowAddModal(false)}
          onAdded={() => { setShowAddModal(false); loadData(); }}
        />
      )}
    </>
  );
}

function StatCard({ icon, label, value, sub, loading }: { icon: string; label: string; value: string; sub: string; loading?: boolean }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="stat-icon">{icon}</div>
        <span className="stat-label">{label}</span>
      </div>
      {loading ? (
        <>
          <div className="skeleton" style={{ height: 32, width: '60%', borderRadius: 8 }} />
          <div className="skeleton" style={{ height: 12, width: '40%', borderRadius: 6 }} />
        </>
      ) : (
        <>
          <div className="stat-value">{value}</div>
          <div className="text-xs text-muted">{sub}</div>
        </>
      )}
    </div>
  );
}
