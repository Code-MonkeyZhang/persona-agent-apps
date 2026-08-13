import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { FocusSession } from '../types'
import { cn } from '../lib/utils'

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']
const RING_R = 15

export function Calendar({
  sessions,
  selectedDate,
  onSelectDate,
  onMonthChange,
}: {
  sessions: FocusSession[]
  selectedDate: Date | null
  onSelectDate: (date: Date) => void
  onMonthChange: (year: number, month: number) => void
}) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const sessionsByDay = useMemo(() => {
    const map = new Map<string, FocusSession[]>()
    for (const s of sessions) {
      const key = new Date(s.started_at).toDateString()
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(s)
    }
    return map
  }, [sessions])

  const firstDay = new Date(viewYear, viewMonth, 1)
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const leadingBlanks = (firstDay.getDay() + 6) % 7

  const cells: (number | null)[] = []
  for (let i = 0; i < leadingBlanks; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const shiftMonth = (delta: number) => {
    let m = viewMonth + delta
    let y = viewYear
    if (m < 0) {
      m = 11
      y--
    } else if (m > 11) {
      m = 0
      y++
    }
    setViewMonth(m)
    setViewYear(y)
    onMonthChange(y, m + 1)
  }

  return (
    <div>
      <div className="flex items-center justify-between px-1 py-2">
        <button
          onClick={() => shiftMonth(-1)}
          className="press text-muted-foreground pointer-fine:hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-[15px] font-semibold">
          {viewYear}年{viewMonth + 1}月
        </span>
        <button
          onClick={() => shiftMonth(1)}
          className="press text-muted-foreground pointer-fine:hover:text-foreground"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="py-1 text-center text-[11px] text-muted-foreground"
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} className="h-10" />

          const date = new Date(viewYear, viewMonth, day)
          const key = date.toDateString()
          const hasSessions = sessionsByDay.has(key)
          const isToday = key === today.toDateString()
          const isSelected = selectedDate?.toDateString() === key

          return (
            <div key={i} className="flex h-10 items-center justify-center">
              <button
                onClick={() => onSelectDate(date)}
                className="relative flex h-9 w-9 items-center justify-center"
              >
                {hasSessions && (
                  <svg className="absolute inset-0" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r={RING_R}
                      fill="none"
                      stroke={
                        isSelected
                          ? 'var(--primary)'
                          : 'var(--primary)'
                      }
                      strokeWidth="2"
                    />
                  </svg>
                )}
                <span
                  className={cn(
                    'relative text-[13px] tabular-nums',
                    isToday && 'font-bold text-primary',
                    !isToday && !hasSessions && 'text-muted-foreground',
                    isSelected && 'font-bold'
                  )}
                >
                  {day}
                </span>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
