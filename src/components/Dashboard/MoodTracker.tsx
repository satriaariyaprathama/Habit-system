import { Card } from '@/components/ui/Card'
import { useMood } from '@/hooks/useMood'
import { Mood, MOOD_META } from '@/types'

const MOODS = Object.keys(MOOD_META) as Mood[]

export function MoodTracker({ dateISO }: { dateISO: string }) {
  const { moodLog, setMood } = useMood(dateISO)

  return (
    <Card
      title="Mood"
      subtitle="Optional — how did today feel overall?"
      className="h-full"
    >
      <div className="flex flex-wrap gap-2">
        {MOODS.map((m) => {
          const meta = MOOD_META[m]
          const active = moodLog?.mood === m

          return (
            <button
              key={m}
              type="button"
              onClick={() => setMood(m)}
              className={`flex flex-1 min-w-[5.5rem] flex-col items-center gap-1 rounded-sm border py-2.5 text-sm transition-colors ${
                active
                  ? 'border-moss-600 bg-moss-50 text-moss-700'
                  : 'border-line text-ink-soft hover:bg-paper-dim'
              }`}
            >
              <span className="text-xl leading-none">
                {meta.emoji}
              </span>

              {meta.label}
            </button>
          )
        })}
      </div>
    </Card>
  )
}
