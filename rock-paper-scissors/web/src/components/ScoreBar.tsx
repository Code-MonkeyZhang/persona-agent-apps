import NumberFlow from '@number-flow/react'
import type { GameState } from '../types'

export function ScoreBar({
  state,
  onEnd,
}: {
  state: GameState | null
  onEnd: () => void
}) {
  const meta = !state
    ? '等待开始'
    : state.gameOver
      ? '整场结束'
      : `第 ${state.roundNo} / 3 局`
  const canEnd = !!state && !state.gameOver

  return (
    <div className="glass relative rounded-2xl p-4">
      {canEnd && (
        <button
          onClick={onEnd}
          className="press absolute right-3 top-3 text-xs text-muted-foreground pointer-fine:hover:text-destructive"
        >
          结束游戏
        </button>
      )}
      <div className="flex items-center justify-around">
        <ScoreSide label="用户" value={state?.userScore ?? 0} />
        <span className="text-xs font-medium text-muted-foreground">VS</span>
        <ScoreSide label="Agent" value={state?.agentScore ?? 0} />
      </div>
      <div className="mt-2 text-center text-xs text-muted-foreground">
        {meta}
      </div>
    </div>
  )
}

function ScoreSide({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <NumberFlow
        value={value}
        className="text-2xl font-semibold tabular-nums tracking-tight text-foreground"
      />
    </div>
  )
}
