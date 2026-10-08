import { formatInTimeZone, toZonedTime } from 'date-fns-tz'
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  parseISO,
  startOfMonth,
} from 'date-fns'

// Every "what day is it" decision in this app goes through this timezone. Using
// `new Date()` + UTC getters directly would flip the date near midnight WIB
// (e.g. 23:30 WIB is still "today", but new Date().toISOString() would already
// show tomorrow because it's rendered in UTC).
export const APP_TIMEZONE = 'Asia/Jakarta'

/** Today's calendar date in Asia/Jakarta, as an ISO date string (YYYY-MM-DD). */
export function todayISO(): string {
  return formatInTimeZone(new Date(), APP_TIMEZONE, 'yyyy-MM-dd')
}

/** Current { year, month } (1-12) in Asia/Jakarta. */
export function currentYearMonth(): { year: number; month: number } {
  const now = toZonedTime(new Date(), APP_TIMEZONE)
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

/** All calendar dates (ISO strings) in a given year/month, in order. */
export function datesInMonth(year: number, month: number): string[] {
  const monthStart = startOfMonth(new Date(year, month - 1, 1))
  const monthEnd = endOfMonth(monthStart)
  return eachDayOfInterval({ start: monthStart, end: monthEnd }).map((d) =>
    format(d, 'yyyy-MM-dd'),
  )
}

export function daysInMonth(year: number, month: number): number {
  return endOfMonth(new Date(year, month - 1, 1)).getDate()
}

export function monthLabel(year: number, month: number): string {
  return format(new Date(year, month - 1, 1), 'MMMM yyyy')
}

/**
 * Weekly habits are judged over a Saturday+Sunday period, per spec. Given any
 * ISO date, return the { start, end } (Saturday, Sunday) of the period it
 * belongs to. If the date is Mon-Fri, it's treated as belonging to the
 * upcoming weekend's period (mirrors how the UI groups "Week N" rows).
 */
export function weekendPeriodFor(dateISO: string): { start: string; end: string } {
  const d = parseISO(dateISO)
  const dow = getDay(d) // 0 = Sunday, 6 = Saturday
  let saturday: Date
  if (dow === 6) saturday = d
  else if (dow === 0) saturday = addDays(d, -1)
  else saturday = addDays(d, 6 - dow) // Mon(1)..Fri(5) -> upcoming Saturday
  const sunday = addDays(saturday, 1)
  return { start: format(saturday, 'yyyy-MM-dd'), end: format(sunday, 'yyyy-MM-dd') }
}

/** All Saturday/Sunday periods that fall (start date) within a given month. */
export function weekendPeriodsInMonth(
  year: number,
  month: number,
): { start: string; end: string; label: string }[] {
  const monthStart = startOfMonth(new Date(year, month - 1, 1))
  const monthEnd = endOfMonth(monthStart)
  const periods: { start: string; end: string; label: string }[] = []
  let cursor = monthStart
  let weekNum = 1
  // Find the first Saturday on/after monthStart, then step by 7 days.
  const firstDow = getDay(monthStart)
  const offsetToSaturday = (6 - firstDow + 7) % 7
  cursor = addDays(monthStart, offsetToSaturday)
  while (cursor <= monthEnd) {
    const saturday = cursor
    const sunday = addDays(saturday, 1)
    periods.push({
      start: format(saturday, 'yyyy-MM-dd'),
      end: format(sunday, 'yyyy-MM-dd'),
      label: `Week ${weekNum}`,
    })
    weekNum += 1
    cursor = addDays(cursor, 7)
  }
  return periods
}

export function monthEndISO(year: number, month: number): string {
  return format(endOfMonth(new Date(year, month - 1, 1)), 'yyyy-MM-dd')
}

export function isPastDate(dateISO: string): boolean {
  return dateISO < todayISO()
}

export function formatDisplayDate(dateISO: string): string {
  return format(parseISO(dateISO), 'MMMM d, yyyy')
}

export function formatDayNum(dateISO: string): number {
  return parseISO(dateISO).getDate()
}
