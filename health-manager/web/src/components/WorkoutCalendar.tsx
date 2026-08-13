import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'

interface Props {
  caloriesByDate: Record<string, number>
  onSelectDate: (date: string) => void
}

/** Local YYYY-MM-DD from a Date, avoiding UTC off-by-one. */
function toDateStr(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** Month-view calendar with green dots on workout days. Tapping a workout
 *  day pushes into its detail; rest days are inert. */
export function WorkoutCalendar({ caloriesByDate, onSelectDate }: Props) {
  return (
    <Calendar
      locale="zh-CN"
      calendarType="iso8601"
      maxDate={new Date()}
      maxDetail="month"
      minDetail="month"
      next2Label={null}
      prev2Label={null}
      formatDay={(_locale, date) => String(date.getDate())}
      tileClassName="press"
      tileContent={({ date, view }) => {
        if (view !== 'month') return null
        const cal = caloriesByDate[toDateStr(date)]
        if (!cal) return null
        return (
          <span className="mx-auto mt-0.5 block size-1.5 rounded-full bg-[#30a14e]" />
        )
      }}
      onClickDay={(date) => {
        const dateStr = toDateStr(date)
        if (caloriesByDate[dateStr]) {
          onSelectDate(dateStr)
        }
      }}
    />
  )
}
