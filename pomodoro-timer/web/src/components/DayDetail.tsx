import { useMemo } from 'react'
import { formatDuration } from '../lib/utils'
import { useI18n } from '../i18n'
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
  const { t, locale } = useI18n()
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
        {t('dayDetail.selectPrompt')}
      </div>
    )
  }

  const dateLabel = new Intl.DateTimeFormat(locale, {
    month: 'long',
    day: 'numeric',
  }).format(selectedDate)

  return (
    <div className="glass flex-1 overflow-auto rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[14px] font-semibold">{dateLabel}</h3>
        <span className="text-[13px] text-muted-foreground tabular-nums">
          {t('dayDetail.total', {
            duration: formatDuration(totalSeconds, t),
          })}
        </span>
      </div>
      {daySessions.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">
          {t('dayDetail.empty')}
        </p>
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
                <span className="truncate">
                  {s.intent || t('dayDetail.defaultIntent')}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {s.round_total > 1 && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground tabular-nums">
                    {s.round_index}/{s.round_total}
                  </span>
                )}
                <span className="tabular-nums text-muted-foreground">
                  {formatDuration(s.duration_sec, t)}
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
