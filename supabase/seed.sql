-- Habit Tracker — default/seed habits
-- Run after schema.sql and rls_policies.sql.
--
-- This defines seed_default_habits() as a Postgres function the client calls
-- via supabase.rpc('seed_default_habits') once, for the signed-in user. RLS
-- still applies normally since this runs as the calling user (no
-- SECURITY DEFINER) — auth.uid() must equal the user_id being inserted.
--
-- To make this safely re-runnable per user, add a uniqueness guard first
-- (Postgres has no "ADD CONSTRAINT IF NOT EXISTS", hence the guard below):
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'habits_user_display_code_unique'
  ) then
    alter table public.habits
      add constraint habits_user_display_code_unique unique (user_id, display_code);
  end if;
end $$;

create or replace function public.seed_default_habits()
returns void
language plpgsql
as $$
declare
  uid uuid := auth.uid();
  today date := current_date;
begin
  if uid is null then
    raise exception 'seed_default_habits() must be called by an authenticated user';
  end if;

  insert into public.habits
    (user_id, display_code, habit_name, frequency, category, time_of_day, start_date)
  values
    (uid, 'H001', 'Bangun Pagi', 'daily', 'Morning Routine', 'morning', today),
    (uid, 'H002', 'Household Routine', 'daily', 'Household', 'morning', today),
    (uid, 'H003', 'Pengecekan & Persiapan Aktivitas Hari Ini', 'daily', 'Planning', 'morning', today),
    (uid, 'H004', 'Workout', 'daily', 'Health', 'flexible', today),
    (uid, 'H005', 'Baca Buku', 'daily', 'Learning', 'flexible', today),
    (uid, 'H006', 'Carry Out Activities', 'daily', 'Activity', 'afternoon', today),
    (uid, 'H007', 'System Check', 'daily', 'System Management', 'night', today),
    (uid, 'H008', 'Household Routine', 'daily', 'Household', 'night', today),
    (uid, 'H009', 'Carry Out Activities', 'daily', 'Activity', 'night', today),
    (uid, 'H010', 'Refleksi Harian', 'daily', 'Reflection', 'night', today),
    (uid, 'H011', 'Perencanaan Besok', 'daily', 'Planning', 'night', today),
    (uid, 'H012', 'Lari/Renang', 'weekly', 'Health', 'flexible', today),
    (uid, 'H013', 'Deep Cleaning', 'weekly', 'Household', 'flexible', today),
    (uid, 'H014', 'Review Jurnal Trading', 'weekly', 'Finance', 'flexible', today),
    (uid, 'H015', 'Review Habit & Activity', 'weekly', 'Review', 'flexible', today),
    (uid, 'H016', 'Review Personal Finance', 'weekly', 'Finance', 'flexible', today),
    (uid, 'H017', 'Review Manajemen Kuliah', 'weekly', 'Education', 'flexible', today),
    (uid, 'H018', 'Review Skill Tracker', 'weekly', 'Learning', 'flexible', today),
    (uid, 'H019', 'Evaluasi Mingguan', 'weekly', 'Reflection', 'flexible', today),
    (uid, 'H020', 'Perencanaan Minggu Depan', 'weekly', 'Planning', 'flexible', today),
    (uid, 'H021', 'Review & Perencanaan Personal Finance', 'monthly', 'Finance', 'flexible', today),
    (uid, 'H022', 'Review & Perencanaan Habit & Activity', 'monthly', 'Review', 'flexible', today),
    (uid, 'H023', 'Review & Perencanaan Jurnal Trading', 'monthly', 'Finance', 'flexible', today),
    (uid, 'H024', 'Review & Perencanaan Manajemen Kuliah', 'monthly', 'Education', 'flexible', today),
    (uid, 'H025', 'Review & Perencanaan Skill Tracker', 'monthly', 'Learning', 'flexible', today),
    (uid, 'H026', 'Evaluasi Bulanan', 'monthly', 'Reflection', 'flexible', today),
    (uid, 'H027', 'Perencanaan Bulan Depan', 'monthly', 'Planning', 'flexible', today)
  on conflict (user_id, display_code) do nothing;
end;
$$;
