import { Habit, HabitLog } from '@/types'
import { isHabitApplicable } from '@/utils/period'
import { todayISO } from '@/utils/date'

export interface DailyProgress {
  completed: number
  applicable: number
  percent: number
}

/** Today's progress across all daily habits applicable today. */
export function computeDailyProgress(habits: Habit[], logs: HabitLog[]): DailyProgress {
  const today = todayISO()
  const dailyHabits = habits.filter(
    (h) => h.frequency === 'daily' && isHabitApplicable(h, today),
  )
  const completed = dailyHabits.filter((h) =>
    logs.some((l) => l.habit_id === h.id && l.date === today && l.status === 'completed'),
  ).length
  return {
    completed,
    applicable: dailyHabits.length,
    percent: dailyHabits.length ? Math.round((completed / dailyHabits.length) * 100) : 0,
  }
}

/** Completion % for one daily habit across a set of applicable dates in a month. */
export function completionRateForHabit(
  habit: Habit,
  dates: string[],
  logs: HabitLog[],
): { completed: number; applicable: number; percent: number } {
  const applicableDates = dates.filter((d) => isHabitApplicable(habit, d) && d <= todayISO())
  const completed = applicableDates.filter((d) =>
    logs.some((l) => l.habit_id === habit.id && l.date === d && l.status === 'completed'),
  ).length
  return {
    completed,
    applicable: applicableDates.length,
    percent: applicableDates.length
      ? Math.round((completed / applicableDates.length) * 100)
      : 0,
  }
}

/**
 * Current and longest streak for a daily habit, given its full completion
 * history (dates it was completed on, sorted ascending) and the full set of
 * dates it was applicable on (also sorted ascending). A streak breaks on any
 * applicable date with no completion.
 */
export function computeStreaks(
  applicableDatesAsc: string[],
  completedDatesSet: Set<string>,
): { current: number; longest: number } {
  let longest = 0
  let running = 0
  let current = 0
  const today = todayISO()

  for (const date of applicableDatesAsc) {
    if (date > today) continue
    if (completedDatesSet.has(date)) {
      running += 1
      longest = Math.max(longest, running)
    } else {
      running = 0
    }
  }

  // Current streak = run ending at the most recent applicable date.
  for (let i = applicableDatesAsc.length - 1; i >= 0; i -= 1) {
    const date = applicableDatesAsc[i]
    if (date > today) continue
    if (completedDatesSet.has(date)) current += 1
    else break
  }

  return { current, longest }
}
