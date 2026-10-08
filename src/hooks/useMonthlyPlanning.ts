import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'

export interface MonthlyPlanning {
  id: string
  user_id: string
  year: number
  month: number
  content: string
  created_at: string
  updated_at: string
}

export function useMonthlyPlanning(year: number, month: number) {
  const { user } = useAuth()
  const { notify } = useToast()
  const [planning, setPlanning] = useState<MonthlyPlanning | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) return

    setLoading(true)

    const { data, error } = await supabase
      .from('monthly_plans')
      .select('*')
      .eq('year', year)
      .eq('month', month)
      .maybeSingle()

    if (error) {
      notify('Could not load monthly planning.', 'error')
    }

    setPlanning((data as MonthlyPlanning | null) ?? null)
    setLoading(false)
  }, [user, year, month, notify])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function save(content: string) {
    if (!user) return

    const { data, error } = await supabase
      .from('monthly_plans')
      .upsert(
        {
          user_id: user.id,
          year,
          month,
          content,
        },
        { onConflict: 'user_id,year,month' },
      )
      .select()
      .single()

    if (error) {
      notify('Could not save monthly planning.', 'error')
      throw error
    }

    setPlanning(data as MonthlyPlanning)
    notify('Monthly Planning saved.')
  }

  return { planning, loading, save }
}