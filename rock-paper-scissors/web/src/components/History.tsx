import type { GameHistory } from '../types'
import { EMOJI } from '../constants'

export function History({ history }: { history: GameHistory[] }) {
  return (
    <div className="history-section">
      <div className="history-title">历史记录</div>
      {history.length === 0 ? (
        <div className="history-empty">暂无记录</div>
      ) : (
        history.map((g) => {
          let status: string
          let cls: string
          if (g.winner === 'user') {
            status = '你赢'
            cls = 'game-status-win'
          } else if (g.winner === 'agent') {
            status = '你输'
            cls = 'game-status-lose'
          } else {
            status = '中途结束'
            cls = 'game-status-draw'
          }
          return (
            <div className="history-game" key={g.gameId}>
              <div className="game-header">
                <span className="game-score">
                  {g.userScore} : {g.agentScore}
                </span>
                <span className={cls}>{status}</span>
              </div>
              <div className="rounds-list">
                {g.rounds.map((r, i) => (
                  <span className="round-badge" key={i}>
                    {EMOJI[r.userMove]}vs{EMOJI[r.agentMove]}
                    {r.result === 'user_win'
                      ? '✓'
                      : r.result === 'agent_win'
                        ? '✗'
                        : '='}
                  </span>
                ))}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
