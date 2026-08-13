import { Calendar } from './Calendar'
import { DayDetail } from './DayDetail'
import type { FocusSession } from '../types'

export function HistoryView({
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
  return (
    <div className="flex flex-1 flex-col gap-3">
      <Calendar
        sessions={sessions}
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
        onMonthChange={onMonthChange}
      />
      <DayDetail sessions={sessions} selectedDate={selectedDate} />
    </div>
  )
}
