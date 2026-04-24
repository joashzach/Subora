'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Subscription, Transaction, Preferences } from '@/types';

interface AppState {
  // Auth
  user: User | null;
  setUser: (user: User | null) => void;

  // Subscriptions
  subscriptions: Subscription[];
  setSubscriptions: (subs: Subscription[]) => void;
  addSubscription: (sub: Subscription) => void;
  updateSubscription: (id: string, updates: Partial<Subscription>) => void;
  removeSubscription: (id: string) => void;

  // Transactions
  transactions: Transaction[];
  setTransactions: (txns: Transaction[]) => void;

  // Preferences
  preferences: Preferences | null;
  setPreferences: (prefs: Preferences) => void;

  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  theme: 'light' | 'dark' | 'auto';
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
  hideAmounts: boolean;
  setHideAmounts: (hide: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),

      subscriptions: [],
      setSubscriptions: (subscriptions) => set({ subscriptions }),
      addSubscription: (sub) =>
        set((state) => ({ subscriptions: [sub, ...state.subscriptions] })),
      updateSubscription: (id, updates) =>
        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),
      removeSubscription: (id) =>
        set((state) => ({
          subscriptions: state.subscriptions.filter((s) => s.id !== id),
        })),

      transactions: [],
      setTransactions: (transactions) => set({ transactions }),

      preferences: null,
      setPreferences: (preferences) => set({ preferences }),

      sidebarOpen: false,
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      viewMode: 'grid',
      setViewMode: (viewMode) => set({ viewMode }),
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      accentColor: '#10b981',
      setAccentColor: (accentColor) => set({ accentColor }),
      hideAmounts: false,
      setHideAmounts: (hideAmounts) => set({ hideAmounts }),
    }),
    {
      name: 'subora-store',
      partialize: (state) => ({
        theme: state.theme,
        accentColor: state.accentColor,
        viewMode: state.viewMode,
        hideAmounts: state.hideAmounts,
      }),
    }
  )
);
