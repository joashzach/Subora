'use client';

import { useEffect, useState, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { getSubscriptions, getTransactions, getMonthlySpend, computeInsights } from '@/lib/db';
import { Subscription, Transaction } from '@/types';
import { CATEGORY_COLORS, CURRENCY_SYMBOLS } from '@/lib/constants';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export default function AnalyticsPage() {
  const { user, subscriptions, setSubscriptions, hideAmounts } = useStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; total: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const currencySymbol = CURRENCY_SYMBOLS[user?.currency || 'USD'] || '$';

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [subs, txns, monthly] = await Promise.all([
        getSubscriptions(user.id),
        getTransactions(user.id, 100),
        getMonthlySpend(user.id, 6),
      ]);
      setSubscriptions(subs);
      setTransactions(txns as Transaction[]);
      setMonthlyData(monthly);
    } catch (err) {
      console.error('Analytics load error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, setSubscriptions]);

  useEffect(() => { loadData(); }, [loadData]);

  const active = subscriptions.filter((s) => s.status === 'active');

  // Category breakdown
  const byCategory: Record<string, number> = {};
  active.forEach((s) => {
    const monthly = s.billing_cycle === 'monthly' ? Number(s.amount)
      : s.billing_cycle === 'yearly' ? Number(s.amount) / 12
      : Number(s.amount) * 4.33;
    byCategory[s.category] = (byCategory[s.category] || 0) + monthly;
  });
  const categoryData = Object.entries(byCategory)
    .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value: parseFloat(value.toFixed(2)) }))
    .sort((a, b) => b.value - a.value);

  // Billing cycle breakdown
  const cycleData = [
    { name: 'Monthly', value: active.filter(s => s.billing_cycle === 'monthly').length },
    { name: 'Yearly', value: active.filter(s => s.billing_cycle === 'yearly').length },
    { name: 'Weekly', value: active.filter(s => s.billing_cycle === 'weekly').length },
  ].filter(d => d.value > 0);

  const insights = computeInsights(subscriptions, transactions, currencySymbol);

  const monthlyTotal = active.reduce((sum, s) => {
    if (s.billing_cycle === 'monthly') return sum + Number(s.amount);
    if (s.billing_cycle === 'yearly') return sum + Number(s.amount) / 12;
    if (s.billing_cycle === 'weekly') return sum + Number(s.amount) * 4.33;
    return sum;
  }, 0);

  const maskAmount = (val: string) => hideAmounts ? '••••' : val;

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '10px 14px', fontSize: '0.8125rem'
        }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
          <div style={{ color: 'var(--accent)', fontWeight: 700 }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 300, borderRadius: 16 }} />)}
      </div>
    </div>
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Real-time insights from your subscription data</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="stat-icon">💵</div>
            <span className="stat-label">Monthly Total</span>
          </div>
          <div className="stat-value">{currencySymbol}{maskAmount(monthlyTotal.toFixed(2))}</div>
          <div className="text-xs text-muted">{currencySymbol}{maskAmount((monthlyTotal * 12).toFixed(2))} / year</div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="stat-icon">📊</div>
            <span className="stat-label">Avg per Sub</span>
          </div>
          <div className="stat-value">
            {currencySymbol}{maskAmount(active.length > 0 ? (monthlyTotal / active.length).toFixed(2) : '0.00')}
          </div>
          <div className="text-xs text-muted">per month</div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="stat-icon">🎯</div>
            <span className="stat-label">Top Category</span>
          </div>
          <div className="stat-value" style={{ fontSize: '1.25rem' }}>
            {categoryData[0]?.name || 'None'}
          </div>
          <div className="text-xs text-muted">
            {currencySymbol}{maskAmount((categoryData[0]?.value || 0).toFixed(2))}/mo
          </div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="stat-icon">📈</div>
            <span className="stat-label">Total Transactions</span>
          </div>
          <div className="stat-value">{transactions.length}</div>
          <div className="text-xs text-muted">tracked payments</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Monthly spend trend */}
        <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
          <div className="chart-header">
            <h3>Monthly Spend Trend</h3>
            <span className="text-sm text-muted">Last 6 months</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${currencySymbol}${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="total" stroke="var(--accent)" strokeWidth={2.5}
                dot={{ fill: 'var(--accent)', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: 'var(--accent)' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category donut */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Spend by Category</h3>
            <span className="text-sm text-muted">Monthly</span>
          </div>
          {categoryData.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <p className="text-sm">No data yet</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                    paddingAngle={3} dataKey="value">
                    {categoryData.map((entry, index) => (
                      <Cell key={index}
                        fill={CATEGORY_COLORS[entry.name.toLowerCase()] || '#8b5cf6'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: unknown) => [`${currencySymbol}${(v as number).toFixed(2)}`, 'Monthly']} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {categoryData.slice(0, 5).map((cat) => (
                  <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, flexShrink: 0,
                      background: CATEGORY_COLORS[cat.name.toLowerCase()] || '#8b5cf6' }} />
                    <span className="text-sm" style={{ flex: 1 }}>{cat.name}</span>
                    <span className="text-sm font-semibold">
                      {currencySymbol}{hideAmounts ? '••' : cat.value.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Bar chart by service */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Top Subscriptions</h3>
            <span className="text-sm text-muted">By monthly cost</span>
          </div>
          {active.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <p className="text-sm">No active subscriptions</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={active
                  .map(s => ({
                    name: s.name.length > 10 ? s.name.slice(0, 10) + '…' : s.name,
                    amount: parseFloat((s.billing_cycle === 'monthly' ? s.amount
                      : s.billing_cycle === 'yearly' ? Number(s.amount) / 12
                      : Number(s.amount) * 4.33).toFixed(2)),
                    color: s.color,
                  }))
                  .sort((a, b) => b.amount - a.amount)
                  .slice(0, 8)}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `${currencySymbol}${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {active.slice(0, 8).map((s, i) => (
                    <Cell key={i} fill={s.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div>
          <div className="section-header">
            <h2 className="section-title">💡 Smart Insights</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {insights.map((ins) => (
              <div key={ins.id} className={`insight-card insight-${ins.type}`}>
                <div className="insight-icon">{ins.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="insight-title">{ins.title}</div>
                  <div className="insight-desc">{ins.description}</div>
                </div>
                {ins.value && <span className="insight-value">{ins.value}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
