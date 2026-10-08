import { DragEvent, useState } from 'react'
import { Habit, HabitLog } from '@/types'
import { Card } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import { weekendPeriodsInMonth } from '@/utils/date'
import { habitsForFrequency, resolveWeeklyStatus } from '@/utils/period'

interface WeeklyHabitsProps {
  year: number
  month: number
  habits: Habit[]
  logs: HabitLog[]
  onToggle: (habitId: string, dateISO: string, label: string) => void
  onReorder: (orderedIds: string[]) => Promise<void>
}

export function WeeklyHabits({
  year,
  month,
  habits,
  logs,
  onToggle,
  onReorder,
}: WeeklyHabitsProps) {
  const weekly = habitsForFrequency(
    habits
      .filter((h) => h.active && !h.archived)
      .sort((a, b) => a.order_index - b.order_index),
    'weekly',
  )

  const periods = weekendPeriodsInMonth(year, month)
  const [draggedId, setDraggedId] = useState<string | null>(null)

  function handleDragStart(e: DragEvent<HTMLButtonElement>, id: string) {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }

  function handleDragOver(e: DragEvent<HTMLTableRowElement>) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  async function handleDrop(
    e: DragEvent<HTMLTableRowElement>,
    targetId: string,
  ) {
    e.preventDefault()

    if (!draggedId || draggedId === targetId) {
      setDraggedId(null)
      return
    }

    const ids = weekly.map((habit) => habit.id)
    const fromIndex = ids.indexOf(draggedId)
    const toIndex = ids.indexOf(targetId)

    if (fromIndex === -1 || toIndex === -1) {
      setDraggedId(null)
      return
    }

    const [moved] = ids.splice(fromIndex, 1)
    ids.splice(toIndex, 0, moved)

    try {
      await onReorder(ids)
    } finally {
      setDraggedId(null)
    }
  }

  if (weekly.length === 0) {
    return (
      <Card title="Weekly Habits">
        <p className="text-sm text-ink-faint">No active weekly habits yet.</p>
      </Card>
    )
  }

  return (
    <Card
      title="Weekly Habits"
      subtitle="Counted as done if completed on Saturday or Sunday."
    >
      <div className="mb-2 text-xs text-ink-faint">
        Drag the ⋮⋮ handle to change the weekly habit order.
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="py-1.5 pr-3 text-left font-medium text-ink-soft">
                Habit
              </th>

              {periods.map((p) => (
                <th
                  key={p.start}
                  className="px-2 py-1.5 text-center text-ink-faint font-normal"
                >
                  {p.label}
                  <div className="text-xs">Sat · Sun</div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {weekly.map((habit) => (
              <tr
                key={habit.id}
                className={`border-t border-line/70 ${
                  draggedId === habit.id ? 'opacity-40' : ''
                }`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, habit.id)}
              >
                <td className="py-2 pr-3 text-ink whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      draggable
                      onDragStart={(e) => handleDragStart(e, habit.id)}
                      onDragEnd={() => setDraggedId(null)}
                      className="flex h-7 w-7 shrink-0 cursor-grab items-center justify-center rounded border border-line bg-paper text-sm font-bold text-ink active:cursor-grabbing"
                      title="Drag to reorder"
                      aria-label={`Reorder ${habit.habit_name}`}
                    >
                      ⋮⋮
                    </button>

                    <span>{habit.habit_name}</span>
                  </div>
                </td>

                {periods.map((p) => {
                  const logsInPeriod = logs.filter(
                    (l) =>
                      l.habit_id === habit.id &&
                      (l.date === p.start || l.date === p.end),
                  )

                  const status = resolveWeeklyStatus(
                    habit,
                    p.start,
                    p.end,
                    logsInPeriod,
                  )

                  const satChecked = logsInPeriod.some(
                    (l) =>
                      l.date === p.start && l.status === 'completed',
                  )

                  const sunChecked = logsInPeriod.some(
                    (l) =>
                      l.date === p.end && l.status === 'completed',
                  )

                  return (
                    <td key={p.start} className="px-2 py-2">
                      <div className="flex items-center justify-center gap-2">
                        <Checkbox
                          checked={satChecked}
                          onChange={() =>
                            onToggle(
                              habit.id,
                              p.start,
                              `${habit.habit_name} (Sat)`,
                            )
                          }
                          label={`${habit.habit_name} Saturday ${p.start}`}
                        />

                        <Checkbox
                          checked={sunChecked}
                          onChange={() =>
                            onToggle(
                              habit.id,
                              p.end,
                              `${habit.habit_name} (Sun)`,
                            )
                          }
                          label={`${habit.habit_name} Sunday ${p.end}`}
                        />
                      </div>

                      {status === 'missed' && (
                        <div className="mt-1 text-center text-xs text-clay-500">
                          Missed
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
