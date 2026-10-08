import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { HabitSchedule } from '@/types'
import { useAuth } from '@/context/AuthContext'

export function useHabitSchedules(habitId?: string) {
  const { user } = useAuth()
  const [schedules, setSchedules] = useState<HabitSchedule[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) {
      setSchedules([])
      setLoading(false)
      return
    }

    setLoading(true)

    let query = supabase
      .from('habit_schedules')
      .select('*')
      .eq('user_id', user.id)
      .order('effective_from', { ascending: true })

    if (habitId) {
      query = query.eq('habit_id', habitId)
    }

    const { data } = await query

    setSchedules((data as HabitSchedule[]) ?? [])
    setLoading(false)
  }, [user, habitId])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function addSchedule(
    habitId: string,
    effectiveFrom: string,
    weekdays: number[],
  ) {
    if (!user) return

    const { error } = await supabase
      .from('habit_schedules')
      .insert({
        user_id: user.id,
        habit_id: habitId,
        effective_from: effectiveFrom,
        weekdays,
      })

    if (error) throw error

    await refresh()
  }

  async function deleteSchedule(id: string) {
    if (!user) return

    const { error } = await supabase
      .from('habit_schedules')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    await refresh()
  }

  return {
    schedules,
    loading,
    refresh,
    addSchedule,
    deleteSchedule,
  }
}
