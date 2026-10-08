-- Habit Tracker — Supabase schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) before rls_policies.sql.
-- Requires the pgcrypto extension for gen_random_uuid() — enabled by default on Supabase.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles: one row per authenticated user, created automatically on sign-up.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- habits: master data. Habit IDs are UUIDs; display_code (H001, H002, ...) is
-- a cosmetic, optional label only — nothing in the app branches on it.
-- ---------------------------------------------------------------------------
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  display_code text,
  habit_name text not null,
  frequency text not null check (frequency in ('daily', 'weekly', 'monthly')),
  category text not null,
  time_of_day text not null check (time_of_day in ('morning', 'afternoon', 'night', 'flexible')),
  start_date date not null,
  end_date date,
  active boolean not null default true,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint habits_date_range check (end_date is null or end_date >= start_date)
);

create index if not exists idx_habits_user on public.habits (user_id);
create index if not exists idx_habits_user_active on public.habits (user_id, active, archived);

-- ---------------------------------------------------------------------------
-- habit_logs: one row per (user, habit, date) attendance record. This is the
-- single log table for daily/weekly/monthly habits alike — weekly habits log
-- against their actual Saturday/Sunday completion date, monthly habits log
-- against whatever date in the month they were done. "Missed" is never
-- written here; it's derived at read time so historical rows are never
-- rewritten by the passage of time.
-- ---------------------------------------------------------------------------
create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  habit_id uuid not null references public.habits (id) on delete cascade,
  date date not null,
  status text not null default 'completed' check (status in ('completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, habit_id, date)
);

create index if not exists idx_habit_logs_user_date on public.habit_logs (user_id, date);
create index if not exists idx_habit_logs_habit on public.habit_logs (habit_id);

-- ---------------------------------------------------------------------------
-- daily_reviews: one whole-day note per date, not per habit.
-- ---------------------------------------------------------------------------
create table if not exists public.daily_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

create index if not exists idx_daily_reviews_user_date on public.daily_reviews (user_id, date);

-- ---------------------------------------------------------------------------
-- mood_logs: optional, one per date.
-- ---------------------------------------------------------------------------
create table if not exists public.mood_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  mood text not null check (mood in ('happy', 'good', 'neutral', 'tired', 'stressed')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

create index if not exists idx_mood_logs_user_date on public.mood_logs (user_id, date);

-- ---------------------------------------------------------------------------
-- sleep_logs: one per date.
-- ---------------------------------------------------------------------------
create table if not exists public.sleep_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  duration_minutes integer not null check (duration_minutes >= 0 and duration_minutes <= 1440),
  bedtime time,
  wake_time time,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

create index if not exists idx_sleep_logs_user_date on public.sleep_logs (user_id, date);

-- ---------------------------------------------------------------------------
-- weekly_reviews: one per Saturday-Sunday period.
-- ---------------------------------------------------------------------------
create table if not exists public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start date not null, -- Saturday
  week_end date not null,   -- Sunday
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);

create index if not exists idx_weekly_reviews_user on public.weekly_reviews (user_id, week_start);

-- ---------------------------------------------------------------------------
-- monthly_reviews: one per calendar month.
-- ---------------------------------------------------------------------------
create table if not exists public.monthly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  year integer not null,
  month integer not null check (month between 1 and 12),
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, year, month)
);

create index if not exists idx_monthly_reviews_user on public.monthly_reviews (user_id, year, month);

-- ---------------------------------------------------------------------------
-- updated_at triggers — keep every table's updated_at current on UPDATE.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'habits', 'habit_logs', 'daily_reviews',
    'mood_logs', 'sleep_logs', 'weekly_reviews', 'monthly_reviews'
  ]
  loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I;
       create trigger set_updated_at before update on public.%I
       for each row execute function public.set_updated_at();',
      t, t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Auto-create a profiles row when a new auth user signs up (e.g. via Google).
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
