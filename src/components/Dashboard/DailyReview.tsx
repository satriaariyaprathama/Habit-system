import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button, inputClass } from '@/components/ui/Form'
import { useDailyReview } from '@/hooks/useDailyReview'
import { formatDisplayDate } from '@/utils/date'

export function DailyReview({ dateISO }: { dateISO: string }) {
  const { review, loading, save } = useDailyReview(dateISO)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setDraft(review?.content ?? '')
  }, [review, dateISO])

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
      title="Daily Review"
      subtitle={formatDisplayDate(dateISO)}
      className="h-full"
    >
      <textarea
        className={`${inputClass()} min-h-[110px] resize-y`}
        placeholder="How did today go overall?"
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