-- Habit ordering
-- Run this once in the Supabase SQL Editor.

alter table public.habits
  add column if not exists order_index integer;

-- Preserve the current habit order as the initial order.
with ranked as (
  select
    id,
    row_number() over (
      partition by user_id
      order by created_at asc, id asc
    ) - 1 as new_order
  from public.habits
)
update public.habits h
set order_index = ranked.new_order
from ranked
where h.id = ranked.id;

alter table public.habits
  alter column order_index set default 0;

alter table public.habits
  alter column order_index set not null;

create index if not exists idx_habits_user_order
  on public.habits (user_id, order_index);

-- Automatically place newly inserted habits at the end
-- when order_index is omitted/defaulted to 0.
create or replace function public.set_habit_order_index()
returns trigger
language plpgsql
as $$
begin
  if new.order_index = 0 then
    select coalesce(max(order_index), -1) + 1
    into new.order_index
    from public.habits
    where user_id = new.user_id;
  end if;

  return new;
end;
$$;

drop trigger if exists set_habit_order_index on public.habits;

create trigger set_habit_order_index
before insert on public.habits
for each row
execute function public.set_habit_order_index();
