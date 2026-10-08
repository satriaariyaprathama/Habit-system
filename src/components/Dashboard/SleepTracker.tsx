import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button, Field, inputClass } from '@/components/ui/Form'
import { useSleep } from '@/hooks/useSleep'

const TARGET_MIN = 7 * 60
const TARGET_MAX = 8 * 60

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}

export function SleepTracker({ dateISO }: { dateISO: string }) {
  const { sleepLog, loading, save } = useSleep(dateISO)
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [bedtime, setBedtime] = useState('')
  const [wakeTime, setWakeTime] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (sleepLog) {
      setHours(String(Math.floor(sleepLog.duration_minutes / 60)))
      setMinutes(String(sleepLog.duration_minutes % 60))
      setBedtime(sleepLog.bedtime ?? '')
      setWakeTime(sleepLog.wake_time ?? '')
    } else {
      setHours('')
      setMinutes('')
      setBedtime('')
      setWakeTime('')
    }
  }, [sleepLog, dateISO])

  const totalMinutes = (Number(hours) || 0) * 60 + (Number(minutes) || 0)
  const indicator =
    totalMinutes === 0
      ? null
      : totalMinutes < TARGET_MIN
        ? { label: 'Below target', tone: 'text-clay-500' }
        : totalMinutes > TARGET_MAX
          ? { label: 'Above target', tone: 'text-amber-600' }
          : { label: 'Within target', tone: 'text-moss-600' }

  async function handleSave() {
    if (!totalMinutes) return
    setSaving(true)
    try {
      await save({
        duration_minutes: totalMinutes,
        bedtime: bedtime || null,
        wake_time: wakeTime || null,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card title="Sleep" subtitle="Target: 7–8 hours">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Hours">
          <input
            type="number"
            min={0}
            max={24}
            className={inputClass()}
            value={hours}
            disabled={loading}
            onChange={(e) => setHours(e.target.value)}
          />
        </Field>
        <Field label="Minutes">
          <input
            type="number"
            min={0}
            max={59}
            className={inputClass()}
            value={minutes}
            disabled={loading}
            onChange={(e) => setMinutes(e.target.value)}
          />
        </Field>
        <Field label="Bedtime" hint="optional">
          <input
            type="time"
            className={inputClass()}
            value={bedtime}
            disabled={loading}
            onChange={(e) => setBedtime(e.target.value)}
          />
        </Field>
        <Field label="Wake time" hint="optional">
          <input
            type="time"
            className={inputClass()}
            value={wakeTime}
            disabled={loading}
            onChange={(e) => setWakeTime(e.target.value)}
          />
        </Field>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-sm">
          {totalMinutes > 0 && (
            <>
              <span className="font-display text-lg text-ink">
                {formatDuration(totalMinutes)}
              </span>
              {indicator && (
                <span className={`ml-2 text-xs font-medium ${indicator.tone}`}>
                  {indicator.label}
                </span>
              )}
            </>
          )}
        </div>
        <Button onClick={handleSave} disabled={!totalMinutes || saving}>
          {saving ? 'Saving…' : 'Save Sleep'}
        </Button>
      </div>
    </Card>
  )
}
