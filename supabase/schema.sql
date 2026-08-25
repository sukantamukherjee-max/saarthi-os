-- Personal Wealth OS — database schema
-- Run this once in Supabase: SQL Editor → New query → paste this whole file → Run

create extension if not exists pgcrypto;

create table if not exists assumptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  asset_class text not null,
  ticker text,
  quantity_label text,
  invested_omr numeric not null default 0,
  current_value_omr numeric not null default 0,
  price_source text not null default 'manual', -- 'manual' | 'live'
  last_priced_at timestamptz,
  recommendation text,
  confidence text,
  note text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  filename text not null,
  storage_path text,
  status text not null default 'pending', -- pending | parsed | needs_review | merged
  parsed_json jsonb,
  created_at timestamptz not null default now()
);

-- Shared market-data caches, written only by Netlify Functions (service role
-- bypasses RLS), read-only for signed-in users so the browser never needs
-- direct third-party API keys.
create table if not exists price_cache (
  symbol text primary key,
  source text not null,
  price numeric not null,
  currency text not null,
  fetched_at timestamptz not null default now()
);

create table if not exists fx_cache (
  pair text primary key, -- e.g. 'OMR_INR'
  rate numeric not null,
  fetched_at timestamptz not null default now()
);

alter table assumptions enable row level security;
alter table holdings enable row level security;
alter table uploads enable row level security;
alter table price_cache enable row level security;
alter table fx_cache enable row level security;

drop policy if exists "own assumptions" on assumptions;
create policy "own assumptions" on assumptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own holdings" on holdings;
create policy "own holdings" on holdings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own uploads" on uploads;
create policy "own uploads" on uploads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "read prices" on price_cache;
create policy "read prices" on price_cache for select using (auth.role() = 'authenticated');

drop policy if exists "read fx" on fx_cache;
create policy "read fx" on fx_cache for select using (auth.role() = 'authenticated');

-- Storage bucket for uploaded statements/screenshots, private, one folder per user.
insert into storage.buckets (id, name, public)
  values ('statements', 'statements', false)
  on conflict (id) do nothing;

drop policy if exists "own statement files" on storage.objects;
create policy "own statement files" on storage.objects
  for all using (bucket_id = 'statements' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'statements' and (storage.foldername(name))[1] = auth.uid()::text);
