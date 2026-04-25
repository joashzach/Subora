'use client';

import { useState } from 'react';
import { Subscription } from '@/types';
import { addSubscription } from '@/lib/db';
import { useStore } from '@/store/useStore';
import { BRANDED_SERVICES, CURRENCIES } from '@/lib/constants';
import { format, addMonths, addWeeks, addYears } from 'date-fns';

interface Props {
  onClose: () => void;
  onAdded: () => void;
  initialData?: Partial<Subscription>;
}

const CATEGORIES = ['entertainment', 'music', 'productivity', 'gaming', 'fitness', 'news', 'shopping', 'cloud', 'education', 'other'];

export default function AddSubscriptionModal({ onClose, onAdded, initialData }: Props) {
  const { user } = useStore();
  const currencyCode = user?.currency || 'INR';
  const currencySymbol = CURRENCIES.find(c => c.code === currencyCode)?.symbol || '$';

  const branded = Object.keys(BRANDED_SERVICES);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [name, setName] = useState(initialData?.name || '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [category, setCategory] = useState(initialData?.category || 'entertainment');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly' | 'weekly'>(initialData?.billing_cycle || 'monthly');
  const [nextBillingDate, setNextBillingDate] = useState(
    initialData?.next_billing_date || format(addMonths(new Date(), 1), 'yyyy-MM-dd')
  );
  const [color, setColor] = useState(initialData?.color || '#8b5cf6');
  const [description, setDescription] = useState(initialData?.description || '');
  const [status, setStatus] = useState<'active' | 'cancelled' | 'paused'>(initialData?.status || 'active');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function applyBrand(brandName: string) {
    const b = BRANDED_SERVICES[brandName];
    setSelectedBrand(brandName);
    setName(b.name);
    setCategory(b.category);
    setColor(b.color);
    if (b.defaultAmount) setAmount(b.defaultAmount.toString());
    if (b.billing_cycle) {
      setBillingCycle(b.billing_cycle);
      const cycle = b.billing_cycle as string;
      const next = cycle === 'yearly'
        ? format(addYears(new Date(), 1), 'yyyy-MM-dd')
        : cycle === 'weekly'
        ? format(addWeeks(new Date(), 1), 'yyyy-MM-dd')
        : format(addMonths(new Date(), 1), 'yyyy-MM-dd');
      setNextBillingDate(next);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) return;
    setError('');
    setLoading(true);
    try {
      await addSubscription({
        user_id: user.id,
        name,
        amount: parseFloat(amount),
        category: category as Subscription['category'],
        billing_cycle: billingCycle,
        next_billing_date: nextBillingDate,
        color,
        status,
        description,
        logo_url: undefined,
        website: BRANDED_SERVICES[name]?.website,
      });
      onAdded();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add subscription');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Add Subscription</h3>
          <button className="btn-icon" onClick={onClose} style={{ border: 'none', background: 'transparent' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Brand picker */}
          <div>
            <div className="form-label" style={{ marginBottom: 8 }}>Quick pick a service</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {branded.map((b) => {
                const svc = BRANDED_SERVICES[b];
                const faviconUrl = svc.website
                  ? `https://www.google.com/s2/favicons?sz=32&domain=${new URL(svc.website).hostname}`
                  : null;
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => applyBrand(b)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)',
                      background: selectedBrand === b ? `${svc.color}22` : 'var(--surface-2)',
                      color: selectedBrand === b ? svc.color : 'var(--text-secondary)',
                      fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer',
                      borderColor: selectedBrand === b ? svc.color : 'var(--border)',
                      transition: 'all 0.15s'
                    }}
                  >
                    {faviconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={faviconUrl}
                        alt={b}
                        width={14}
                        height={14}
                        style={{ borderRadius: 3, objectFit: 'contain' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : null}
                    {b}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div style={{
              background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8, padding: '8px 12px', fontSize: '0.8125rem', color: 'var(--danger)'
            }}>{error}</div>
          )}

          <form id="add-sub-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Service Name *</label>
                <input className="form-input" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Netflix" />
              </div>

              <div className="form-group">
                <label className="form-label">Amount ({currencySymbol}) *</label>
                <input className="form-input" type="number" min="0.01" step="0.01" value={amount}
                  onChange={e => setAmount(e.target.value)} required placeholder="9.99" />
              </div>

              <div className="form-group">
                <label className="form-label">Billing Cycle</label>
                <select className="form-select" value={billingCycle} onChange={e => setBillingCycle(e.target.value as 'monthly' | 'yearly' | 'weekly')}>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={category} onChange={e => setCategory(e.target.value as Subscription['category'])}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={status} onChange={e => setStatus(e.target.value as 'active' | 'cancelled' | 'paused')}>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Next Billing Date *</label>
                <input className="form-input" type="date" value={nextBillingDate}
                  onChange={e => setNextBillingDate(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Color</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="color" value={color} onChange={e => setColor(e.target.value)}
                    style={{ width: 42, height: 38, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'none' }} />
                  <span className="text-sm text-muted">{color}</span>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" type="submit" form="add-sub-form" disabled={loading} id="btn-confirm-add">
            {loading ? <span className="spinner" /> : 'Add Subscription'}
          </button>
        </div>
      </div>
    </div>
  );
}
