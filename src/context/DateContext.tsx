import { createContext, useContext, useMemo, useState, ReactNode } from 'react'
import { currentYearMonth } from '@/utils/date'

interface DateContextValue {
  year: number
  month: number // 1-12
  setYear: (y: number) => void
  setMonth: (m: number) => void
  goToToday: () => void
}

const DateContext = createContext<DateContextValue | null>(null)

export function DateProvider({ children }: { children: ReactNode }) {
  const initial = currentYearMonth()
  const [year, setYear] = useState(initial.year)
  const [month, setMonth] = useState(initial.month)

  const value = useMemo(
    () => ({
      year,
      month,
      setYear,
      setMonth,
      goToToday: () => {
        const now = currentYearMonth()
        setYear(now.year)
        setMonth(now.month)
      },
    }),
    [year, month],
  )

  return <DateContext.Provider value={value}>{children}</DateContext.Provider>
}

export function useDateContext() {
  const ctx = useContext(DateContext)
  if (!ctx) throw new Error('useDateContext must be used within DateProvider')
  return ctx
}
