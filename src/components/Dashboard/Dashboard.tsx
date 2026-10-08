import { useEffect, useState } from 'react'
import { useDateContext } from '@/context/DateContext'
import { useHabits } from '@/hooks/useHabits'
import { useHabitLogs } from '@/hooks/useHabitLogs'
import { useHabitSchedules } from '@/hooks/useHabitSchedules'
import { useMonthlyPlanning } from '@/hooks/useMonthlyPlanning'
import { useYearHabitLogs } from '@/hooks/useYearHabitLogs'
import { SummaryCards } from '@/components/Dashboard/SummaryCards'
import { DailyHabits } from '@/components/Dashboard/DailyHabits'
import { WeeklyHabits } from '@/components/Dashboard/WeeklyHabits'
import { MonthlyHabits } from '@/components/Dashboard/MonthlyHabits'
import { DailyReview } from '@/components/Dashboard/DailyReview'
import { MoodTracker } from '@/components/Dashboard/MoodTracker'
import { SleepTracker } from '@/components/Dashboard/SleepTracker'
import { WeeklyReview } from '@/components/Dashboard/WeeklyReview'
import { MonthlyReview } from '@/components/Dashboard/MonthlyReview'
import { MonthlyPlanning } from '@/components/Dashboard/MonthlyPlanning'
import { MonthlyPlanningReminder } from '@/components/Dashboard/MonthlyPlanningReminder'
import { YearlyHabitOverview } from '@/components/Dashboard/YearlyHabitOverview'
import {
  SleepChart,
  WeeklyConsistencyChart,
  MonthlyConsistencyChart,
} from '@/components/Dashboard/Charts'
import { Card } from '@/components/ui/Card'
import {
  datesInMonth,
  formatDisplayDate,
  currentYearMonth,
  todayISO,
} from '@/utils/date'

type DashboardSection = 'daily' | 'weekly' | 'monthly'

export function Dashboard() {
  const { year, month } = useDateContext()
  const { habits, loading: habitsLoading, error, reorderHabits } = useHabits()
  const { logs, loading: logsLoading, toggleCompletion } = useHabitLogs(year, month)
  const { logs: yearLogs } = useYearHabitLogs(year)
  const { schedules, addSchedule } = useHabitSchedules()
  const { planning } = useMonthlyPlanning(year, month)

  const [section, setSection] = useState<DashboardSection>('daily')

  const dates = datesInMonth(year, month)
  const { year: curYear, month: curMonth } = currentYearMonth()
  const defaultDay =
    year === curYear && month === curMonth ? todayISO() : dates[0]

  const [selectedDay, setSelectedDay] = useState(defaultDay)

  useEffect(() => {
    const { year: cy, month: cm } = currentYearMonth()

    setSelectedDay(year === cy && month === cm ? todayISO() : dates[0])

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month])

  const loading = habitsLoading || logsLoading

  if (error) {
    return (
      <Card title="Something went wrong">
        <p className="text-sm text-clay-500">
          Could not load your habits. Check your connection and Supabase
          configuration, then reload.
        </p>
      </Card>
    )
  }

  if (loading && habits.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center text-ink-faint">
        <p className="text-sm">Loading your dashboard...</p>
      </div>
    )
  }

  const hasAnyHabit = habits.length > 0

  return (
    <div className="space-y-5">
      <SummaryCards
        year={year}
        month={month}
        habits={habits}
        logs={logs}
      />

    

      <MonthlyPlanningReminder
        year={year}
        month={month}
        planning={planning}
      />

      <YearlyHabitOverview
        year={year}
        habits={habits}
        logs={yearLogs}
      />

      <div className="flex gap-1 border-b border-line">
        <SectionButton
          active={section === 'daily'}
          onClick={() => setSection('daily')}
        >
          Daily
        </SectionButton>

        <SectionButton
          active={section === 'weekly'}
          onClick={() => setSection('weekly')}
        >
          Weekly
        </SectionButton>

        <SectionButton
          active={section === 'monthly'}
          onClick={() => setSection('monthly')}
        >
          Monthly
        </SectionButton>
      </div>

      {!hasAnyHabit ? (
        <Card title="No habits yet">
          <p className="text-sm text-ink-faint">
            Head to Manage Habits to add your first one — daily, weekly, or
            monthly.
          </p>
        </Card>
      ) : (
        <>
          {section === 'daily' && (
            <>
              <DailyHabits
                year={year}
                month={month}
                habits={habits}
                logs={logs}
                schedules={schedules}
                onAddSchedule={addSchedule}
                onToggle={toggleCompletion}
                onReorder={reorderHabits}
              />

              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-ink-soft">
                  Reflecting on {formatDisplayDate(selectedDay)}
                </h3>

                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="rounded-sm border border-line bg-paper px-2 py-1 text-sm text-ink"
                  aria-label="Select day"
                >
                  {dates.map((d) => (
                    <option key={d} value={d}>
                      {formatDisplayDate(d)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid items-stretch gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <DailyReview dateISO={selectedDay} />
                </div>

                <div className="lg:col-span-1">
                  <MoodTracker dateISO={selectedDay} />
                </div>
              </div>

              <SleepTracker dateISO={selectedDay} />

            </>
          )}

          {section === 'weekly' && (
            <>
              <WeeklyHabits
                year={year}
                month={month}
                habits={habits}
                logs={logs}
                onToggle={toggleCompletion}
                onReorder={reorderHabits}
              />

              <WeeklyReview year={year} month={month} />

              <WeeklyConsistencyChart
                year={year}
                month={month}
                habits={habits}
                logs={logs}
              />

            </>
          )}

          {section === 'monthly' && (
            <>
              <MonthlyHabits
                year={year}
                month={month}
                habits={habits}
                logs={logs}
                onToggle={toggleCompletion}
                onReorder={reorderHabits}
              />

              <MonthlyConsistencyChart
                year={year}
                month={month}
                habits={habits}
                logs={logs}
              />

              <MonthlyReview year={year} month={month} />

              <MonthlyPlanning year={year} month={month} />

              <SleepChart year={year} month={month} />

            </>
          )}
        </>
      )}
    </div>
  )
}

function SectionButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'border-moss-600 text-ink'
          : 'border-transparent text-ink-faint hover:text-ink-soft'
      }`}
    >
      {children}
    </button>
  )
}














