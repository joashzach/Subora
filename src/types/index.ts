export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  currency: string;
  timezone: string;
  theme_preference: 'light' | 'dark' | 'auto';
  accent_color?: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  name: string;
  logo_url?: string;
  category: SubscriptionCategory;
  amount: number;
  billing_cycle: 'monthly' | 'yearly' | 'weekly';
  next_billing_date: string;
  status: 'active' | 'cancelled' | 'paused';
  color: string;
  description?: string;
  website?: string;
  created_at: string;
}

export type SubscriptionCategory =
  | 'entertainment'
  | 'music'
  | 'productivity'
  | 'gaming'
  | 'fitness'
  | 'news'
  | 'shopping'
  | 'cloud'
  | 'education'
  | 'other';

export interface Transaction {
  id: string;
  user_id: string;
  subscription_id: string;
  amount: number;
  date: string;
  note?: string;
  subscription?: Subscription;
}

export interface Preferences {
  user_id: string;
  notification_settings: NotificationSettings;
  privacy_settings: PrivacySettings;
  layout_preferences: LayoutPreferences;
}

export interface NotificationSettings {
  renewal_reminders: boolean;
  budget_alerts: boolean;
  ai_insights: boolean;
  channels: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  reminder_days_before: number;
  budget_limit?: number;
}

export interface PrivacySettings {
  hide_amounts: boolean;
  disable_bank_integration: boolean;
}

export interface LayoutPreferences {
  view_mode: 'grid' | 'list';
  dashboard_layout: 'compact' | 'detailed';
}

export interface Session {
  id: string;
  user_id: string;
  device_info: string;
  last_active: string;
  is_current?: boolean;
}

export interface Insight {
  id: string;
  type: 'warning' | 'success' | 'info' | 'danger';
  title: string;
  description: string;
  value?: string;
  icon: string;
}

export interface BrandedService {
  name: string;
  color: string;
  bgColor: string;
  icon: string;
  category: SubscriptionCategory;
  defaultAmount?: number;
  billing_cycle?: 'monthly' | 'yearly';
  website?: string;
}
