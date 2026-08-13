import { useGameState } from './useGameState'
import { ScoreBar } from './components/ScoreBar'
import { ResultArea } from './components/ResultArea'
import { MoveButtons } from './components/MoveButtons'
import { History } from './components/History'

/**
 * 游戏主体：比分条 → 结果区（撑满居中）→ 出招按钮 → 可折叠历史。
 * 桌面与移动端共用，移动端通过外层 .mobile-app 类做尺寸覆盖。
 */
export function Game({ className = '' }: { className?: string }) {
  const { state, history, sendMove, requestRematch, requestStartGame, requestEndGame } =
    useGameState()
  return (
    <div
      className={`flex min-h-screen flex-col gap-3 bg-background p-4 ${className}`}
    >
      <ScoreBar state={state} onEnd={requestEndGame} />
      <ResultArea
        state={state}
        onRematch={requestRematch}
        onStartGame={requestStartGame}
      />
      <MoveButtons state={state} onMove={sendMove} />
      <History history={history} />
    </div>
  )
}
