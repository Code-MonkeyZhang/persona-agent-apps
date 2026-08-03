import type { GameState } from '../types'

export function ScoreBar({ state }: { state: GameState | null }) {
  const meta = !state
    ? '等待开始'
    : state.gameOver
      ? '整场结束'
      : `第 ${state.roundNo} / 3 局`
  return (
    <div>
      <div className="score-bar">
        <div className="score-side">
          <div className="score-label">用户</div>
          <div className="score-value">{state?.userScore ?? 0}</div>
        </div>
        <div className="score-vs">VS</div>
        <div className="score-side">
          <div className="score-label">Agent</div>
          <div className="score-value">{state?.agentScore ?? 0}</div>
        </div>
      </div>
      <div className="score-meta">{meta}</div>
    </div>
  )
}
