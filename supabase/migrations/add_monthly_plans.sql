create table if not exists public.monthly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  year integer not null,
  month integer not null check (month between 1 and 12),
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, year, month)
);

create index if not exists idx_monthly_plans_user
on public.monthly_plans (user_id, year, month);

alter table public.monthly_plans enable row level security;

drop policy if exists "monthly_plans_select_own"
on public.monthly_plans;

create policy "monthly_plans_select_own"
on public.monthly_plans
for select
using (auth.uid() = user_id);

drop policy if exists "monthly_plans_insert_own"
on public.monthly_plans;

create policy "monthly_plans_insert_own"
on public.monthly_plans
for insert
with check (auth.uid() = user_id);

drop policy if exists "monthly_plans_update_own"
on public.monthly_plans;

create policy "monthly_plans_update_own"
on public.monthly_plans
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "monthly_plans_delete_own"
on public.monthly_plans;

create policy "monthly_plans_delete_own"
on public.monthly_plans
for delete
using (auth.uid() = user_id);

drop trigger if exists set_updated_at on public.monthly_plans;

create trigger set_updated_at
before update on public.monthly_plans
for each row
execute function public.set_updated_at();