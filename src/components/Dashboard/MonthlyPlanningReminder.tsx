import { Card } from '@/components/ui/Card'
import { monthLabel } from '@/utils/date'
import { MonthlyPlanning } from '@/hooks/useMonthlyPlanning'

export function MonthlyPlanningReminder({
  year,
  month,
  planning,
}: {
  year: number
  month: number
  planning: MonthlyPlanning | null
}) {
  return (
    <Card
      title="Monthly Planning"
      subtitle={monthLabel(year, month)}
    >
      {planning?.content ? (
        <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
          {planning.content}
        </p>
      ) : (
        <p className="text-sm text-ink-faint">
          No monthly planning yet.
        </p>
      )}
    </Card>
  )
}