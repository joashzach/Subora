-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- PROFILES (extends auth.users)
-- ─────────────────────────────────────────────
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  name text,
  avatar_url text,
  currency text not null default 'USD',
  timezone text not null default 'UTC',
  theme_preference text not null default 'dark',
  accent_color text default '#8b5cf6',
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────
-- SUBSCRIPTIONS
-- ─────────────────────────────────────────────
create table public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  logo_url text,
  category text not null default 'other',
  amount numeric(10,2) not null,
  billing_cycle text not null default 'monthly',
  next_billing_date date not null,
  status text not null default 'active',
  color text default '#8b5cf6',
  description text,
  website text,
  created_at timestamptz default now()
);

create index subscriptions_user_id_idx on public.subscriptions(user_id);
create index subscriptions_status_idx on public.subscriptions(status);

-- ─────────────────────────────────────────────
-- TRANSACTIONS
-- ─────────────────────────────────────────────
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  amount numeric(10,2) not null,
  date date not null default current_date,
  note text,
  created_at timestamptz default now()
);

create index transactions_user_id_idx on public.transactions(user_id);

-- ─────────────────────────────────────────────
-- PREFERENCES
-- ─────────────────────────────────────────────
create table public.preferences (
  user_id uuid references auth.users(id) on delete cascade primary key,
  notification_settings jsonb default '{
    "renewal_reminders": true,
    "budget_alerts": true,
    "ai_insights": true,
    "channels": {"email": true, "push": false, "sms": false},
    "reminder_days_before": 3
  }'::jsonb,
  privacy_settings jsonb default '{
    "hide_amounts": false,
    "disable_bank_integration": false
  }'::jsonb,
  layout_preferences jsonb default '{
    "view_mode": "grid",
    "dashboard_layout": "detailed"
  }'::jsonb,
  updated_at timestamptz default now()
);

-- Auto-create preferences on signup
create or replace function public.handle_new_user_prefs()
returns trigger as $$
begin
  insert into public.preferences (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created_prefs
  after insert on auth.users
  for each row execute procedure public.handle_new_user_prefs();

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.transactions enable row level security;
alter table public.preferences enable row level security;

-- Profiles
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Subscriptions
create policy "Users can CRUD own subscriptions" on public.subscriptions for all using (auth.uid() = user_id);

-- Transactions
create policy "Users can CRUD own transactions" on public.transactions for all using (auth.uid() = user_id);

-- Preferences
create policy "Users can CRUD own preferences" on public.preferences for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- STORAGE BUCKET FOR AVATARS
-- ─────────────────────────────────────────────
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

create policy "Avatar upload" on storage.objects for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Avatar read" on storage.objects for select using (bucket_id = 'avatars');
create policy "Avatar update" on storage.objects for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Avatar delete" on storage.objects for delete using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
