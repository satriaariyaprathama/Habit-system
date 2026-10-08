import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { DailyReview } from '@/types'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'

export function useDailyReview(dateISO: string) {
  const { user } = useAuth()
  const { notify } = useToast()
  const [review, setReview] = useState<DailyReview | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('daily_reviews')
      .select('*')
      .eq('date', dateISO)
      .maybeSingle()
    if (error) notify('Could not load daily review.', 'error')
    setReview((data as DailyReview | null) ?? null)
    setLoading(false)
  }, [user, dateISO, notify])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function save(content: string) {
    if (!user) return
    const { data, error } = await supabase
      .from('daily_reviews')
      .upsert(
        { user_id: user.id, date: dateISO, content },
        { onConflict: 'user_id,date' },
      )
      .select()
      .single()
    if (error) {
      notify('Could not save daily review.', 'error')
      throw error
    }
    setReview(data as DailyReview)
    notify('Daily Review saved.')
  }

  return { review, loading, save }
}
