-- Reputation & Feedback Intelligence Engine
-- Run this in the Supabase SQL Editor first.

-- Extensions
create extension if not exists "pgcrypto";

-- Enums
do $$ begin
  create type routing_status as enum (
    'ready_to_post',
    'private_queue',
    'escalated',
    'needs_review'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type alert_status as enum ('none', 'open', 'acted_on');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type confidence_level as enum ('high', 'low');
exception when duplicate_object then null;
end $$;

-- Tables
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  location_id uuid not null references public.locations (id) on delete restrict,
  job text,
  message text not null,
  sentiment_score integer not null check (sentiment_score between -100 and 100),
  severity_score integer not null check (severity_score between 0 and 100),
  sentiment_label text not null,
  reason text,
  confidence confidence_level not null default 'high',
  routing_status routing_status not null,
  is_repeat_negative boolean not null default false,
  ai_draft_response text,
  draft_sent boolean not null default false,
  alert_status alert_status not null default 'none',
  created_at timestamptz not null default now()
);

create index if not exists feedback_location_id_idx on public.feedback (location_id);
create index if not exists feedback_routing_status_idx on public.feedback (routing_status);
create index if not exists feedback_alert_status_idx on public.feedback (alert_status);
create index if not exists feedback_customer_id_idx on public.feedback (customer_id);
create index if not exists feedback_created_at_idx on public.feedback (created_at desc);

-- Row Level Security
alter table public.locations enable row level security;
alter table public.customers enable row level security;
alter table public.feedback enable row level security;

-- Authenticated staff can read locations & customers
drop policy if exists "Staff can read locations" on public.locations;
create policy "Staff can read locations"
  on public.locations for select
  to authenticated
  using (true);

drop policy if exists "Staff can read customers" on public.customers;
create policy "Staff can read customers"
  on public.customers for select
  to authenticated
  using (true);

-- Authenticated staff can select & update feedback (human actions only via UI)
drop policy if exists "Staff can read feedback" on public.feedback;
create policy "Staff can read feedback"
  on public.feedback for select
  to authenticated
  using (true);

drop policy if exists "Staff can update feedback" on public.feedback;
create policy "Staff can update feedback"
  on public.feedback for update
  to authenticated
  using (true)
  with check (true);

-- Inserts are intended for n8n via the service role key (bypasses RLS).
-- No insert policy for authenticated/anon — keeps the dashboard read/update only.

-- Realtime: enable in Dashboard → Database → Publications, or:
-- alter publication supabase_realtime add table public.feedback;
