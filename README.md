# Habit Tracker

A habit-tracking web app — separate in purpose from an activity/task manager —
built to help you see how consistent you actually are with daily, weekly, and
monthly routines, and to keep that history permanently as months and years
change.

Stack: React + TypeScript + Vite + Tailwind CSS + Supabase (Postgres, Auth,
Row Level Security) + Recharts.

## 1. Project structure

```
habit-tracker/
├─ src/
│  ├─ main.tsx, App.tsx, index.css        # entry point, auth gate, tab nav
│  ├─ lib/supabase.ts                     # Supabase client
│  ├─ types/index.ts                      # domain types (mirrors the SQL schema)
│  ├─ utils/
│  │  ├─ date.ts                          # Asia/Jakarta date helpers, week/month periods
│  │  ├─ period.ts                        # applicability + completed/missed/pending logic
│  │  └─ stats.ts                         # completion rate & streak calculations
│  ├─ context/
│  │  ├─ AuthContext.tsx                  # Supabase Auth (Google OAuth) session
│  │  ├─ DateContext.tsx                  # the global month/year the dashboard shows
│  │  └─ ToastContext.tsx                 # lightweight toast notifications
│  ├─ hooks/                              # one hook per table, all Supabase-backed
│  │  ├─ useHabits.ts                     # CRUD + activate/deactivate/archive/delete
│  │  ├─ useHabitLogs.ts                  # per-month attendance, toggle = upsert/delete
│  │  ├─ useHabitHistory.ts               # full history for one habit (detail view)
│  │  ├─ useDailyReview.ts / useMood.ts / useSleep.ts
│  │  └─ useWeeklyReview.ts / useMonthlyReview.ts
│  └─ components/
│     ├─ Layout/                          # Header, MonthYearSelector
│     ├─ Auth/Login.tsx
│     ├─ ui/                              # Card, Checkbox, ProgressBar, Modal, Form
│     ├─ Dashboard/                       # Dashboard.tsx composes everything below it
│     │  ├─ SummaryCards.tsx              # today / weekly / monthly / overall progress
│     │  ├─ DailyHabits.tsx               # habit × day-of-month checkbox grid
│     │  ├─ WeeklyHabits.tsx              # habit × Saturday/Sunday period grid
│     │  ├─ MonthlyHabits.tsx             # one checkbox per habit per month
│     │  ├─ DailyReview.tsx / MoodTracker.tsx / SleepTracker.tsx
│     │  ├─ WeeklyReview.tsx / MonthlyReview.tsx
│     │  └─ Charts.tsx                    # sleep trend, weekly consistency
│     └─ Habits/
│        ├─ HabitsPage.tsx
│        ├─ HabitManager.tsx              # add/edit/deactivate/archive/delete
│        └─ HabitDetail.tsx               # streaks, completion rate, monthly trend
├─ supabase/
│  ├─ schema.sql                          # tables, constraints, indexes, triggers
│  ├─ rls_policies.sql                    # per-user Row Level Security
│  └─ seed.sql                            # the 27 default habits, as a callable RPC
├─ .env.example
└─ package.json
```

## 2. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. In **Authentication → Providers**, enable **Google** and fill in your
   Google OAuth client ID/secret (from the Google Cloud Console — set the
   authorized redirect URI to the one Supabase shows you on that page).
3. In **Authentication → URL Configuration**, add your local dev URL
   (`http://localhost:5173`) and your production URL to the allowed redirect
   list.
4. Open the **SQL Editor** and run, in order:
   1. `supabase/schema.sql`
   2. `supabase/rls_policies.sql`
   3. `supabase/seed.sql`
5. In **Project Settings → API**, copy the **Project URL** and **anon public
   key**.

## 3. Environment variables

```bash
cp .env.example .env.local
```

Fill in:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-SUPABASE-ANON-PUBLIC-KEY
```

Never commit `.env.local` — it's already in `.gitignore`. The anon key is
safe to ship to the browser; Row Level Security is what actually protects
each user's data (see `supabase/rls_policies.sql`).

## 4. Run instructions

```bash
npm install
npm run dev       # http://localhost:5173
```

Sign in with Google. On first login you'll land on an empty dashboard — go to
**Manage Habits → Load the 27 starter habits** to seed the default set from
your old Google Sheets tracker, or add your own from scratch with **Add
Habit**.

```bash
npm run build      # type-checks and produces a production build in dist/
npm run preview    # serve the production build locally
```

## 5. Migration from Google Sheets

The old spreadsheet's sheets map onto tables like this:

| Google Sheets tab   | Supabase table    |
|----------------------|--------------------|
| Habits Master         | `habits`           |
| Habits Log             | `habit_logs`       |
| Daily Review Log       | `daily_reviews`    |
| Mood Log               | `mood_logs`        |
| Sleep Log               | `sleep_logs`       |
| Weekly Review Log      | `weekly_reviews`   |
| Monthly Review Log     | `monthly_reviews`  |

To bring over existing history:

1. Export each sheet to CSV.
2. In Supabase, use **Table Editor → Insert → Import data from CSV**, or write
   a one-off script with `@supabase/supabase-js` that reads each CSV and
   calls `.insert()` in batches. Map each spreadsheet row to the matching
   table's columns (see `supabase/schema.sql` for exact column names/types).
3. Make sure every imported row's `user_id` is set to your own Supabase Auth
   user id (find it in **Authentication → Users** after your first Google
   sign-in) — RLS will otherwise silently reject rows with the wrong
   `user_id`.
4. Re-run `habit_logs` last, once every habit from `Habits Master` already
   exists in `habits` (it references `habit_id`).

There's no automated importer built in yet — see §27/§29 of the original
spec for how this is meant to evolve (CSV export/import, direct Sheets
import) as a future addition; the schema and RLS policies are already shaped
to support it.

## 6. Design & implementation notes

- **Timezone**: every date shown or written by the app is computed in
  `Asia/Jakarta` (see `src/utils/date.ts`), not the browser's local timezone
  or bare UTC, so a checkbox ticked at 23:30 WIB stays on that day and one
  ticked at 00:10 WIB lands on the next.
- **No hardcoded habits**: nothing in the app branches on a habit's name or
  ID (see `src/utils/period.ts`). All daily/weekly/monthly logic, and
  completed/missed/pending resolution, comes from `frequency`, `category`,
  `time_of_day`, `active`, `start_date`, and `end_date` — so you can add a
  new habit from the UI without touching code.
- **Deactivate/archive vs. delete**: deactivating or archiving a habit only
  changes its `active`/`archived` flags — its `habit_logs` history is
  untouched and still shows up in that habit's detail view and in past
  months. Only the explicit, confirmed **Delete** action removes a habit's
  history (via `ON DELETE CASCADE`).
- **No duplicate records**: every log-like table has a `unique` constraint
  (`(user_id, habit_id, date)` for `habit_logs`; `(user_id, date)` for daily
  reviews/mood/sleep; `(user_id, week_start)` for weekly reviews;
  `(user_id, year, month)` for monthly reviews) and every write path uses
  `upsert(..., { onConflict: ... })`, so editing something already saved
  updates it in place instead of inserting a new row.
- **Performance**: `useHabitLogs` only loads the currently displayed month's
  rows, not the user's entire history; `useHabitHistory` (used by the habit
  detail view) is scoped to a single `habit_id`, which is indexed.
- **Missed status is derived, not stored**: `habit_logs` only ever contains
  `completed` rows. Whether a given day/period/month reads as "missed" or
  "pending" is computed at read time in `src/utils/period.ts`, so past
  records are never rewritten and nothing needs to run on a schedule.
