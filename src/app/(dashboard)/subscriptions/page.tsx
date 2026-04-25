'use client';

import { useEffect, useState, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { getSubscriptions, deleteSubscription, updateSubscription } from '@/lib/db';
import { Subscription } from '@/types';
import { CATEGORY_COLORS, CURRENCY_SYMBOLS } from '@/lib/constants';
import { format, parseISO } from 'date-fns';
import AddSubscriptionModal from '@/components/subscriptions/AddSubscriptionModal';
import SubscriptionLogo from '@/components/subscriptions/SubscriptionLogo';

const CATEGORIES = ['all', 'entertainment', 'music', 'productivity', 'gaming', 'fitness', 'news', 'shopping', 'cloud', 'education', 'other'];

export default function SubscriptionsPage() {
  const { user, subscriptions, setSubscriptions, viewMode, setViewMode, hideAmounts } = useStore();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editSub, setEditSub] = useState<Subscription | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const currencySymbol = CURRENCY_SYMBOLS[user?.currency || 'INR'] || '₹';

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const subs = await getSubscriptions(user.id);
      setSubscriptions(subs);
    } catch (err) {
      console.error('Error loading subscriptions:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, setSubscriptions]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = subscriptions.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'all' || s.category === categoryFilter;
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  async function handleDelete(id: string) {
    if (!confirm('Delete this subscription?')) return;
    setDeletingId(id);
    await deleteSubscription(id);
    await loadData();
    setDeletingId(null);
  }

  async function handleToggleStatus(sub: Subscription) {
    const newStatus = sub.status === 'active' ? 'paused' : 'active';
    await updateSubscription(sub.id, { status: newStatus });
    await loadData();
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Subscriptions</h1>
          <p className="page-subtitle">{subscriptions.filter(s => s.status === 'active').length} active · {subscriptions.length} total</p>
        </div>
        <button className="btn btn-primary" id="btn-add-sub-page" onClick={() => setShowAddModal(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Subscription
        </button>
      </div>

      {/* Filters */}
      <div className="filter-bar" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div className="search-bar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            id="search-subscriptions"
            className="form-input"
            placeholder="Search subscriptions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          id="filter-category"
          className="form-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ width: 'auto', minWidth: 140 }}
        >
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c === 'all' ? 'All Categories' : c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>

        <select
          id="filter-status"
          className="form-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ width: 'auto', minWidth: 120 }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button
            id="btn-grid-view"
            className={`btn-icon ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid view"
            style={{ background: viewMode === 'grid' ? 'var(--surface-3)' : undefined }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
            </svg>
          </button>
          <button
            id="btn-list-view"
            className={`btn-icon ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List view"
            style={{ background: viewMode === 'list' ? 'var(--surface-3)' : undefined }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className={viewMode === 'grid' ? 'subs-grid' : 'subs-list'}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="skeleton" style={{ height: viewMode === 'grid' ? 180 : 72, borderRadius: 12 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <h3>No subscriptions found</h3>
          <p>{search ? 'Try a different search term' : 'Add your first subscription to get started'}</p>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ marginTop: 8 }}>
            Add Subscription
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="subs-grid">
          {filtered.map((sub) => (
            <SubCard
              key={sub.id}
              sub={sub}
              currencySymbol={currencySymbol}
              hideAmounts={hideAmounts}
              onEdit={() => setEditSub(sub)}
              onDelete={() => handleDelete(sub.id)}
              onToggle={() => handleToggleStatus(sub)}
              deleting={deletingId === sub.id}
            />
          ))}
        </div>
      ) : (
        <div className="subs-list">
          {filtered.map((sub) => (
            <SubListItem
              key={sub.id}
              sub={sub}
              currencySymbol={currencySymbol}
              hideAmounts={hideAmounts}
              onEdit={() => setEditSub(sub)}
              onDelete={() => handleDelete(sub.id)}
              onToggle={() => handleToggleStatus(sub)}
            />
          ))}
        </div>
      )}

      {showAddModal && (
        <AddSubscriptionModal
          onClose={() => setShowAddModal(false)}
          onAdded={() => { setShowAddModal(false); loadData(); }}
        />
      )}

      {editSub && (
        <AddSubscriptionModal
          initialData={editSub}
          onClose={() => setEditSub(null)}
          onAdded={() => { setEditSub(null); loadData(); }}
        />
      )}
    </>
  );
}

function SubCard({ sub, currencySymbol, hideAmounts, onEdit, onDelete, onToggle, deleting }: {
  sub: Subscription; currencySymbol: string; hideAmounts: boolean;
  onEdit: () => void; onDelete: () => void; onToggle: () => void; deleting: boolean;
}) {
  const monthlyAmount = sub.billing_cycle === 'monthly' ? sub.amount
    : sub.billing_cycle === 'yearly' ? sub.amount / 12
    : sub.amount * 4.33;

  return (
    <div className="sub-card" style={{ '--sub-color': sub.color } as React.CSSProperties}>
      <div className="sub-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <SubscriptionLogo
            name={sub.name}
            logoUrl={sub.logo_url}
            website={sub.website}
            color={sub.color}
            size={44}
            radius={10}
          />
          <div>
            <div className="sub-name">{sub.name}</div>
            <div className="sub-category" style={{ color: CATEGORY_COLORS[sub.category] }}>
              {sub.category}
            </div>
          </div>
        </div>
        <span className={`badge badge-${sub.status}`}>{sub.status}</span>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <div className="sub-amount" style={{ color: sub.color }}>
            {currencySymbol}{hideAmounts ? '••••' : Number(sub.amount).toFixed(2)}
          </div>
          <div className="sub-cycle">/{sub.billing_cycle}</div>
        </div>
        {sub.billing_cycle !== 'monthly' && (
          <div className="text-xs text-muted" style={{ marginTop: 2, fontFamily: 'var(--font-body)' }}>
            ≈ {currencySymbol}{hideAmounts ? '••••' : monthlyAmount.toFixed(2)}/mo
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="sub-renewal">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {format(parseISO(sub.next_billing_date), 'MMM d, yyyy')}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            className="btn-icon" onClick={onEdit} title="Edit"
            style={{ width: 28, height: 28 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button
            className="btn-icon" onClick={onToggle}
            title={sub.status === 'active' ? 'Pause' : 'Activate'}
            style={{ width: 28, height: 28 }}
          >
            {sub.status === 'active' ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            )}
          </button>
          <button
            className="btn-icon" onClick={onDelete} disabled={deleting}
            style={{ width: 28, height: 28, color: 'var(--danger)' }}
          >
            {deleting ? <span className="spinner" style={{ width: 12, height: 12 }} /> : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function SubListItem({ sub, currencySymbol, hideAmounts, onEdit, onDelete, onToggle }: {
  sub: Subscription; currencySymbol: string; hideAmounts: boolean;
  onEdit: () => void; onDelete: () => void; onToggle: () => void;
}) {
  return (
    <div className="sub-list-item">
      <SubscriptionLogo
        name={sub.name}
        logoUrl={sub.logo_url}
        website={sub.website}
        color={sub.color}
        size={40}
        radius={10}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.9375rem', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>{sub.name}</div>
        <div className="text-xs" style={{ color: CATEGORY_COLORS[sub.category], fontWeight: 600, marginTop: 2 }}>
          {sub.category}
          <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> · {format(parseISO(sub.next_billing_date), 'MMM d')}</span>
        </div>
      </div>
      <span className={`badge badge-${sub.status}`}>{sub.status}</span>
      <div style={{ fontWeight: 800, fontSize: '1rem', color: sub.color, minWidth: 80, textAlign: 'right', fontFamily: 'var(--font-display)' }}>
        {currencySymbol}{hideAmounts ? '••••' : Number(sub.amount).toFixed(2)}
        <div className="text-xs" style={{ fontWeight: 400, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>/{sub.billing_cycle}</div>
      </div>
      <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
        <button className="btn-icon" onClick={onEdit} style={{ width: 30, height: 30 }} title="Edit">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button className="btn-icon" onClick={onToggle} style={{ width: 30, height: 30 }} title={sub.status === 'active' ? 'Pause' : 'Activate'}>
          {sub.status === 'active' ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          )}
        </button>
        <button className="btn-icon" onClick={onDelete} style={{ width: 30, height: 30, color: 'var(--danger)' }} title="Delete">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
