import { useMemo } from 'react'
import { Habit } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useHabitHistory } from '@/hooks/useHabitHistory'
import { computeStreaks } from '@/utils/stats'
import { datesInMonth, monthLabel, todayISO } from '@/utils/date'
import { isHabitApplicable } from '@/utils/period'
import { format, parseISO, subMonths } from 'date-fns'

export function HabitDetail({ habit, onClose }: { habit: Habit | null; onClose: () => void }) {
  const { logs } = useHabitHistory(habit?.id ?? null)

  const completedDatesSet = useMemo(() => new Set(logs.map((l) => l.date)), [logs])

  const stats = useMemo(() => {
    if (!habit) return null
    // Build the applicable-date range from the habit's start_date through today
    // (or its end_date, whichever is earlier) to compute accurate streaks.
    const today = todayISO()
    const rangeEnd = habit.end_date && habit.end_date < today ? habit.end_date : today
    const applicableDates: string[] = []
    let cursor = parseISO(habit.start_date)
    const end = parseISO(rangeEnd)
    while (cursor <= end) {
      const iso = format(cursor, 'yyyy-MM-dd')
      if (isHabitApplicable(habit, iso)) applicableDates.push(iso)
      cursor = new Date(cursor.getTime() + 86400000)
    }
    const { current, longest } = computeStreaks(applicableDates, completedDatesSet)
    const completed = applicableDates.filter((d) => completedDatesSet.has(d)).length
    const completionRate = applicableDates.length
      ? Math.round((completed / applicableDates.length) * 100)
      : 0
    return { current, longest, completed, completionRate, applicableCount: applicableDates.length }
  }, [habit, completedDatesSet])

  const monthlyTrend = useMemo(() => {
    if (!habit) return []
    const now = new Date()
    return Array.from({ length: 3 }, (_, i) => subMonths(now, i))
      .reverse()
      .map((d) => {
        const year = d.getFullYear()
        const month = d.getMonth() + 1
        const dates = datesInMonth(year, month).filter(
          (iso) => isHabitApplicable(habit, iso) && iso <= todayISO(),
        )
        const completed = dates.filter((iso) => completedDatesSet.has(iso)).length
        return {
          label: monthLabel(year, month),
          percent: dates.length ? Math.round((completed / dates.length) * 100) : 0,
        }
      })
  }, [habit, completedDatesSet])

  if (!habit || !stats) return null

  return (
    <Modal open={!!habit} onClose={onClose} title={habit.habit_name}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Current Streak" value={`${stats.current} days`} />
        <Stat label="Longest Streak" value={`${stats.longest} days`} />
        <Stat label="Completion Rate" value={`${stats.completionRate}%`} />
        <Stat label="Total Completed" value={String(stats.completed)} />
      </div>

      <div className="mt-5 space-y-3">
        <h3 className="text-sm font-medium text-ink-soft">History</h3>
        {monthlyTrend.map((m) => (
          <div key={m.label}>
            <div className="mb-1 flex justify-between text-xs text-ink-faint">
              <span>{m.label}</span>
              <span>{m.percent}%</span>
            </div>
            <ProgressBar percent={m.percent} />
          </div>
        ))}
      </div>
    </Modal>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line rounded-lg p-3 text-center">
      <div className="font-display text-lg text-ink">{value}</div>
      <div className="mt-0.5 text-xs text-ink-faint">{label}</div>
    </div>
  )
}
