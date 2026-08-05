import type { GameState } from '../types'
import { EMOJI, RESULT_LABEL } from '../constants'

interface Props {
  state: GameState | null
  onRematch: () => void
  onStartGame: () => void
}

/**
 * State-driven result area — the heart of the UI. Renders one of five
 * shapes based on the server's match state:
 * 1. no game        → waiting prompt
 * 2. awaiting move  → "出招吧！"
 * 3. agent thinking → user's emoji + spinner text
 * 4. round result   → emoji VS emoji + verdict (incl. draw replay)
 * 5. match over     → final score + verdict + rematch button
 */
export function ResultArea({ state, onRematch, onStartGame }: Props) {
  // 1. 无游戏
  if (!state) {
    return (
      <div className="result-area">
        <button className="rematch-btn" onClick={onStartGame}>
          👊 开始游戏
        </button>
      </div>
    )
  }

  // 5. 整场结束
  if (state.gameOver) {
    const userWin = state.winner === 'user'
    return (
      <div className="result-area">
        <div className="match-over">
          <div
            className={`match-verdict ${
              userWin ? 'result-user_win' : 'result-agent_win'
            }`}
          >
            {userWin ? '🎉 你赢了整场！' : '🤖 Agent 赢了整场！'}
          </div>
          <div className="match-score">
            {state.userScore} - {state.agentScore}
          </div>
          <button className="rematch-btn" onClick={onRematch}>
            🔄 再来一局
          </button>
        </div>
      </div>
    )
  }

  // 3. Agent 思考中
  if (state.waitingForAgent) {
    return (
      <div className="result-area">
        <span className="move-emoji">
          {state.lastUserMove ? EMOJI[state.lastUserMove] : '?'}
        </span>
        <span className="waiting-text">🤖 Agent 思考中...</span>
      </div>
    )
  }

  // 4. 有上一局结果（含平局重出）
  if (state.lastResult) {
    const u = state.lastUserMove ? EMOJI[state.lastUserMove] : '?'
    const a = state.lastAgentMove ? EMOJI[state.lastAgentMove] : '?'
    return (
      <div className="result-area">
        <span className="move-emoji">{u}</span>
        <span className="move-vs">VS</span>
        <span className="move-emoji">{a}</span>
        <span className={`result-text result-${state.lastResult}`}>
          {RESULT_LABEL[state.lastResult]}
          {state.lastResult === 'draw' ? '（重出）' : ''}
        </span>
      </div>
    )
  }

  // 2. 等用户出招（新比赛 / 新一局）
  return (
    <div className="result-area">
      <span className="waiting-text">👊 出招吧！</span>
    </div>
  )
}
