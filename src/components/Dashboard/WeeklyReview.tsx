import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button, inputClass } from '@/components/ui/Form'
import { useWeeklyReview } from '@/hooks/useWeeklyReview'
import { weekendPeriodsInMonth, formatDisplayDate } from '@/utils/date'

interface WeeklyReviewProps {
  year: number
  month: number
}

export function WeeklyReview({ year, month }: WeeklyReviewProps) {
  const periods = weekendPeriodsInMonth(year, month)
  const [selected, setSelected] = useState(periods[0]?.start ?? '')

  useEffect(() => {
    if (!periods.find((p) => p.start === selected)) {
      setSelected(periods[0]?.start ?? '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month])

  const period = periods.find((p) => p.start === selected) ?? periods[0]

  if (!period) return null

  return <WeeklyReviewInner period={period} periods={periods} selected={selected} setSelected={setSelected} />
}

function WeeklyReviewInner({
  period,
  periods,
  selected,
  setSelected,
}: {
  period: { start: string; end: string; label: string }
  periods: { start: string; end: string; label: string }[]
  selected: string
  setSelected: (v: string) => void
}) {
  const { review, loading, save } = useWeeklyReview(period.start, period.end)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setDraft(review?.content ?? '')
  }, [review, period.start])

  const dirty = draft !== (review?.content ?? '')

  async function handleSave() {
    setSaving(true)
    try {
      await save(draft)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card
      title="Weekly Review"
      subtitle={`${formatDisplayDate(period.start)} – ${formatDisplayDate(period.end)}`}
      action={
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="rounded-sm border border-line bg-paper px-2 py-1 text-sm text-ink"
        >
          {periods.map((p) => (
            <option key={p.start} value={p.start}>
              {p.label}
            </option>
          ))}
        </select>
      }
    >
      <textarea
        className={`${inputClass()} min-h-[100px] resize-y`}
        placeholder="How did this week go overall?"
        value={draft}
        disabled={loading}
        onChange={(e) => setDraft(e.target.value)}
      />
      <div className="mt-3 flex justify-end">
        <Button onClick={handleSave} disabled={!dirty || saving}>
          {saving ? 'Saving…' : 'Save Review'}
        </Button>
      </div>
    </Card>
  )
}
