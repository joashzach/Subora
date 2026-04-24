'use client';

import { useEffect, useState, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { getSubscriptions, deleteSubscription, updateSubscription } from '@/lib/db';
import { Subscription } from '@/types';
import { BRANDED_SERVICES, CATEGORY_COLORS, CURRENCY_SYMBOLS } from '@/lib/constants';
import { format, parseISO } from 'date-fns';
import AddSubscriptionModal from '@/components/subscriptions/AddSubscriptionModal';

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

  const currencySymbol = CURRENCY_SYMBOLS[user?.currency || 'USD'] || '$';

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    const subs = await getSubscriptions(user.id);
    setSubscriptions(subs);
    setLoading(false);
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
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
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
  const icon = BRANDED_SERVICES[sub.name]?.icon || '📦';
  const monthlyAmount = sub.billing_cycle === 'monthly' ? sub.amount
    : sub.billing_cycle === 'yearly' ? sub.amount / 12
    : sub.amount * 4.33;

  return (
    <div className="sub-card" style={{ '--sub-color': sub.color } as React.CSSProperties}>
      <div className="sub-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="sub-logo" style={{ background: `${sub.color}22` }}>{icon}</div>
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
        <div className="sub-amount" style={{ color: sub.color }}>
          {currencySymbol}{hideAmounts ? '••••' : Number(sub.amount).toFixed(2)}
        </div>
        <div className="sub-cycle">/{sub.billing_cycle}</div>
        {sub.billing_cycle !== 'monthly' && (
          <div className="text-xs text-muted" style={{ marginTop: 2 }}>
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
          <button className="btn-icon" onClick={onEdit} title="Edit" style={{ width: 28, height: 28, fontSize: '0.7rem' }}>✏️</button>
          <button className="btn-icon" onClick={onToggle} title={sub.status === 'active' ? 'Pause' : 'Activate'}
            style={{ width: 28, height: 28, fontSize: '0.7rem' }}>
            {sub.status === 'active' ? '⏸️' : '▶️'}
          </button>
          <button className="btn-icon" onClick={onDelete} disabled={deleting}
            style={{ width: 28, height: 28, fontSize: '0.7rem', color: 'var(--danger)' }}>
            {deleting ? <span className="spinner" style={{ width: 12, height: 12 }} /> : '🗑️'}
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
  const icon = BRANDED_SERVICES[sub.name]?.icon || '📦';
  return (
    <div className="sub-list-item">
      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${sub.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="font-semibold">{sub.name}</div>
        <div className="text-xs text-muted">{sub.category} · {format(parseISO(sub.next_billing_date), 'MMM d')}</div>
      </div>
      <span className={`badge badge-${sub.status}`}>{sub.status}</span>
      <div style={{ fontWeight: 800, fontSize: '1rem', color: sub.color, minWidth: 80, textAlign: 'right' }}>
        {currencySymbol}{hideAmounts ? '••••' : Number(sub.amount).toFixed(2)}
        <div className="text-xs text-muted" style={{ fontWeight: 400 }}>/{sub.billing_cycle}</div>
      </div>
      <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
        <button className="btn-icon" onClick={onEdit} style={{ width: 30, height: 30, fontSize: '0.7rem' }}>✏️</button>
        <button className="btn-icon" onClick={onToggle} style={{ width: 30, height: 30, fontSize: '0.7rem' }}>
          {sub.status === 'active' ? '⏸️' : '▶️'}
        </button>
        <button className="btn-icon" onClick={onDelete} style={{ width: 30, height: 30, fontSize: '0.7rem', color: 'var(--danger)' }}>🗑️</button>
      </div>
    </div>
  );
}
