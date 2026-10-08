import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { MonthlyReview } from '@/types'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'

export function useMonthlyReview(year: number, month: number) {
  const { user } = useAuth()
  const { notify } = useToast()
  const [review, setReview] = useState<MonthlyReview | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('monthly_reviews')
      .select('*')
      .eq('year', year)
      .eq('month', month)
      .maybeSingle()
    if (error) notify('Could not load monthly review.', 'error')
    setReview((data as MonthlyReview | null) ?? null)
    setLoading(false)
  }, [user, year, month, notify])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function save(content: string) {
    if (!user) return
    const { data, error } = await supabase
      .from('monthly_reviews')
      .upsert(
        { user_id: user.id, year, month, content },
        { onConflict: 'user_id,year,month' },
      )
      .select()
      .single()
    if (error) {
      notify('Could not save monthly review.', 'error')
      throw error
    }
    setReview(data as MonthlyReview)
    notify('Monthly Review saved.')
  }

  return { review, loading, save }
}
