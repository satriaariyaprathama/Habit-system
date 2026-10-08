import { useState } from 'react'
import { Habit, Frequency, TimeOfDay, DEFAULT_CATEGORIES } from '@/types'
import { HabitInput, useHabits } from '@/hooks/useHabits'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Button, Field, inputClass } from '@/components/ui/Form'
import { todayISO } from '@/utils/date'

const FREQUENCIES: Frequency[] = ['daily', 'weekly', 'monthly']
const TIMES: TimeOfDay[] = ['morning', 'afternoon', 'night', 'flexible']

const emptyForm: HabitInput = {
  display_code: '',
  habit_name: '',
  frequency: 'daily',
  category: DEFAULT_CATEGORIES[0],
  time_of_day: 'flexible',
  start_date: todayISO(),
  end_date: null,
  active: true,
}

export function HabitManager({
  onOpenHabit,
}: {
  onOpenHabit: (habit: Habit) => void
}) {
  const {
    habits,
    addHabit,
    updateHabit,setActive,
    setArchived,
    deleteHabit,
    seedDefaults,
  } = useHabits()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Habit | null>(null)
  const [form, setForm] = useState<HabitInput>(emptyForm)
  const [confirmDelete, setConfirmDelete] = useState<Habit | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  function openAdd() {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(habit: Habit) {
    setEditing(habit)

    setForm({
      display_code: habit.display_code,
      habit_name: habit.habit_name,
      frequency: habit.frequency,
      category: habit.category,
      time_of_day: habit.time_of_day,
      start_date: habit.start_date,
      end_date: habit.end_date,
      active: habit.active,
    })

    setModalOpen(true)
  }

  async function handleSubmit() {
    if (!form.habit_name.trim()) return

    if (editing) {
      await updateHabit(editing.id, form)
    } else {
      await addHabit(form)
    }

    setModalOpen(false)
  }

  const visible = habits
    .filter((h) => (showArchived ? h.archived : !h.archived))
    .sort((a, b) => a.order_index - b.order_index)


  return (
    <Card
      title="Manage Habits"
      subtitle="Add, edit, reorder, or retire habits. History is never deleted when you deactivate or archive."
      action={<Button onClick={openAdd}>Add Habit</Button>}
    >
      <div className="mb-3 flex items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => setShowArchived(false)}
          className={`rounded-sm px-2.5 py-1 ${
            !showArchived
              ? 'bg-moss-100 text-moss-700'
              : 'text-ink-faint'
          }`}
        >
          Active & Inactive
        </button>

        <button
          type="button"
          onClick={() => setShowArchived(true)}
          className={`rounded-sm px-2.5 py-1 ${
            showArchived
              ? 'bg-moss-100 text-moss-700'
              : 'text-ink-faint'
          }`}
        >
          Archived
        </button>
      </div>

      {visible.length === 0 ? (
        <div className="text-sm text-ink-faint">
          <p>Nothing here yet.</p>

          {!showArchived && habits.length === 0 && (
            <Button
              variant="ghost"
              className="mt-3"
              onClick={seedDefaults}
            >
              Load the 27 starter habits
            </Button>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-line/70">
          {visible.map((habit) => (
  <li
    key={habit.id}    className="flex flex-wrap items-center justify-between gap-2 py-3"
  >
    <div className="flex min-w-0 items-center gap-3">

      <button
        type="button"
        onClick={() => onOpenHabit(habit)}
        className="min-w-0 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="mr-2 inline-flex h-6 min-w-6 items-center justify-center rounded border border-line bg-paper-dim px-1.5 text-xs font-semibold text-ink-faint">{visible.indexOf(habit) + 1}</span><span className="text-ink">{habit.habit_name}
          </span>

          {!habit.active && (
            <span className="rounded-sm bg-paper-dim px-1.5 py-0.5 text-xs text-ink-faint">
              Inactive
            </span>
          )}
        </div>

        <div className="text-xs text-ink-faint capitalize">
          {habit.frequency} · {habit.category} · {habit.time_of_day}
        </div>
      </button>
    </div>

    <div className="flex flex-wrap gap-1.5">
      <Button
        variant="ghost"
        onClick={() => openEdit(habit)}
      >
        Edit
      </Button>

      {!habit.archived && (
        <Button
          variant="ghost"
          onClick={() => setActive(habit.id, !habit.active)}
        >
          {habit.active ? 'Deactivate' : 'Reactivate'}
        </Button>
      )}

      <Button
        variant="ghost"
        onClick={() => setArchived(habit.id, !habit.archived)}
      >
        {habit.archived ? 'Unarchive' : 'Archive'}
      </Button>

      <Button
        variant="danger"
        onClick={() => setConfirmDelete(habit)}
      >
        Delete
      </Button>
    </div>
  </li>
))}
        </ul>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Habit' : 'Add Habit'}
      >
        <Field label="Habit name">
          <input
            className={inputClass()}
            value={form.habit_name}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                habit_name: e.target.value,
              }))
            }
            placeholder="e.g. Morning Run"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Frequency">
            <select
              className={inputClass()}
              value={form.frequency}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  frequency: e.target.value as Frequency,
                }))
              }
            >
              {FREQUENCIES.map((f) => (
                <option
                  key={f}
                  value={f}
                  className="capitalize"
                >
                  {f[0].toUpperCase() + f.slice(1)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Time of day">
            <select
              className={inputClass()}
              value={form.time_of_day}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  time_of_day: e.target.value as TimeOfDay,
                }))
              }
            >
              {TIMES.map((t) => (
                <option key={t} value={t}>
                  {t[0].toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field
          label="Category"
          hint="Describes function, not time of day."
        >
          <input
            className={inputClass()}
            list="category-options"
            value={form.category}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                category: e.target.value,
              }))
            }
          />

          <datalist id="category-options">
            {DEFAULT_CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date">
            <input
              type="date"
              className={inputClass()}
              value={form.start_date}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  start_date: e.target.value,
                }))
              }
            />
          </Field>

          <Field
            label="End date"
            hint="optional"
          >
            <input
              type="date"
              className={inputClass()}
              value={form.end_date ?? ''}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  end_date: e.target.value || null,
                }))
              }
            />
          </Field>
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => setModalOpen(false)}
          >
            Cancel
          </Button>

          <Button onClick={handleSubmit}>
            {editing ? 'Save Changes' : 'Create Habit'}
          </Button>
        </div>
      </Modal>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete this habit?"
      >
        <p className="text-sm text-ink-soft">
          This permanently deletes{' '}
          <strong>{confirmDelete?.habit_name}</strong> and all of
          its history. This can't be undone. If you just want to
          stop tracking it while keeping the history, use Archive
          instead.
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => setConfirmDelete(null)}
          >
            Cancel
          </Button>

          <Button
            variant="danger"
            onClick={async () => {
              if (confirmDelete) {
                await deleteHabit(confirmDelete.id)
              }

              setConfirmDelete(null)
            }}
          >
            Delete Permanently
          </Button>
        </div>
      </Modal>
    </Card>
  )
}









