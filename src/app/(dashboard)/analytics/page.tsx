'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { getSubscriptions, getTransactions, getMonthlySpend } from '@/lib/db';
import { Subscription, Transaction } from '@/types';
import { CATEGORY_COLORS, CURRENCY_SYMBOLS } from '@/lib/constants';
import {
  LineChart, Line, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

type TimeRange = '30d' | '3m' | '1y';

export default function AnalyticsPage() {
  const { user, subscriptions, setSubscriptions, hideAmounts } = useStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; total: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('3m');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const currencySymbol = CURRENCY_SYMBOLS[user?.currency || 'INR'] || '₹';

  const monthsMap: Record<TimeRange, number> = { '30d': 1, '3m': 3, '1y': 12 };

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [subs, txns, monthly] = await Promise.all([
        getSubscriptions(user.id),
        getTransactions(user.id, 200),
        getMonthlySpend(user.id, monthsMap[timeRange]),
      ]);
      setSubscriptions(subs);
      setTransactions(txns as Transaction[]);
      setMonthlyData(monthly);
    } catch (err) {
      console.error('Analytics load error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, setSubscriptions, timeRange]);

  useEffect(() => { setLoading(true); loadData(); }, [loadData]);

  // ─── Computed ─────────────────────────────────────────
  const active = useMemo(() => {
    const subs = subscriptions.filter((s) => s.status === 'active');
    if (categoryFilter === 'all') return subs;
    return subs.filter(s => s.category === categoryFilter);
  }, [subscriptions, categoryFilter]);

  const monthlyTotal = useMemo(() => active.reduce((sum, s) => {
    if (s.billing_cycle === 'monthly') return sum + Number(s.amount);
    if (s.billing_cycle === 'yearly') return sum + Number(s.amount) / 12;
    if (s.billing_cycle === 'weekly') return sum + Number(s.amount) * 4.33;
    return sum;
  }, 0), [active]);

  // Category breakdown
  const categoryData = useMemo(() => {
    const byCategory: Record<string, number> = {};
    active.forEach((s) => {
      const monthly = s.billing_cycle === 'monthly' ? Number(s.amount)
        : s.billing_cycle === 'yearly' ? Number(s.amount) / 12
        : Number(s.amount) * 4.33;
      byCategory[s.category] = (byCategory[s.category] || 0) + monthly;
    });
    return Object.entries(byCategory)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: parseFloat(value.toFixed(2)),
        rawName: name,
      }))
      .sort((a, b) => b.value - a.value);
  }, [active]);

  // Top expenses
  const topExpenses = useMemo(() => active
    .map(s => ({
      ...s,
      monthlyAmount: s.billing_cycle === 'monthly' ? Number(s.amount)
        : s.billing_cycle === 'yearly' ? Number(s.amount) / 12
        : Number(s.amount) * 4.33,
    }))
    .sort((a, b) => b.monthlyAmount - a.monthlyAmount)
    .slice(0, 6), [active]);

  // Optimization insights
  const optimizations = useMemo(() => {
    const opts: { id: string; type: 'save' | 'warn' | 'info'; title: string; desc: string; value: string }[] = [];

    // Monthly → annual savings
    const monthlyBilled = active.filter(s => s.billing_cycle === 'monthly');
    if (monthlyBilled.length >= 2) {
      const potentialSave = monthlyBilled.reduce((sum, s) => sum + Number(s.amount) * 2, 0);
      opts.push({
        id: 'annual-switch',
        type: 'save',
        title: 'Switch to annual billing',
        desc: `${monthlyBilled.length} subscriptions could save ~${currencySymbol}${potentialSave.toFixed(0)}/yr if billed annually.`,
        value: `-${currencySymbol}${potentialSave.toFixed(0)}/yr`,
      });
    }

    // Duplicate detection (same category, similar price)
    const catGroups: Record<string, Subscription[]> = {};
    active.forEach(s => {
      catGroups[s.category] = catGroups[s.category] || [];
      catGroups[s.category].push(s);
    });
    Object.entries(catGroups).forEach(([cat, subs]) => {
      if (subs.length >= 2) {
        opts.push({
          id: `dup-${cat}`,
          type: 'warn',
          title: `Multiple ${cat} services`,
          desc: `You have ${subs.length} ${cat} subscriptions: ${subs.map(s => s.name).join(', ')}. Consider consolidating.`,
          value: `${subs.length} services`,
        });
      }
    });

    // Most expensive subscription
    if (topExpenses.length > 0 && topExpenses[0].monthlyAmount > monthlyTotal * 0.4) {
      const top = topExpenses[0];
      opts.push({
        id: 'top-heavy',
        type: 'info',
        title: `${top.name} dominates your spend`,
        desc: `${top.name} accounts for ${((top.monthlyAmount / monthlyTotal) * 100).toFixed(0)}% of your monthly spend. Check if a cheaper plan is available.`,
        value: `${((top.monthlyAmount / monthlyTotal) * 100).toFixed(0)}%`,
      });
    }

    return opts;
  }, [active, topExpenses, monthlyTotal, currencySymbol]);

  const maskAmount = (val: string) => hideAmounts ? '••••' : val;

  const allCategories = useMemo(() => {
    const cats = new Set(subscriptions.filter(s => s.status === 'active').map(s => s.category));
    return ['all', ...Array.from(cats)];
  }, [subscriptions]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active: isActive, payload, label }: any) => {
    if (isActive && payload && payload.length) {
      return (
        <div style={{
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '8px 12px', fontSize: '0.8125rem',
        }}>
          <div style={{ fontWeight: 600, marginBottom: 2 }}>{label}</div>
          <div style={{ color: '#fff', fontWeight: 700 }}>
            {currencySymbol}{maskAmount(payload[0].value.toFixed(2))}
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) return (
    <div>
      <div className="page-header"><h1 className="page-title">Analytics</h1></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 260, borderRadius: 12 }} />)}
      </div>
    </div>
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Understand and optimize your subscriptions</p>
        </div>
      </div>

      {/* ─── Filters ────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 4 }}>
          {(['30d', '3m', '1y'] as TimeRange[]).map(range => (
            <button
              key={range}
              className={`tab-btn ${timeRange === range ? 'active' : ''}`}
              onClick={() => setTimeRange(range)}
              style={{ padding: '6px 16px', fontSize: '0.8125rem', minWidth: 50 }}
            >
              {range === '30d' ? '30 Days' : range === '3m' ? '3 Months' : 'Year'}
            </button>
          ))}
        </div>

        <select
          className="form-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ width: 'auto', minWidth: 140, height: 36, fontSize: '0.8125rem' }}
        >
          {allCategories.map(c => (
            <option key={c} value={c}>
              {c === 'all' ? 'All Categories' : c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* ─── Key Metrics ────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="stat-card">
          <span className="stat-label">Monthly Total</span>
          <div className="stat-value">{currencySymbol}{maskAmount(monthlyTotal.toFixed(2))}</div>
        </div>
        <div className="stat-card">
          <span className="stat-label">Annual Projection</span>
          <div className="stat-value">{currencySymbol}{maskAmount((monthlyTotal * 12).toFixed(2))}</div>
          <div className="text-xs text-muted">estimated yearly spend</div>
        </div>
        <div className="stat-card">
          <span className="stat-label">Avg per Subscription</span>
          <div className="stat-value">
            {currencySymbol}{maskAmount(active.length > 0 ? (monthlyTotal / active.length).toFixed(2) : '0.00')}
          </div>
          <div className="text-xs text-muted">per month</div>
        </div>
      </div>

      {/* ─── Charts Row ─────────────────────────────── */}
      <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Spending Trend */}
        <div className="chart-card analytics-chart-full" style={{ gridColumn: '1 / -1' }}>
          <div className="chart-header">
            <h3>Spending Trend</h3>
            <span className="text-sm text-muted">
              {timeRange === '30d' ? 'Last 30 days' : timeRange === '3m' ? 'Last 3 months' : 'Last 12 months'}
            </span>
          </div>
          {monthlyData.length === 0 ? (
            <div className="empty-state" style={{ padding: '50px 0' }}>
              <p className="text-sm text-muted">No spending data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `${currencySymbol}${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="total" stroke="#ffffff" strokeWidth={2}
                  dot={{ fill: '#ffffff', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: '#ffffff' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Category Breakdown</h3>
            <span className="text-sm text-muted">Monthly</span>
          </div>
          {categoryData.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <p className="text-sm text-muted">No data yet</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    paddingAngle={2} dataKey="value">
                    {categoryData.map((entry, index) => (
                      <Cell key={index}
                        fill={CATEGORY_COLORS[entry.rawName] || '#555'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: unknown) => [`${currencySymbol}${(v as number).toFixed(2)}`, 'Monthly']} />
                </PieChart>
              </ResponsiveContainer>

              {/* Category Spend Summary */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: 10,
                marginTop: 20,
                paddingTop: 16,
                borderTop: '1px solid var(--border)'
              }}>
                {categoryData.map((cat) => (
                  <div key={cat.name} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    padding: '10px 14px',
                    background: 'var(--surface-2)',
                    borderRadius: 10,
                    border: '1px solid var(--border)'
                  }} className="category-item-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                        background: CATEGORY_COLORS[cat.rawName] || '#555',
                      }} />
                      <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{cat.name}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="text-base font-bold family-display">
                        {currencySymbol}{hideAmounts ? '••' : cat.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <div style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: 4,
                        color: 'var(--text-muted)',
                        fontWeight: 600
                      }}>
                        {monthlyTotal > 0 ? ((cat.value / monthlyTotal) * 100).toFixed(0) : 0}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Top Expenses */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Top Expenses</h3>
            <span className="text-sm text-muted">By monthly cost</span>
          </div>
          {topExpenses.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <p className="text-sm text-muted">No active subscriptions</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={topExpenses.map(s => ({
                  name: s.name.length > 10 ? s.name.slice(0, 10) + '…' : s.name,
                  amount: parseFloat(s.monthlyAmount.toFixed(2)),
                  color: s.color,
                }))}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `${currencySymbol}${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                  {topExpenses.map((s, i) => (
                    <Cell key={i} fill={s.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ─── Optimization Insights ────────────────── */}
      {optimizations.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div className="section-header">
            <h2 className="section-title">Optimization Insights</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {optimizations.map((opt) => (
              <div key={opt.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '16px 18px',
                background: 'var(--surface)',
                border: `1px solid ${opt.type === 'save' ? 'rgba(34,197,94,0.2)' : opt.type === 'warn' ? 'rgba(245,158,11,0.2)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem',
                  background: opt.type === 'save' ? 'var(--success-bg)' : opt.type === 'warn' ? 'rgba(245,158,11,0.1)' : 'var(--surface-2)',
                }}>
                  {opt.type === 'save' ? '💰' : opt.type === 'warn' ? '⚠️' : '💡'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 4 }}>{opt.title}</div>
                  <div className="text-sm text-muted" style={{ lineHeight: 1.5 }}>{opt.desc}</div>
                </div>
                <div style={{
                  fontSize: '0.8125rem', fontWeight: 700, flexShrink: 0,
                  color: opt.type === 'save' ? 'var(--success)' : opt.type === 'warn' ? '#f59e0b' : 'var(--text-secondary)',
                }}>
                  {opt.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
