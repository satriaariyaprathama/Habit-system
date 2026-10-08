import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from '@/components/ui/Card'
import { Habit, HabitLog } from '@/types'
import { datesInMonth, monthLabel, weekendPeriodsInMonth } from '@/utils/date'
import { habitsForFrequency, isHabitApplicable, resolveMonthlyStatus, resolveWeeklyStatus } from '@/utils/period'
import { completionRateForHabit } from '@/utils/stats'

interface YearlyHabitOverviewProps {
  year: number
  habits: Habit[]
  logs: HabitLog[]
}

export function YearlyHabitOverview({
  year,
  habits,
  logs,
}: YearlyHabitOverviewProps) {
  const activeHabits = habits.filter((h) => h.active && !h.archived)

  const data = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1

    const monthlyRates = activeHabits
      .map((habit) => {
        const monthLogs = logs.filter((l) => {
          const prefix = `${year}-${String(month).padStart(2, '0')}`
          return l.habit_id === habit.id && l.date.startsWith(prefix)
        })

        if (habit.frequency === 'daily') {
          return completionRateForHabit(
            habit,
            datesInMonth(year, month),
            monthLogs,
          ).percent
        }

        if (habit.frequency === 'weekly') {
          const periods = weekendPeriodsInMonth(year, month)

          if (periods.length === 0) return null

          const completed = periods.filter((period) => {
            const applicable = isHabitApplicable(habit, period.start) ||
              isHabitApplicable(habit, period.end)

            if (!applicable) return false

            return (
              resolveWeeklyStatus(
                habit,
                period.start,
                period.end,
                monthLogs,
              ) === 'completed'
            )
          }).length

          return Math.round((completed / periods.length) * 100)
        }

        if (habit.frequency === 'monthly') {
          const applicable = isHabitApplicable(
            habit,
            `${year}-${String(month).padStart(2, '0')}-01`,
          )

          if (!applicable) return null

          return resolveMonthlyStatus(
            habit,
            `${year}-${String(month).padStart(2, '0')}-${new Date(
              year,
              month,
              0,
            ).getDate()}`,
            monthLogs,
          ) === 'completed'
            ? 100
            : 0
        }

        return null
      })
      .filter((rate): rate is number => rate !== null)

    return {
      month: monthLabel(year, month).slice(0, 3),
      percent: monthlyRates.length
        ? Math.round(
            monthlyRates.reduce((sum, rate) => sum + rate, 0) /
              monthlyRates.length,
          )
        : null,
    }
  })

  return (
    <Card title="Yearly Habit Overview" subtitle={`Habit consistency in ${year}`}>
      {activeHabits.length === 0 ? (
        <p className="text-sm text-ink-faint">
          No active habits to chart yet.
        </p>
      ) : (
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            >
              <CartesianGrid
                stroke="#D8D3C4"
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#8A9186' }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                tick={{ fontSize: 11, fill: '#8A9186' }}
                axisLine={false}
                tickLine={false}
                unit="%"
                domain={[0, 100]}
              />

              <Tooltip
                formatter={(v: number) => [`${v}%`, 'Consistency']}
                contentStyle={{
                  background: '#F3F1EA',
                  border: '1px solid #D8D3C4',
                  borderRadius: 4,
                  fontSize: 12,
                }}
              />

              <Bar
                dataKey="percent"
                fill="#4B7A4A"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}