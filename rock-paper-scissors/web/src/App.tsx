import { useGameState } from './useGameState'
import { ScoreBar } from './components/ScoreBar'
import { ResultArea } from './components/ResultArea'
import { MoveButtons } from './components/MoveButtons'
import { History } from './components/History'

export default function App() {
  const { state, history, sendMove, requestRematch } = useGameState()
  return (
    <div className="app">
      <ScoreBar state={state} />
      <ResultArea state={state} onRematch={requestRematch} />
      <MoveButtons state={state} onMove={sendMove} />
      <History history={history} />
    </div>
  )
}
