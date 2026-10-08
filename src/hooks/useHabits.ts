import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Habit } from '@/types'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'

export type HabitInput = Omit<
  Habit,
  'id' | 'user_id' | 'created_at' | 'updated_at' | 'archived' | 'order_index'
>

export function useHabits() {
  const { user } = useAuth()
  const { notify } = useToast()
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .order('order_index', { ascending: true })

    if (err) {
      setError(err.message)
      notify('Could not load habits.', 'error')
    } else {
      setHabits(data as Habit[])
    }

    setLoading(false)
  }, [user, notify])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function addHabit(input: HabitInput) {
    if (!user) return

    const { data: lastHabit } = await supabase
      .from('habits')
      .select('order_index')
      .eq('user_id', user.id)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextOrder = (lastHabit?.order_index ?? -1) + 1

    const { error: err } = await supabase.from('habits').insert({
      ...input,
      user_id: user.id,
      order_index: nextOrder,
    })

    if (err) {
      notify('Could not create habit.', 'error')
      throw err
    }

    notify('Habit created.')
    await refresh()
  }

  async function updateHabit(id: string, input: Partial<HabitInput>) {
    const { error: err } = await supabase
      .from('habits')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (err) {
      notify('Could not update habit.', 'error')
      throw err
    }

    notify('Habit updated.')
    await refresh()
  }

  async function reorderHabits(orderedIds: string[]) {
    if (!user || orderedIds.length < 2) return

    const current = [...habits].sort(
      (a, b) => a.order_index - b.order_index,
    )

    const selected = new Set(orderedIds)

    // Keep every non-selected habit exactly where it was.
    // Replace only the selected slots with the new selected order.
    const selectedSlots = current
      .map((habit, index) => (selected.has(habit.id) ? index : -1))
      .filter((index) => index !== -1)

    if (selectedSlots.length !== orderedIds.length) return

    const next = [...current]

    selectedSlots.forEach((slot, index) => {
      const habit = current.find((h) => h.id === orderedIds[index])
      if (habit) next[slot] = habit
    })

    const changed = next.filter(
      (habit, index) => habit.order_index !== index,
    )

    setHabits(
      next.map((habit, index) => ({
        ...habit,
        order_index: index,
      })),
    )

    const updates = changed.map((habit) =>
      supabase
        .from('habits')
        .update({
          order_index: next.findIndex((h) => h.id === habit.id),
          updated_at: new Date().toISOString(),
        })
        .eq('id', habit.id)
        .eq('user_id', user.id),
    )

    const results = await Promise.all(updates)
    const failed = results.find((result) => result.error)

    if (failed?.error) {
      await refresh()
      notify('Could not reorder habits.', 'error')
      throw failed.error
    }
  }

  async function setActive(id: string, active: boolean) {
    await updateHabitSilent(id, { active })
    notify(active ? 'Habit reactivated.' : 'Habit deactivated.')
  }

  async function setArchived(id: string, archived: boolean) {
    await updateHabitSilent(id, { archived })
    notify(archived ? 'Habit archived.' : 'Habit restored from archive.')
  }

  async function updateHabitSilent(id: string, patch: Partial<Habit>) {
    const { error: err } = await supabase
      .from('habits')
      .update({
        ...patch,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (err) {
      notify('Could not update habit.', 'error')
      throw err
    }

    await refresh()
  }

  async function deleteHabit(id: string) {
    const { error: err } = await supabase
      .from('habits')
      .delete()
      .eq('id', id)

    if (err) {
      notify('Could not delete habit.', 'error')
      throw err
    }

    notify('Habit deleted.')
    await refresh()
  }

  async function seedDefaults() {
    const { error: err } = await supabase.rpc('seed_default_habits')

    if (err) {
      notify('Could not load starter habits.', 'error')
      throw err
    }

    notify('Starter habits loaded.')
    await refresh()
  }

  return {
    habits,
    loading,
    error,
    refresh,
    addHabit,
    updateHabit,
    reorderHabits,
    setActive,
    setArchived,
    deleteHabit,
    seedDefaults,
  }
}
