-- next-ai-armor · multi-tenant Supabase starter schema
-- Apply once via Supabase SQL editor. Idempotent.

-- Enable RLS-by-default on new tables (safety net).
alter default privileges in schema public revoke all on tables from public;

-- Users are managed by Better Auth / Supabase Auth — this table lives alongside.
-- Each row is one row per Stripe subscription. RLS ensures users only see their own.
create table if not exists public.subscriptions (
  user_id uuid primary key,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status text not null default 'inactive',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- Users can read their own subscription.
drop policy if exists "read_own_subscription" on public.subscriptions;
create policy "read_own_subscription"
  on public.subscriptions
  for select
  using (auth.uid() = user_id);

-- Only the service-role can insert/update. The Stripe webhook uses service-role.
-- No client should ever be able to write this table.
drop policy if exists "no_client_write_subscription" on public.subscriptions;
create policy "no_client_write_subscription"
  on public.subscriptions
  for all
  using (false)
  with check (false);

-- Example tenant-scoped table.
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null default 'untitled',
  created_at timestamptz not null default now()
);

alter table public.chats enable row level security;

drop policy if exists "own_chats" on public.chats;
create policy "own_chats"
  on public.chats
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists chats_user_id_created_at_idx on public.chats (user_id, created_at desc);
