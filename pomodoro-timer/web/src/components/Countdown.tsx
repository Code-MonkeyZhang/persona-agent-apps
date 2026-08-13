import type { TimerState } from '../types'
import { totalSeconds } from '../constants'

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

  const total = totalSeconds(state)
  const progress = total > 0 ? remainingSeconds / total : 1
  const dashoffset = CIRCUMFERENCE * (1 - progress)

  const isFocus = state.phase === 'focus'
  const ringColor = isFocus ? 'var(--primary)' : 'var(--muted-foreground)'
  const textColor = state.phase === 'idle' ? 'text-muted-foreground' : 'text-foreground'

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
          <span
            className={`text-5xl font-bold tabular-nums tracking-tight ${textColor}`}
          >
            {timeStr}
          </span>
        </div>
      </div>
    </div>
  )
}
