import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { SleepLog } from '@/types'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { datesInMonth } from '@/utils/date'

export function useSleep(dateISO: string) {
  const { user } = useAuth()
  const { notify } = useToast()
  const [sleepLog, setSleepLog] = useState<SleepLog | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('sleep_logs')
      .select('*')
      .eq('date', dateISO)
      .maybeSingle()
    if (error) notify('Could not load sleep record.', 'error')
    setSleepLog((data as SleepLog | null) ?? null)
    setLoading(false)
  }, [user, dateISO, notify])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function save(input: {
    duration_minutes: number
    bedtime?: string | null
    wake_time?: string | null
    note?: string | null
  }) {
    if (!user) return
    const { data, error } = await supabase
      .from('sleep_logs')
      .upsert(
        {
          user_id: user.id,
          date: dateISO,
          duration_minutes: input.duration_minutes,
          bedtime: input.bedtime ?? null,
          wake_time: input.wake_time ?? null,
          note: input.note ?? null,
        },
        { onConflict: 'user_id,date' },
      )
      .select()
      .single()
    if (error) {
      notify('Could not save sleep record.', 'error')
      throw error
    }
    setSleepLog(data as SleepLog)
    notify('Sleep record saved.')
  }

  return { sleepLog, loading, save }
}

/** All sleep entries in a month, for the sleep chart. */
export function useMonthSleep(year: number, month: number) {
  const { user } = useAuth()
  const [entries, setEntries] = useState<SleepLog[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const dates = datesInMonth(year, month)
    const { data } = await supabase
      .from('sleep_logs')
      .select('*')
      .gte('date', dates[0])
      .lte('date', dates[dates.length - 1])
      .order('date', { ascending: true })
    setEntries((data as SleepLog[]) ?? [])
    setLoading(false)
  }, [user, year, month])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { entries, loading }
}
