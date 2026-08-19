import { useMemo } from 'react'
import { formatDuration } from '../lib/utils'
import type { FocusSession } from '../types'

function timeOnly(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes()
  ).padStart(2, '0')}`
}

export function DayDetail({
  sessions,
  selectedDate,
}: {
  sessions: FocusSession[]
  selectedDate: Date | null
}) {
  const daySessions = useMemo(() => {
    if (!selectedDate) return []
    const key = selectedDate.toDateString()
    return sessions
      .filter((s) => new Date(s.started_at).toDateString() === key)
      .sort((a, b) => a.started_at.localeCompare(b.started_at))
  }, [sessions, selectedDate])

  const totalSeconds = daySessions.reduce(
    (sum, s) => sum + s.duration_sec,
    0
  )

  if (!selectedDate) {
    return (
      <div className="glass flex flex-1 items-center justify-center rounded-2xl p-4 text-[13px] text-muted-foreground">
        选择一天查看详情
      </div>
    )
  }

  const dateLabel = `${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日`

  return (
    <div className="glass flex-1 overflow-auto rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[14px] font-semibold">{dateLabel}</h3>
        <span className="text-[13px] text-muted-foreground tabular-nums">
          共 {formatDuration(totalSeconds)}
        </span>
      </div>
      {daySessions.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">无专注记录</p>
      ) : (
        <div className="space-y-2">
          {daySessions.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between text-[13px]"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="shrink-0 text-muted-foreground tabular-nums">
                  {timeOnly(s.started_at)}
                </span>
                <span className="truncate">{s.intent || '工作'}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="tabular-nums text-muted-foreground">
                  {formatDuration(s.duration_sec)}
                </span>
                <span
                  className={
                    s.completed
                      ? 'text-green-500'
                      : 'text-muted-foreground'
                  }
                >
                  {s.completed ? '✓' : '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
