// Domain types. These mirror the Supabase schema in supabase/schema.sql exactly —
// keep the two in sync when the schema changes.

export type Frequency = 'daily' | 'weekly' | 'monthly'

export type TimeOfDay = 'morning' | 'afternoon' | 'night' | 'flexible'

// Category describes *function*, never time of day. Users can add their own via
// the habit form (category is a free-text column, not a hardcoded enum), so this
// list is only the seed/default set — never branch app logic on a category string.
export const DEFAULT_CATEGORIES = [
  'Household',
  'Health',
  'Learning',
  'Finance',
  'Education',
  'Planning',
  'Reflection',
  'Review',
  'System Management',
  'Activity',
  'Morning Routine',
] as const

export interface Habit {
  id: string
  user_id: string
  display_code: string | null // optional legacy code like "H001", cosmetic only
  order_index: number
  habit_name: string
  frequency: Frequency
  category: string
  time_of_day: TimeOfDay
  start_date: string // ISO date (YYYY-MM-DD), Asia/Jakarta calendar date
  end_date: string | null
  active: boolean
  archived: boolean
  created_at: string
  updated_at: string
}

export interface HabitSchedule {
  id: string
  user_id: string
  habit_id: string
  effective_from: string
  weekdays: number[]
  created_at: string
  updated_at: string
}

export type HabitStatus = 'completed' | 'missed' | 'pending'

export interface HabitLog {
  id: string
  user_id: string
  habit_id: string
  date: string // ISO date — the actual calendar date the action was logged on
  status: HabitStatus
  created_at: string
  updated_at: string
}

export interface DailyReview {
  id: string
  user_id: string
  date: string
  content: string
  created_at: string
  updated_at: string
}

export type Mood = 'happy' | 'good' | 'neutral' | 'tired' | 'stressed'

export const MOOD_META: Record<Mood, { label: string; emoji: string }> = {
  happy: { label: 'Happy', emoji: '😊' },
  good: { label: 'Good', emoji: '🙂' },
  neutral: { label: 'Neutral', emoji: '😐' },
  tired: { label: 'Tired', emoji: '😴' },
  stressed: { label: 'Stressed', emoji: '😣' },
}

export interface MoodLog {
  id: string
  user_id: string
  date: string
  mood: Mood
  note: string | null
  created_at: string
  updated_at: string
}

export interface SleepLog {
  id: string
  user_id: string
  date: string
  duration_minutes: number
  bedtime: string | null // "HH:mm"
  wake_time: string | null // "HH:mm"
  note: string | null
  created_at: string
  updated_at: string
}

export interface WeeklyReview {
  id: string
  user_id: string
  week_start: string // Saturday, ISO date
  week_end: string // Sunday, ISO date
  content: string
  created_at: string
  updated_at: string
}

export interface MonthlyReview {
  id: string
  user_id: string
  year: number
  month: number // 1-12
  content: string
  created_at: string
  updated_at: string
}

export interface HabitStats {
  habitId: string
  completionRate: number // 0-100, over the selected month
  currentStreak: number
  longestStreak: number
  completedCount: number
  missedCount: number
}



