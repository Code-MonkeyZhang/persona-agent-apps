import type { GameState, Move } from '../types'
import { MOVES } from '../constants'

interface Props {
  state: GameState | null
  onMove: (move: Move) => void
}

export function MoveButtons({ state, onMove }: Props) {
  const enabled = !!state && !state.gameOver && !state.waitingForAgent
  return (
    <div className="buttons">
      {MOVES.map((m) => (
        <button
          key={m.move}
          className="move-btn"
          disabled={!enabled}
          onClick={() => onMove(m.move)}
        >
          <span>{m.emoji}</span>
          <span className="move-btn-label">{m.label}</span>
        </button>
      ))}
    </div>
  )
}
