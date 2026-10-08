import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '@/components/ui/Card'
import { Habit, HabitLog } from '@/types'
import { useMonthSleep } from '@/hooks/useSleep'
import { weekendPeriodsInMonth, monthEndISO, monthLabel } from '@/utils/date'
import { habitsForFrequency, resolveWeeklyStatus, resolveMonthlyStatus } from '@/utils/period'
import { format, parseISO } from 'date-fns'

export function SleepChart({ year, month }: { year: number; month: number }) {
  const { entries } = useMonthSleep(year, month)

  const daysInMonth = new Date(year, month, 0).getDate()

  const sleepMap = new Map(
    entries.map((e) => [
      e.date,
      Math.round((e.duration_minutes / 60) * 10) / 10,
    ]),
  )

  const data = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    return {
      day,
      date,
      hours: sleepMap.get(date) ?? null,
    }
  })

  return (
    <Card title="Sleep This Month">
      {entries.length === 0 ? (
        <p className="text-sm text-ink-faint">
          No sleep entries logged yet this month.
        </p>
      ) : (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            >
              <CartesianGrid
                stroke="#D8D3C4"
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: '#8A9186' }}
                axisLine={false}
                tickLine={false}
                interval={0}
              />

              <YAxis
                tick={{ fontSize: 11, fill: '#8A9186' }}
                axisLine={false}
                tickLine={false}
                unit="h"
              />

              <Tooltip
                labelFormatter={(day) => {
                  const date = data.find((d) => d.day === day)?.date
                  return date
                    ? format(parseISO(date), 'MMM d, yyyy')
                    : ''
                }}
                formatter={(v: number) => [`${v}h`, 'Sleep']}
                contentStyle={{
                  background: '#F3F1EA',
                  border: '1px solid #D8D3C4',
                  borderRadius: 4,
                  fontSize: 12,
                }}
              />

              <Line
                type="monotone"
                dataKey="hours"
                stroke="#3B6339"
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}


export function MonthlyConsistencyChart({
  year,
  month,
  habits,
  logs,
}: {
  year: number
  month: number
  habits: Habit[]
  logs: HabitLog[]
}) {
  const monthly = habitsForFrequency(
    habits.filter((h) => h.active && !h.archived),
    'monthly',
  )

  const monthEnd = monthEndISO(year, month)

  const completed = monthly.filter((habit) => {
    const logsInMonth = logs.filter((l) => l.habit_id === habit.id)

    return resolveMonthlyStatus(habit, monthEnd, logsInMonth) === 'completed'
  }).length

  const data = [
    {
      month: monthLabel(year, month),
      percent: monthly.length
        ? Math.round((completed / monthly.length) * 100)
        : 0,
    },
  ]

  return (
    <Card title="Monthly Consistency">
      {monthly.length === 0 ? (
        <p className="text-sm text-ink-faint">
          No monthly habits to chart yet.
        </p>
      ) : (
        <div className="h-56 w-full">
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
                formatter={(v: number) => [`${v}%`, 'Completed']}
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
export function WeeklyConsistencyChart({
  year,
  month,
  habits,
  logs,
}: {
  year: number
  month: number
  habits: Habit[]
  logs: HabitLog[]
}) {
  const weekly = habitsForFrequency(
    habits.filter((h) => h.active && !h.archived),
    'weekly',
  )
  const periods = weekendPeriodsInMonth(year, month)
  const data = periods.map((p) => {
    const completed = weekly.filter((h) => {
      const logsInPeriod = logs.filter(
        (l) => l.habit_id === h.id && (l.date === p.start || l.date === p.end),
      )
      return resolveWeeklyStatus(h, p.start, p.end, logsInPeriod) === 'completed'
    }).length
    return {
      week: p.label,
      percent: weekly.length ? Math.round((completed / weekly.length) * 100) : 0,
    }
  })

  return (
    <Card title="Weekly Consistency">
      {weekly.length === 0 ? (
        <p className="text-sm text-ink-faint">No weekly habits to chart yet.</p>
      ) : (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="#D8D3C4" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#8A9186' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#8A9186' }}
                axisLine={false}
                tickLine={false}
                unit="%"
                domain={[0, 100]}
              />
              <Tooltip
                formatter={(v: number) => [`${v}%`, 'Completed']}
                contentStyle={{
                  background: '#F3F1EA',
                  border: '1px solid #D8D3C4',
                  borderRadius: 4,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="percent" fill="#4B7A4A" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}


