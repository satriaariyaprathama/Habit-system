import { useDateContext } from '@/context/DateContext'

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function MonthYearSelector() {
  const { year, month, setYear, setMonth, goToToday } = useDateContext()

  function stepMonth(delta: number) {
    let m = month + delta
    let y = year
    if (m < 1) {
      m = 12
      y -= 1
    } else if (m > 12) {
      m = 1
      y += 1
    }
    setMonth(m)
    setYear(y)
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => stepMonth(-1)}
        aria-label="Previous month"
        className="rounded-sm border border-line px-2 py-1 text-ink-soft hover:bg-paper-dim"
      >
        ‹
      </button>
      <select
        value={month}
        onChange={(e) => setMonth(Number(e.target.value))}
        aria-label="Month"
        className="rounded-sm border border-line bg-paper px-2 py-1 text-sm text-ink"
      >
        {MONTH_NAMES.map((name, idx) => (
          <option key={name} value={idx + 1}>
            {name}
          </option>
        ))}
      </select>
      <select
        value={year}
        onChange={(e) => setYear(Number(e.target.value))}
        aria-label="Year"
        className="rounded-sm border border-line bg-paper px-2 py-1 text-sm text-ink"
      >
        {Array.from({ length: 9 }, (_, i) => year - 5 + i).map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => stepMonth(1)}
        aria-label="Next month"
        className="rounded-sm border border-line px-2 py-1 text-ink-soft hover:bg-paper-dim"
      >
        ›
      </button>
      <button
        type="button"
        onClick={goToToday}
        className="ml-1 hidden rounded-sm border border-line px-2 py-1 text-xs text-ink-soft hover:bg-paper-dim sm:block"
      >
        Today
      </button>
    </div>
  )
}
