import { DragEvent, useState } from 'react'
import { Habit, HabitLog, HabitSchedule, TimeOfDay } from '@/types'
import { Checkbox } from '@/components/ui/Checkbox'
import { Card } from '@/components/ui/Card'
import { datesInMonth, formatDayNum, todayISO } from '@/utils/date'
import {
  habitsForFrequency,
  isHabitApplicable,
  isHabitScheduledOnDate,
  resolveDailyStatus,
} from '@/utils/period'
interface DailyHabitsProps {
  year: number
  month: number
  habits: Habit[]
  logs: HabitLog[]
  schedules: HabitSchedule[]
    onAddSchedule: (habitId: string, effectiveFrom: string, weekdays: number[]) => Promise<void>
  onToggle: (habitId: string, dateISO: string, label: string) => void
  onReorder: (orderedIds: string[]) => Promise<void>
}

interface TimeGroup {
  key: TimeOfDay
  label: string
  icon: string
  habits: Habit[]
}

const TIME_GROUPS: Omit<TimeGroup, 'habits'>[] = [
  { key: 'morning', label: 'Morning', icon: '🌅' },
  { key: 'afternoon', label: 'Afternoon', icon: '☀️' },
  { key: 'night', label: 'Night', icon: '🌙' },
  { key: 'flexible', label: 'Flexible', icon: '↔' },
]

export function DailyHabits({
  year,
  month,
  habits,
  logs,
  schedules,
  onAddSchedule,
  onToggle,
  onReorder,
}: DailyHabitsProps) {
  const daily = habitsForFrequency(
    habits
      .filter((h) => h.active && !h.archived)
      .sort((a, b) => a.order_index - b.order_index),
    'daily',
  )

  const dates = datesInMonth(year, month)
  const today = todayISO()

  const groups: TimeGroup[] = TIME_GROUPS.map((group) => ({
    ...group,
    habits: daily.filter((habit) => habit.time_of_day === group.key),
  })).filter((group) => group.habits.length > 0)

  if (daily.length === 0) {
    return (
      <Card title="Daily Habits">
        <p className="text-sm text-ink-faint">
          No active daily habits yet. Add one from Manage Habits to start tracking.
        </p>
      </Card>
    )
  }

  return (
    <Card title="Daily Habits" subtitle="Tap a day to mark it complete.">
      <div className="mb-2 text-xs text-ink-faint">
        Drag the ⋮⋮ handle to reorder habits within each time section.
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line">
              <th className="bg-paper py-2 pr-3 text-left font-medium text-ink">
                Habit
              </th>

              {dates.map((d) => (
                <th
                  key={d}
                  className={`w-8 py-2 text-center font-normal ${
                    d === today
                      ? 'font-semibold text-moss-700'
                      : 'text-ink-faint'
                  }`}
                >
                  {formatDayNum(d)}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {groups.map((group) => (
              <TimeGroupRows
                key={group.key}
                group={group}
                dates={dates}
                today={today}
                logs={logs}
                  schedules={schedules}
                  onAddSchedule={onAddSchedule}
                onToggle={onToggle}
                onReorder={onReorder}
              />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

interface TimeGroupRowsProps {
  group: TimeGroup
  dates: string[]
  today: string
  logs: HabitLog[]
  schedules: HabitSchedule[]
  onAddSchedule: (habitId: string, effectiveFrom: string, weekdays: number[]) => Promise<void>
  onToggle: (habitId: string, dateISO: string, label: string) => void
  onReorder: (orderedIds: string[]) => Promise<void>
}

function TimeGroupRows({
  group,
  dates,
  today,
  logs,
  schedules,
  onAddSchedule,
  onToggle,
  onReorder,
}: TimeGroupRowsProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null)
    const [showSchedule, setShowSchedule] = useState(false)
    const [scheduleHabitId, setScheduleHabitId] = useState(group.habits[0]?.id ?? '')
    const [effectiveFrom, setEffectiveFrom] = useState(dates[0] ?? '')
    const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([])
    const [scheduleError, setScheduleError] = useState('')

    async function handleAddSchedule() {
      if (!scheduleHabitId || !effectiveFrom || selectedWeekdays.length === 0) {
        setScheduleError('Choose a habit, date, and at least one day.')
        return
      }

      try {
        setScheduleError('')
        await onAddSchedule(
          scheduleHabitId,
          effectiveFrom,
          selectedWeekdays,
        )
        setSelectedWeekdays([])
        setShowSchedule(false)
      } catch {
        setScheduleError('Failed to save schedule.')
      }
    }

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

    const ids = group.habits.map((habit) => habit.id)
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

  return (
    <>
      <tr>
        <td
          colSpan={dates.length + 1}
          className="border-t-2 border-line bg-paper-dark/30 px-2 py-2.5"
        >
          <div className="flex items-center gap-3">
            <span className="text-base" aria-hidden="true">
              {group.icon}
            </span>

            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
              {group.label}
            </span>

            <div className="ml-auto flex items-center gap-3">
              <span className="text-xs text-ink-faint">
                {group.habits.length}{' '}
                {group.habits.length === 1 ? 'habit' : 'habits'}
              </span>

              {group.key === 'flexible' && (
                <button
                  type="button"
                  onClick={() => setShowSchedule((value) => !value)}
                  className="rounded-md border border-line px-2.5 py-1 text-xs font-medium text-ink-soft hover:bg-paper-dark"
                >
                  {showSchedule ? 'Close' : 'Schedule'}
                </button>
              )}
            </div>
          </div>
        </td>
      </tr>


      {group.key === 'flexible' && showSchedule && (
        <tr>
          <td
            colSpan={dates.length + 1}
            className="border-t border-line bg-paper px-3 py-3"
          >
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[180px]">
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Habit
                </label>
                <select
                  value={scheduleHabitId}
                  onChange={(e) => setScheduleHabitId(e.target.value)}
                  className="w-full rounded-md border border-line bg-paper px-2.5 py-1.5 text-sm text-ink"
                >
                  {group.habits.map((habit) => (
                    <option key={habit.id} value={habit.id}>
                      {habit.habit_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">
                  Effective from
                </label>
                <input
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className="rounded-md border border-line bg-paper px-2.5 py-1.5 text-sm text-ink"
                />
              </div>

              <div>
                <span className="mb-1 block text-xs font-medium text-ink-soft">
                  Target days
                </span>
                <div className="flex flex-wrap gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                    <label key={day} className="flex items-center gap-1 text-xs text-ink-soft">
                      <input
                        type="checkbox"
                        checked={selectedWeekdays.includes(index)}
                        onChange={() =>
                          setSelectedWeekdays((current) =>
                            current.includes(index)
                              ? current.filter((value) => value !== index)
                              : [...current, index].sort((a, b) => a - b),
                          )
                        }
                      />
                      {day}
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddSchedule}
                className="rounded-md bg-moss-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-moss-800"
              >
                Save
              </button>
            </div>

            {scheduleError && (
              <p className="mt-2 text-xs text-red-600">{scheduleError}</p>
            )}
          </td>
        </tr>
      )}
      {group.habits.map((habit) => (
        <HabitRow
          key={habit.id}
          habit={habit}
          dates={dates}
          today={today}
          logs={logs}
                  schedules={schedules}
                  onAddSchedule={onAddSchedule}
          onToggle={onToggle}
          draggedId={draggedId}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={() => setDraggedId(null)}
        />
      ))}
    </>
  )
}

interface HabitRowProps {
  habit: Habit
  dates: string[]
  today: string
  logs: HabitLog[]
  schedules: HabitSchedule[]
  onAddSchedule: (habitId: string, effectiveFrom: string, weekdays: number[]) => Promise<void>
  onToggle: (habitId: string, dateISO: string, label: string) => void
  draggedId: string | null
  onDragStart: (e: DragEvent<HTMLButtonElement>, id: string) => void
  onDragOver: (e: DragEvent<HTMLTableRowElement>) => void
  onDrop: (e: DragEvent<HTMLTableRowElement>, targetId: string) => void
  onDragEnd: () => void
}

function HabitRow({
  habit,
  dates,
  today,
  logs,
  schedules,
  onAddSchedule,
  onToggle,
  draggedId,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: HabitRowProps) {
  return (
    <tr
      className={`border-t border-line/60 ${
        draggedId === habit.id ? 'opacity-40' : ''
      }`}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, habit.id)}
    >
      <td className="bg-paper py-2.5 pr-3 pl-4 text-ink whitespace-nowrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            draggable
            onDragStart={(e) => onDragStart(e, habit.id)}
            onDragEnd={onDragEnd}
            className="flex h-7 w-7 shrink-0 cursor-grab items-center justify-center rounded border border-line bg-paper text-sm font-bold text-ink active:cursor-grabbing"
            title="Drag to reorder"
            aria-label={`Reorder ${habit.habit_name}`}
          >
            ⋮⋮
          </button>

          <span>{habit.habit_name}</span>
        </div>
      </td>

      {dates.map((d) => {
        const applicable = isHabitApplicable(habit, d)
        const scheduled =
          habit.time_of_day !== 'flexible' ||
          isHabitScheduledOnDate(schedules, habit.id, d)

        const dayLogs = logs.filter(
          (log) => log.date === d && log.habit_id === habit.id,
        )

        const status = resolveDailyStatus(habit, d, dayLogs)

        return (
          <td key={d} className="py-2.5 text-center align-middle">
            {applicable && scheduled ? (
              <div className="flex justify-center">
                <Checkbox
                  checked={status === 'completed'}
                  disabled={d > today}
                  onChange={() =>
                    onToggle(
                      habit.id,
                      d,
                      `${habit.habit_name} ${d}`,
                    )
                  }
                  label={`${habit.habit_name} ${d}`}
                />
              </div>
            ) : (
              <span className="text-ink-faint">—</span>
            )}
          </td>
        )
      })}
    </tr>
  )
}










