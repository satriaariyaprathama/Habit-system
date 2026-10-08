import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { HabitLog, HabitStatus } from '@/types'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { datesInMonth } from '@/utils/date'

/**
 * Loads habit_logs for exactly the displayed month (plus a few days of
 * lookback/lookahead so weekly periods that straddle a month boundary still
 * resolve correctly), instead of the entire history. See spec §25 Performance.
 */
export function useHabitLogs(year: number, month: number) {
  const { user } = useAuth()
  const { notify } = useToast()
  const [logs, setLogs] = useState<HabitLog[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const dates = datesInMonth(year, month)
    const rangeStart = dates[0]
    const rangeEnd = dates[dates.length - 1]
    const { data, error } = await supabase
      .from('habit_logs')
      .select('*')
      .gte('date', rangeStart)
      .lte('date', rangeEnd)
    if (error) {
      notify('Could not load habit history.', 'error')
    } else {
      setLogs(data as HabitLog[])
    }
    setLoading(false)
  }, [user, year, month, notify])

  useEffect(() => {
    refresh()
  }, [refresh])

  /** Toggle a single day's completion for a habit. Upsert, never insert-duplicate. */
  async function toggleCompletion(habitId: string, dateISO: string, habitLabel: string) {
    if (!user) return
    const existing = logs.find((l) => l.habit_id === habitId && l.date === dateISO)
    const nextStatus: HabitStatus = existing?.status === 'completed' ? 'pending' : 'completed'

    // Optimistic UI update so checkbox taps feel instant on mobile.
    setLogs((prev) => {
      const others = prev.filter((l) => !(l.habit_id === habitId && l.date === dateISO))
      if (nextStatus === 'pending') return others
      const optimistic: HabitLog = existing
        ? { ...existing, status: nextStatus }
        : {
            id: `optimistic-${habitId}-${dateISO}`,
            user_id: user.id,
            habit_id: habitId,
            date: dateISO,
            status: nextStatus,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
      return [...others, optimistic]
    })

    if (nextStatus === 'pending') {
      // "Un-completing" removes the completed record rather than writing a
      // separate row; missed/pending is derived at read time (see utils/period.ts).
      const { error } = await supabase
        .from('habit_logs')
        .delete()
        .eq('habit_id', habitId)
        .eq('date', dateISO)
      if (error) {
        notify('Could not update habit.', 'error')
        await refresh()
        return
      }
    } else {
      const { error } = await supabase
        .from('habit_logs')
        .upsert(
          { user_id: user.id, habit_id: habitId, date: dateISO, status: 'completed' },
          { onConflict: 'user_id,habit_id,date' },
        )
      if (error) {
        notify('Could not update habit.', 'error')
        await refresh()
        return
      }
      notify(`${habitLabel} completed.`)
    }
  }

  return { logs, loading, refresh, toggleCompletion }
}
