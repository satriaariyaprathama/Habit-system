import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button, inputClass } from '@/components/ui/Form'
import { useMonthlyReview } from '@/hooks/useMonthlyReview'
import { monthLabel } from '@/utils/date'

export function MonthlyReview({ year, month }: { year: number; month: number }) {
  const { review, loading, save } = useMonthlyReview(year, month)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setDraft(review?.content ?? '')
  }, [review, year, month])

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
    <Card title="Monthly Review" subtitle={monthLabel(year, month)}>
      <textarea
        className={`${inputClass()} min-h-[100px] resize-y`}
        placeholder="How did this month go overall?"
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
