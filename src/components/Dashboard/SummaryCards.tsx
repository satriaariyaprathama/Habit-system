import { Habit, HabitLog } from '@/types'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { computeDailyProgress } from '@/utils/stats'
import { monthEndISO, todayISO, weekendPeriodsInMonth } from '@/utils/date'
import { habitsForFrequency, resolveMonthlyStatus, resolveWeeklyStatus } from '@/utils/period'

interface SummaryCardsProps {
  year: number
  month: number
  habits: Habit[]
  logs: HabitLog[]
}

function SummaryTile({
  label,
  fraction,
  percent,
}: {
  label: string
  fraction: string
  percent: number
}) {
  return (
    <div className="border border-line rounded-lg p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-ink-soft">{label}</span>
        <span className="font-display text-2xl text-ink">{percent}%</span>
      </div>
      <div className="mt-2">
        <ProgressBar percent={percent} />
      </div>
      <div className="mt-1.5 text-xs text-ink-faint">{fraction}</div>
    </div>
  )
}

export function SummaryCards({ year, month, habits, logs }: SummaryCardsProps) {
  const activeHabits = habits.filter((h) => h.active && !h.archived)
  const today = todayISO()

  const daily = computeDailyProgress(activeHabits, logs)

  const weeklyHabits = habitsForFrequency(activeHabits, 'weekly')
  const periods = weekendPeriodsInMonth(year, month)
  const currentPeriod =
    periods.find((p) => today >= p.start && today <= p.end) ?? periods[periods.length - 1]
  let weeklyCompleted = 0
  if (currentPeriod) {
    weeklyCompleted = weeklyHabits.filter((h) => {
      const logsInPeriod = logs.filter(
        (l) =>
          l.habit_id === h.id && (l.date === currentPeriod.start || l.date === currentPeriod.end),
      )
      return (
        resolveWeeklyStatus(h, currentPeriod.start, currentPeriod.end, logsInPeriod) ===
        'completed'
      )
    }).length
  }
  const weeklyPercent = weeklyHabits.length
    ? Math.round((weeklyCompleted / weeklyHabits.length) * 100)
    : 0

  const monthlyHabits = habitsForFrequency(activeHabits, 'monthly')
  const monthEnd = monthEndISO(year, month)
  const monthlyCompleted = monthlyHabits.filter(
    (h) => resolveMonthlyStatus(h, monthEnd, logs.filter((l) => l.habit_id === h.id)) === 'completed',
  ).length
  const monthlyPercent = monthlyHabits.length
    ? Math.round((monthlyCompleted / monthlyHabits.length) * 100)
    : 0

  const dailyHabits = habitsForFrequency(activeHabits, 'daily')
  const overallTotal = dailyHabits.length + weeklyHabits.length + monthlyHabits.length
  const overallCompleted = daily.completed + weeklyCompleted + monthlyCompleted
  const overallApplicable = daily.applicable + weeklyHabits.length + monthlyHabits.length
  const overallPercent = overallApplicable
    ? Math.round((overallCompleted / overallApplicable) * 100)
    : 0

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <SummaryTile
        label="Today's Progress"
        fraction={`${daily.completed} / ${daily.applicable} habits`}
        percent={daily.percent}
      />
      <SummaryTile
        label="Weekly Progress"
        fraction={`${weeklyCompleted} / ${weeklyHabits.length} weekly habits`}
        percent={weeklyPercent}
      />
      <SummaryTile
        label="Monthly Progress"
        fraction={`${monthlyCompleted} / ${monthlyHabits.length} monthly habits`}
        percent={monthlyPercent}
      />
      <SummaryTile
        label="Overall Consistency"
        fraction={`${overallCompleted} / ${overallApplicable || overallTotal} today`}
        percent={overallPercent}
      />
    </div>
  )
}
