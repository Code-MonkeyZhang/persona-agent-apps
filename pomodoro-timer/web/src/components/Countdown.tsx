import type { TimerState } from '../types'

const RADIUS = 120
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function Countdown({
  state,
  remainingSeconds,
}: {
  state: TimerState
  remainingSeconds: number
}) {
  const mins = Math.floor(remainingSeconds / 60)
  const secs = remainingSeconds % 60
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  // The server sends the real phase total; never derive it from config.
  // Clamping keeps the ring full if the two ever disagree.
  const total = state.phase_total_seconds
  const progress = total > 0 ? Math.min(1, remainingSeconds / total) : 1
  const dashoffset = CIRCUMFERENCE * (1 - progress)

  const isFocus = state.phase === 'focus'
  const ringColor = isFocus ? 'var(--primary)' : 'var(--muted-foreground)'

  return (
    <div className="flex items-center justify-center py-6">
      <div className="relative h-[280px] w-[280px]">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 280 280">
          <circle
            cx="140"
            cy="140"
            r={RADIUS}
            fill="none"
            stroke="var(--muted)"
            strokeWidth="10"
          />
          <circle
            cx="140"
            cy="140"
            r={RADIUS}
            fill="none"
            stroke={ringColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashoffset}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl font-bold tabular-nums tracking-tight text-foreground">
            {timeStr}
          </span>
        </div>
      </div>
    </div>
  )
}
