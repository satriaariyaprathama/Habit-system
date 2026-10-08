import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button, inputClass } from '@/components/ui/Form'
import { useMonthlyPlanning } from '@/hooks/useMonthlyPlanning'
import { monthLabel } from '@/utils/date'

export function MonthlyPlanning({
  year,
  month,
}: {
  year: number
  month: number
}) {
  const { planning, loading, save } = useMonthlyPlanning(year, month)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setDraft(planning?.content ?? '')
  }, [planning, year, month])

  const dirty = draft !== (planning?.content ?? '')

  async function handleSave() {
    setSaving(true)
    try {
      await save(draft)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card title="Monthly Planning" subtitle={monthLabel(year, month)}>
      <textarea
        className={`${inputClass()} min-h-[100px] resize-y`}
        placeholder="What do you want to focus on this month?"
        value={draft}
        disabled={loading}
        onChange={(e) => setDraft(e.target.value)}
      />

      <div className="mt-3 flex justify-end">
        <Button onClick={handleSave} disabled={!dirty || saving}>
          {saving ? 'Saving…' : 'Save Planning'}
        </Button>
      </div>
    </Card>
  )
}