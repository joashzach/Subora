'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { getSubscriptions, getTransactions, getMonthlySpend } from '@/lib/db';
import { Subscription, Transaction } from '@/types';
import { CURRENCY_SYMBOLS } from '@/lib/constants';
import { format, parseISO, differenceInDays } from 'date-fns';
import AddSubscriptionModal from '@/components/subscriptions/AddSubscriptionModal';
import SubscriptionLogo from '@/components/subscriptions/SubscriptionLogo';

export default function DashboardPage() {
  const { user, subscriptions, setSubscriptions, transactions, setTransactions, hideAmounts } = useStore();
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [monthlyData, setMonthlyData] = useState<{ month: string; total: number }[]>([]);

  const currencySymbol = CURRENCY_SYMBOLS[user?.currency || 'USD'] || '$';

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [subs, txns, monthly] = await Promise.all([
        getSubscriptions(user.id),
        getTransactions(user.id, 20),
        getMonthlySpend(user.id, 2),
      ]);
      setSubscriptions(subs);
      setTransactions(txns as Transaction[]);
      setMonthlyData(monthly);
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

  // ─── Computed data ─────────────────────────────────────────────────
  const active = subscriptions.filter((s) => s.status === 'active');

  const monthlyTotal = useMemo(() => active.reduce((sum, s) => {
    if (s.billing_cycle === 'monthly') return sum + Number(s.amount);
    if (s.billing_cycle === 'yearly') return sum + Number(s.amount) / 12;
    if (s.billing_cycle === 'weekly') return sum + Number(s.amount) * 4.33;
    return sum;
  }, 0), [active]);

  // % change vs last month
  const monthOverMonthPct = useMemo(() => {
    if (monthlyData.length < 2) return null;
    const curr = monthlyData[monthlyData.length - 1]?.total || 0;
    const prev = monthlyData[monthlyData.length - 2]?.total || 0;
    if (prev === 0) return null;
    return ((curr - prev) / prev) * 100;
  }, [monthlyData]);

  const now = new Date();
  const upcoming = useMemo(() => active
    .filter((s) => {
      const days = differenceInDays(parseISO(s.next_billing_date), now);
      return days >= 0 && days <= 30;
    })
    .sort((a, b) => a.next_billing_date.localeCompare(b.next_billing_date))
    .slice(0, 5), [active, now]);

  // Spending signals
  const spendingSignal = useMemo(() => {
    if (monthlyData.length < 2) return null;
    const curr = monthlyData[monthlyData.length - 1]?.total || 0;
    const prev = monthlyData[monthlyData.length - 2]?.total || 0;
    if (prev === 0) return null;
    const pct = ((curr - prev) / prev) * 100;
    if (pct > 15) return { type: 'spike' as const, pct, message: `Spending up ${pct.toFixed(0)}% this month` };
    if (pct < -15) return { type: 'drop' as const, pct, message: `Spending down ${Math.abs(pct).toFixed(0)}% this month` };
    return null;
  }, [monthlyData]);

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
          <h1 className="page-title" style={{ fontFamily: 'var(--font-display)' }}>
            {greeting}, {user?.name?.split(' ')[0] || 'there'}
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

      {/* ─── Core Metrics ──────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Monthly Spend — PRIMARY */}
        <div className="stat-card" style={{ gridColumn: '1 / 2', position: 'relative' }}>
          <span className="stat-label">Monthly Spend</span>
          {loading ? (
            <div className="skeleton" style={{ height: 36, width: '60%', borderRadius: 8 }} />
          ) : (
            <>
              <div className="stat-value" style={{ fontSize: '2.5rem' }}>
                {currencySymbol}{maskAmount(monthlyTotal.toFixed(2))}
              </div>
              {monthOverMonthPct !== null && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: '0.8rem', fontWeight: 600, marginTop: 4,
                  padding: '3px 8px', borderRadius: 6,
                  color: monthOverMonthPct > 0 ? 'var(--danger)' : 'var(--success)',
                  background: monthOverMonthPct > 0 ? 'var(--danger-bg)' : 'var(--success-bg)',
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    style={{ transform: monthOverMonthPct > 0 ? 'none' : 'rotate(180deg)' }}>
                    <polyline points="17 11 12 6 7 11"/><line x1="12" y1="18" x2="12" y2="6"/>
                  </svg>
                  {monthOverMonthPct > 0 ? '+' : ''}{monthOverMonthPct.toFixed(1)}% vs last month
                </div>
              )}
              <div className="text-xs text-muted" style={{ marginTop: 4 }}>
                {currencySymbol}{maskAmount((monthlyTotal * 12).toFixed(2))} projected annually
              </div>
            </>
          )}
        </div>

        {/* Active Subscriptions */}
        <div className="stat-card">
          <span className="stat-label">Active Subscriptions</span>
          {loading ? (
            <div className="skeleton" style={{ height: 36, width: '40%', borderRadius: 8 }} />
          ) : (
            <>
              <div className="stat-value">{maskAmount(String(active.length))}</div>
              <div className="text-xs text-muted">
                {subscriptions.filter(s => s.status === 'paused').length} paused · {subscriptions.filter(s => s.status === 'cancelled').length} cancelled
              </div>
            </>
          )}
        </div>

        {/* % Change vs Last Month */}
        <div className="stat-card">
          <span className="stat-label">vs Last Month</span>
          {loading ? (
            <div className="skeleton" style={{ height: 36, width: '50%', borderRadius: 8 }} />
          ) : monthOverMonthPct !== null ? (
            <>
              <div className="stat-value" style={{
                color: monthOverMonthPct > 0 ? 'var(--danger)' : 'var(--success)',
                fontSize: '2rem',
              }}>
                {monthOverMonthPct > 0 ? '+' : ''}{maskAmount(monthOverMonthPct.toFixed(1))}%
              </div>
              <div className="text-xs" style={{
                color: monthOverMonthPct > 0 ? 'var(--danger)' : 'var(--success)',
                fontWeight: 600,
              }}>
                {monthOverMonthPct > 0 ? '↑ Spending increased' : '↓ Spending decreased'}
              </div>
            </>
          ) : (
            <>
              <div className="stat-value" style={{ fontSize: '2rem', color: 'var(--text-muted)' }}>—</div>
              <div className="text-xs text-muted">Not enough data yet</div>
            </>
          )}
        </div>
      </div>

      {/* ─── Spending Signal ──────────────────────────── */}
      {spendingSignal && !loading && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 18px', marginBottom: 24,
          background: spendingSignal.type === 'spike' ? 'var(--danger-bg)' : 'var(--success-bg)',
          border: `1px solid ${spendingSignal.type === 'spike' ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
          borderRadius: 'var(--radius)',
          fontSize: '0.875rem', fontWeight: 600,
          color: spendingSignal.type === 'spike' ? 'var(--danger)' : 'var(--success)',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {spendingSignal.type === 'spike' ? (
              <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>
            ) : (
              <><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></>
            )}
          </svg>
          {spendingSignal.message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        {/* ─── Left: Upcoming Payments (Primary) ────── */}
        <div>
          <div className="section-header">
            <h2 className="section-title">Upcoming Payments</h2>
            <span className="text-xs text-muted">Next 30 days</span>
          </div>

          <div className="card" style={{ padding: 0 }}>
            {loading ? (
              <div style={{ padding: 16 }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                    <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10 }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton" style={{ height: 14, width: '50%', marginBottom: 6 }} />
                      <div className="skeleton" style={{ height: 10, width: '30%' }} />
                    </div>
                    <div className="skeleton" style={{ height: 16, width: 60 }} />
                  </div>
                ))}
              </div>
            ) : upcoming.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: 4 }}>No upcoming payments</h3>
                <p className="text-sm text-muted">No renewals in the next 30 days</p>
              </div>
            ) : (
              <div style={{ padding: '0 16px' }}>
                {upcoming.map((sub, i) => {
                  const days = differenceInDays(parseISO(sub.next_billing_date), now);
                  const isUrgent = days <= 3;
                  return (
                    <div key={sub.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '14px 0',
                      borderBottom: i < upcoming.length - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                      <div style={{ outline: isUrgent ? '1.5px solid var(--danger)' : '1px solid transparent', borderRadius: 11 }}>
                        <SubscriptionLogo name={sub.name} logoUrl={sub.logo_url} website={sub.website} color={sub.color} size={40} radius={10} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="font-semibold text-sm">{sub.name}</div>
                        <div className="text-xs" style={{
                          color: isUrgent ? 'var(--danger)' : 'var(--text-muted)',
                          fontWeight: isUrgent ? 600 : 400,
                          marginTop: 1,
                        }}>
                          {days === 0 ? '⚡ Due today' : days === 1 ? '⚡ Due tomorrow' : `Due in ${days} days`}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="font-bold text-sm">{currencySymbol}{maskAmount(Number(sub.amount).toFixed(2))}</div>
                        <div className="text-xs text-muted">/{sub.billing_cycle}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ─── Right: Quick Overview ────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Recent Activity */}
          <div>
            <div className="section-header">
              <h2 className="section-title">Recent Activity</h2>
            </div>
            <div className="card" style={{ padding: 0 }}>
              {loading ? (
                <div style={{ padding: 16 }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                      <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
                      <div style={{ flex: 1 }}>
                        <div className="skeleton" style={{ height: 12, width: '60%', marginBottom: 4 }} />
                        <div className="skeleton" style={{ height: 10, width: '35%' }} />
                      </div>
                      <div className="skeleton" style={{ height: 14, width: 50 }} />
                    </div>
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="empty-state" style={{ padding: '28px 16px' }}>
                  <p className="text-sm text-muted">No transactions yet</p>
                </div>
              ) : (
                <div style={{ padding: '0 14px' }}>
                  {transactions.slice(0, 5).map((txn, i) => {
                    const sub = subscriptions.find(s => s.id === txn.subscription_id);
                    return (
                      <div key={txn.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 0',
                        borderBottom: i < Math.min(transactions.length, 5) - 1 ? '1px solid var(--border)' : 'none',
                      }}>
                        {sub ? (
                          <SubscriptionLogo name={sub.name} logoUrl={sub.logo_url} website={sub.website} color={sub.color} size={32} radius={8} />
                        ) : (
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface-2)', flexShrink: 0 }} />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="font-semibold" style={{ fontSize: '0.8125rem' }}>{sub?.name || txn.note || 'Unknown'}</div>
                          <div className="text-xs text-muted">{format(parseISO(txn.date), 'MMM d')}</div>
                        </div>
                        <div className="font-bold" style={{ fontSize: '0.8125rem', color: 'var(--danger)' }}>
                          -{currencySymbol}{maskAmount(Number(txn.amount).toFixed(2))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Active Services */}
          <div>
            <div className="section-header">
              <h2 className="section-title">Active Services</h2>
              <span className="text-xs text-muted">{active.length} services</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {loading ? (
                [1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 48, borderRadius: 10 }} />)
              ) : active.length === 0 ? (
                <div className="empty-state" style={{ padding: '28px 16px' }}>
                  <p className="text-sm text-muted">No active subscriptions</p>
                </div>
              ) : active.slice(0, 5).map((sub) => {
                return (
                  <div key={sub.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 10, padding: '8px 12px',
                  }}>
                    <SubscriptionLogo name={sub.name} logoUrl={sub.logo_url} website={sub.website} color={sub.color} size={30} radius={8} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="font-semibold truncate" style={{ fontSize: '0.8125rem' }}>{sub.name}</div>
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
