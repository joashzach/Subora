import { supabase } from './supabase';
import { Subscription, Transaction } from '@/types';
import { subDays, format, parseISO, startOfMonth, endOfMonth } from 'date-fns';

// ─── Subscriptions ────────────────────────────────────────────────────────────

export async function getSubscriptions(userId: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message || 'Failed to perform operation');
  return data as Subscription[];
}

export async function addSubscription(sub: Omit<Subscription, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('subscriptions')
    .insert(sub)
    .select()
    .single();

  if (error) throw new Error(error.message || 'Failed to perform operation');
  // Auto-create a transaction for today
  await supabase.from('transactions').insert({
    user_id: sub.user_id,
    subscription_id: data.id,
    amount: sub.amount,
    date: format(new Date(), 'yyyy-MM-dd'),
    note: `First charge — ${sub.name}`,
  });

  return data as Subscription;
}

export async function updateSubscription(id: string, updates: Partial<Subscription>) {
  const { data, error } = await supabase
    .from('subscriptions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message || 'Failed to perform operation');
  return data as Subscription;
}

export async function deleteSubscription(id: string) {
  const { error } = await supabase.from('subscriptions').delete().eq('id', id);
  if (error) throw new Error(error.message || 'Failed to perform operation');
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function getTransactions(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, subscription:subscriptions(name, color, category)')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message || 'Failed to perform operation');
  return data as (Transaction & { subscription: Pick<Subscription, 'name' | 'color' | 'category'> })[];
}

export async function getMonthlySpend(userId: string, months = 6) {
  const results: { month: string; total: number }[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = subDays(new Date(), i * 30);
    const start = format(startOfMonth(d), 'yyyy-MM-dd');
    const end = format(endOfMonth(d), 'yyyy-MM-dd');

    const { data } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .gte('date', start)
      .lte('date', end);

    const total = (data || []).reduce((sum, t) => sum + Number(t.amount), 0);
    results.push({ month: format(d, 'MMM yyyy'), total });
  }

  return results;
}

// ─── Profiles ─────────────────────────────────────────────────────────────────

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw new Error(error.message || 'Failed to perform operation');
  return data;
}

export async function updateProfile(userId: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message || 'Failed to perform operation');
  return data;
}

// ─── Preferences ──────────────────────────────────────────────────────────────

export async function getPreferences(userId: string) {
  const { data, error } = await supabase
    .from('preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) throw new Error(error.message || 'Failed to perform operation');
  return data;
}

export async function updatePreferences(userId: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('preferences')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message || 'Failed to perform operation');
  return data;
}

// ─── Insights (rule-based from real data) ─────────────────────────────────────

export function computeInsights(
  subscriptions: Subscription[],
  transactions: Transaction[],
  currency: string
) {
  const insights = [];
  const active = subscriptions.filter((s) => s.status === 'active');
  const monthlyTotal = active.reduce((sum, s) => {
    if (s.billing_cycle === 'monthly') return sum + Number(s.amount);
    if (s.billing_cycle === 'yearly') return sum + Number(s.amount) / 12;
    if (s.billing_cycle === 'weekly') return sum + Number(s.amount) * 4.33;
    return sum;
  }, 0);

  // Month-over-month spend change
  const now = new Date();
  const thisMonthStart = format(startOfMonth(now), 'yyyy-MM-dd');
  const lastMonthStart = format(startOfMonth(subDays(now, 30)), 'yyyy-MM-dd');
  const lastMonthEnd = format(endOfMonth(subDays(now, 30)), 'yyyy-MM-dd');

  const thisMonthSpend = transactions
    .filter((t) => t.date >= thisMonthStart)
    .reduce((s, t) => s + Number(t.amount), 0);

  const lastMonthSpend = transactions
    .filter((t) => t.date >= lastMonthStart && t.date <= lastMonthEnd)
    .reduce((s, t) => s + Number(t.amount), 0);

  if (lastMonthSpend > 0) {
    const pct = ((thisMonthSpend - lastMonthSpend) / lastMonthSpend) * 100;
    if (pct > 5) {
      insights.push({
        id: 'mom-increase',
        type: 'warning',
        title: `Spending up ${Math.abs(pct).toFixed(0)}% this month`,
        description: `You've spent ${currency}${thisMonthSpend.toFixed(2)} vs ${currency}${lastMonthSpend.toFixed(2)} last month.`,
        value: `+${pct.toFixed(0)}%`,
        icon: '📈',
      });
    } else if (pct < -5) {
      insights.push({
        id: 'mom-decrease',
        type: 'success',
        title: `Spending down ${Math.abs(pct).toFixed(0)}% this month`,
        description: `Great job! You saved ${currency}${Math.abs(thisMonthSpend - lastMonthSpend).toFixed(2)} vs last month.`,
        value: `${pct.toFixed(0)}%`,
        icon: '📉',
      });
    }
  }

  // Unused subscriptions (paused or no recent transactions)
  const recentIds = new Set(
    transactions.filter((t) => t.date >= lastMonthStart).map((t) => t.subscription_id)
  );
  const unused = active.filter((s) => !recentIds.has(s.id));
  if (unused.length > 0) {
    const waste = unused.reduce((sum, s) => sum + Number(s.amount), 0);
    insights.push({
      id: 'unused',
      type: 'danger',
      title: `${unused.length} subscription${unused.length > 1 ? 's' : ''} not used recently`,
      description: `You could save ${currency}${waste.toFixed(2)}/mo by cancelling: ${unused.map((s) => s.name).join(', ')}.`,
      value: `-${currency}${waste.toFixed(2)}/mo`,
      icon: '💸',
    });
  }

  // Upcoming renewals in 7 days
  const in7Days = format(new Date(Date.now() + 7 * 86400000), 'yyyy-MM-dd');
  const upcoming = active.filter((s) => s.next_billing_date <= in7Days);
  if (upcoming.length > 0) {
    const total = upcoming.reduce((sum, s) => sum + Number(s.amount), 0);
    insights.push({
      id: 'upcoming-renewals',
      type: 'info',
      title: `${upcoming.length} renewal${upcoming.length > 1 ? 's' : ''} due this week`,
      description: `${upcoming.map((s) => s.name).join(', ')} — totalling ${currency}${total.toFixed(2)}.`,
      value: `${currency}${total.toFixed(2)}`,
      icon: '🔔',
    });
  }

  // Yearly savings opportunity
  const monthlyBilledSubs = active.filter((s) => s.billing_cycle === 'monthly');
  if (monthlyBilledSubs.length >= 2) {
    const potentialSavings = monthlyBilledSubs.reduce((sum, s) => sum + Number(s.amount) * 2, 0);
    insights.push({
      id: 'yearly-save',
      type: 'success',
      title: 'Switch to annual billing to save',
      description: `Switching major subscriptions to annual billing could save you ~${currency}${potentialSavings.toFixed(2)}/yr.`,
      value: `~${currency}${potentialSavings.toFixed(2)}/yr`,
      icon: '💡',
    });
  }

  // Top spending category
  const byCategory: Record<string, number> = {};
  active.forEach((s) => {
    const monthly =
      s.billing_cycle === 'monthly'
        ? s.amount
        : s.billing_cycle === 'yearly'
        ? s.amount / 12
        : s.amount * 4.33;
    byCategory[s.category] = (byCategory[s.category] || 0) + monthly;
  });
  const topCat = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
  if (topCat) {
    insights.push({
      id: 'top-category',
      type: 'info',
      title: `Most spent on ${topCat[0]}`,
      description: `${currency}${topCat[1].toFixed(2)}/mo goes to ${topCat[0]} subscriptions — ${((topCat[1] / monthlyTotal) * 100).toFixed(0)}% of your total.`,
      value: `${((topCat[1] / monthlyTotal) * 100).toFixed(0)}%`,
      icon: '🏆',
    });
  }

  return insights;
}
