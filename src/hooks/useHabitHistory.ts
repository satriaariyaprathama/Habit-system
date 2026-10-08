import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { HabitLog } from '@/types'
import { useAuth } from '@/context/AuthContext'

/**
 * Loads every completed log row for one habit. This is scoped to a single
 * habit_id (indexed) rather than the user's entire history table, so it stays
 * cheap even after years of daily use.
 */
export function useHabitHistory(habitId: string | null) {
  const { user } = useAuth()
  const [logs, setLogs] = useState<HabitLog[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user || !habitId) return
    setLoading(true)
    const { data } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('habit_id', habitId)
      .eq('status', 'completed')
      .order('date', { ascending: true })
    setLogs((data as HabitLog[]) ?? [])
    setLoading(false)
  }, [user, habitId])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { logs, loading }
}
