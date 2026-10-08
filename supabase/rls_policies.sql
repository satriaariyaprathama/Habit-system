-- Habit Tracker — Row Level Security policies
-- Run after schema.sql. Every table is isolated so a user can only ever
-- see/change their own rows, enforced at the database layer (not just in app code).

alter table public.profiles enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.daily_reviews enable row level security;
alter table public.mood_logs enable row level security;
alter table public.sleep_logs enable row level security;
alter table public.weekly_reviews enable row level security;
alter table public.monthly_reviews enable row level security;

-- profiles: a user can read/update only their own profile row.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Generic per-table CRUD policy pattern: applied identically to every
-- user-data table below. auth.uid() = user_id gates every operation.
do $$
declare
  t text;
begin
  foreach t in array array[
    'habits', 'habit_logs', 'daily_reviews',
    'mood_logs', 'sleep_logs', 'weekly_reviews', 'monthly_reviews'
  ]
  loop
    execute format('drop policy if exists "%1$s_select_own" on public.%1$s;', t);
    execute format(
      'create policy "%1$s_select_own" on public.%1$s for select using (auth.uid() = user_id);',
      t
    );

    execute format('drop policy if exists "%1$s_insert_own" on public.%1$s;', t);
    execute format(
      'create policy "%1$s_insert_own" on public.%1$s for insert with check (auth.uid() = user_id);',
      t
    );

    execute format('drop policy if exists "%1$s_update_own" on public.%1$s;', t);
    execute format(
      'create policy "%1$s_update_own" on public.%1$s for update using (auth.uid() = user_id) with check (auth.uid() = user_id);',
      t
    );

    execute format('drop policy if exists "%1$s_delete_own" on public.%1$s;', t);
    execute format(
      'create policy "%1$s_delete_own" on public.%1$s for delete using (auth.uid() = user_id);',
      t
    );
  end loop;
end $$;

-- habit_logs also needs the referenced habit to belong to the same user —
-- otherwise a malicious insert could point habit_id at someone else's habit.
drop policy if exists "habit_logs_insert_own" on public.habit_logs;
create policy "habit_logs_insert_own" on public.habit_logs
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.habits h
      where h.id = habit_id and h.user_id = auth.uid()
    )
  );
