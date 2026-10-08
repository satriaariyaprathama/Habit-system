import { Habit, HabitLog, HabitSchedule, HabitStatus } from '@/types'
import { isPastDate, todayISO, weekendPeriodFor } from '@/utils/date'

/** Whether a habit was in effect (active, within its date range) on a given date. */
export function isHabitApplicable(habit: Habit, dateISO: string): boolean {
  if (habit.archived) return false
  if (!habit.active) return false
  if (dateISO < habit.start_date) return false
  if (habit.end_date && dateISO > habit.end_date) return false
  return true
}

/**
 * Resolve the display status for one daily habit on one date, from whatever
 * log rows exist. Never mutates or deletes an existing log — "missed"
 * derived at read time, only written once the period (that date) is over.
 */
export function resolveDailyStatus(
  habit: Habit,
  dateISO: string,
  logsForDate: HabitLog[],
): HabitStatus {
  if (!isHabitApplicable(habit, dateISO)) return 'pending'
  const log = logsForDate.find((l) => l.habit_id === habit.id)
  if (log && log.status === 'completed') return 'completed'
  if (dateISO < todayISO()) return 'missed' // period over, no completion recorded
  return 'pending'
}

/**
 * Resolve status for a weekly habit across its Saturday+Sunday period: done if
 * completed on either day, missed once Sunday has passed with nothing logged.
 */
export function resolveWeeklyStatus(
  habit: Habit,
  periodStart: string,
  periodEnd: string,
  logsInPeriod: HabitLog[],
): HabitStatus {
  const applicable =
    isHabitApplicable(habit, periodStart) || isHabitApplicable(habit, periodEnd)
  if (!applicable) return 'pending'
  const completed = logsInPeriod.some(
    (l) => l.habit_id === habit.id && l.status === 'completed',
  )
  if (completed) return 'completed'
  if (isPastDate(periodEnd)) return 'missed'
  return 'pending'
}

/** Resolve status for a monthly habit: done once in the month, else missed after month-end. */
export function resolveMonthlyStatus(
  habit: Habit,
  monthEndDate: string,
  logsInMonth: HabitLog[],
): HabitStatus {
  const completed = logsInMonth.some(
    (l) => l.habit_id === habit.id && l.status === 'completed',
  )
  if (completed) return 'completed'
  if (isPastDate(monthEndDate)) return 'missed'
  return 'pending'
}

export function habitsForFrequency(habits: Habit[], frequency: Habit['frequency']) {
  return habits.filter((h) => h.frequency === frequency)
}

/** Which Saturday/Sunday-period date a log for a weekly habit should count against. */
export function weeklyPeriodKey(dateISO: string): string {
  return weekendPeriodFor(dateISO).start
}

export function scheduleForDate(
  schedules: HabitSchedule[],
  habitId: string,
  dateISO: string,
): HabitSchedule | null {
  const applicable = schedules
    .filter(
      (schedule) =>
        schedule.habit_id === habitId &&
        schedule.effective_from <= dateISO,
    )
    .sort((a, b) =>
      b.effective_from.localeCompare(a.effective_from),
    )

  return applicable[0] ?? null
}

export function isHabitScheduledOnDate(
  schedules: HabitSchedule[],
  habitId: string,
  dateISO: string,
): boolean {
  const schedule = scheduleForDate(schedules, habitId, dateISO)

  if (!schedule) return false

  const dayOfWeek = new Date(`${dateISO}T00:00:00`).getDay()

  return schedule.weekdays.includes(dayOfWeek)
}

