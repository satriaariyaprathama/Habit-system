import { useState } from 'react'
import { Habit } from '@/types'
import { HabitManager } from '@/components/Habits/HabitManager'
import { HabitDetail } from '@/components/Habits/HabitDetail'

export function HabitsPage() {
  const [selected, setSelected] = useState<Habit | null>(null)

  return (
    <div className="space-y-5">
      <HabitManager onOpenHabit={setSelected} />
      <HabitDetail habit={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
