import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { WeeklyReview } from '@/types'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'

export function useWeeklyReview(weekStart: string, weekEnd: string) {
  const { user } = useAuth()
  const { notify } = useToast()
  const [review, setReview] = useState<WeeklyReview | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('weekly_reviews')
      .select('*')
      .eq('week_start', weekStart)
      .maybeSingle()
    if (error) notify('Could not load weekly review.', 'error')
    setReview((data as WeeklyReview | null) ?? null)
    setLoading(false)
  }, [user, weekStart, notify])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function save(content: string) {
    if (!user) return
    const { data, error } = await supabase
      .from('weekly_reviews')
      .upsert(
        { user_id: user.id, week_start: weekStart, week_end: weekEnd, content },
        { onConflict: 'user_id,week_start' },
      )
      .select()
      .single()
    if (error) {
      notify('Could not save weekly review.', 'error')
      throw error
    }
    setReview(data as WeeklyReview)
    notify('Weekly Review saved.')
  }

  return { review, loading, save }
}
