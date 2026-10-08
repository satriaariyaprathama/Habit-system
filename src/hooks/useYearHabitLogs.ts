import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { HabitLog } from '@/types'
import { useAuth } from '@/context/AuthContext'

export function useYearHabitLogs(year: number) {
  const { user } = useAuth()
  const [logs, setLogs] = useState<HabitLog[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) return

    setLoading(true)

    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`

    const { data } = await supabase
      .from('habit_logs')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .eq('status', 'completed')
      .order('date', { ascending: true })

    setLogs((data as HabitLog[]) ?? [])
    setLoading(false)
  }, [user, year])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { logs, loading }
}