import { Habit, HabitLog } from '@/types'
import { Card } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import { monthEndISO, todayISO } from '@/utils/date'
import { habitsForFrequency, resolveMonthlyStatus } from '@/utils/period'

interface MonthlyHabitsProps {
  year: number
  month: number
  habits: Habit[]
  logs: HabitLog[]
  onToggle: (habitId: string, dateISO: string, label: string) => void
  onReorder: (orderedIds: string[]) => Promise<void>
}

export function MonthlyHabits({
  year,
  month,
  habits,
  logs,
  onToggle,
  onReorder,
}: MonthlyHabitsProps) {
  const monthly = habitsForFrequency(
    habits
      .filter((h) => h.active && !h.archived)
      .sort((a, b) => a.order_index - b.order_index),
    'monthly',
  )

  const monthEnd = monthEndISO(year, month)

  if (monthly.length === 0) {
    return (
      <Card title="Monthly Habits">
        <p className="text-sm text-ink-faint">
          No active monthly habits yet.
        </p>
      </Card>
    )
  }

  function moveTo(targetId: string, draggedId: string) {
    if (draggedId === targetId) return

    const ids = monthly.map((habit) => habit.id)
    const from = ids.indexOf(draggedId)
    const to = ids.indexOf(targetId)

    if (from < 0 || to < 0) return

    const [moved] = ids.splice(from, 1)
    ids.splice(to, 0, moved)

    void onReorder(ids)
  }

  return (
    <Card
      title="Monthly Habits"
      subtitle="Completed once, any time this month."
    >
      <ul className="divide-y divide-line/70">
        {monthly.map((habit) => {
          const logsInMonth = logs.filter((l) => l.habit_id === habit.id)
          const status = resolveMonthlyStatus(
            habit,
            monthEnd,
            logsInMonth,
          )
          const completedLog = logsInMonth.find(
            (l) => l.status === 'completed',
          )

          return (
            <li
              key={habit.id}
              className="flex items-center justify-between gap-3 py-2.5"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const draggedId = e.dataTransfer.getData('text/plain')

                if (draggedId) {
                  moveTo(habit.id, draggedId)
                }
              }}
            >
              <div className="flex min-w-0 items-center gap-2">
                <button
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move'
                    e.dataTransfer.setData('text/plain', habit.id)
                  }}
                  className="flex h-7 w-7 shrink-0 cursor-grab items-center justify-center rounded border border-line bg-paper text-sm font-bold text-ink active:cursor-grabbing"
                  title="Drag to reorder"
                  aria-label={`Drag ${habit.habit_name} to reorder`}
                >
                  ⋮⋮
                </button>

                <span className="text-ink">
                  {habit.habit_name}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {status === 'missed' && (
                  <span className="text-xs text-clay-500">
                    Missed
                  </span>
                )}

                <Checkbox
                  checked={status === 'completed'}
                  onChange={() =>
                    onToggle(
                      habit.id,
                      completedLog?.date ?? todayISO(),
                      habit.habit_name,
                    )
                  }
                  label={habit.habit_name}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
