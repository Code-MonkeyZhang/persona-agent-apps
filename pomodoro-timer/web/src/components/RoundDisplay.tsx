import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { TimerState } from '../types'

export function RoundDisplay({
  state,
  onAdjustRounds,
}: {
  state: TimerState
  onAdjustRounds?: (delta: number) => void
}) {
  const current = state.focus_count_in_round + 1
  const total = state.settings.focus_per_round
  const isIdle = state.phase === 'idle'

  if (isIdle) {
    return (
      <div className="flex items-center justify-center gap-3 py-2 text-[20px] font-bold tabular-nums">
        {onAdjustRounds && (
          <button
            onClick={() => onAdjustRounds(-1)}
            className="press text-muted-foreground pointer-fine:hover:text-foreground"
            disabled={total <= 2}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <span className="text-foreground">{total}</span>
        {onAdjustRounds && (
          <button
            onClick={() => onAdjustRounds(1)}
            className="press text-muted-foreground pointer-fine:hover:text-foreground"
            disabled={total >= 8}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center gap-2 py-2 text-[18px] font-bold tabular-nums">
      <span className="text-foreground">{current}</span>
      <span className="text-muted-foreground">/</span>
      <span className="text-muted-foreground">{total}</span>
    </div>
  )
}
