import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Mood, MoodLog } from '@/types'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'

export function useMood(dateISO: string) {
  const { user } = useAuth()
  const { notify } = useToast()
  const [moodLog, setMoodLog] = useState<MoodLog | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('mood_logs')
      .select('*')
      .eq('date', dateISO)
      .maybeSingle()
    if (error) notify('Could not load mood.', 'error')
    setMoodLog((data as MoodLog | null) ?? null)
    setLoading(false)
  }, [user, dateISO, notify])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function setMood(mood: Mood, note?: string) {
    if (!user) return
    const { data, error } = await supabase
      .from('mood_logs')
      .upsert(
        { user_id: user.id, date: dateISO, mood, note: note ?? null },
        { onConflict: 'user_id,date' },
      )
      .select()
      .single()
    if (error) {
      notify('Could not save mood.', 'error')
      throw error
    }
    setMoodLog(data as MoodLog)
    notify('Mood updated.')
  }

  return { moodLog, loading, setMood }
}
