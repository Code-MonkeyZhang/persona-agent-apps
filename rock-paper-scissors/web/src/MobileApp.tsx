import { useGameState } from './useGameState'
import { ScoreBar } from './components/ScoreBar'
import { ResultArea } from './components/ResultArea'
import { MoveButtons } from './components/MoveButtons'
import { History } from './components/History'

/**
 * 触屏版布局：比分 → 结果区（撑满居中）→ 大出招按钮 → 可折叠历史。
 * 复用桌面版同一套组件与 useGameState，仅靠 mobile.css 覆盖尺寸。
 */
export default function MobileApp() {
  const { state, history, sendMove, requestRematch, requestStartGame } = useGameState()
  return (
    <div className="mobile-app">
      <ScoreBar state={state} />
      <div className="mobile-stage">
        <ResultArea state={state} onRematch={requestRematch} onStartGame={requestStartGame} />
      </div>
      <MoveButtons state={state} onMove={sendMove} />
      <History history={history} />
    </div>
  )
}
