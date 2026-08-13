import type { GameState, Move } from '../types'
import { MOVES } from '../constants'
import { MoveIcon } from './MoveIcon'
import { cn } from '../lib/utils'

interface Props {
  state: GameState | null
  onMove: (move: Move) => void
}

export function MoveButtons({ state, onMove }: Props) {
  const enabled = !!state && !state.gameOver && !state.waitingForAgent
  return (
    <div className="flex justify-center gap-3">
      {MOVES.map((m) => (
        <button
          key={m.move}
          disabled={!enabled}
          onClick={() => onMove(m.move)}
          className={cn(
            'press flex w-20 flex-col items-center gap-1.5 rounded-lg border border-border bg-card py-3 text-sm mobile:w-24 mobile:py-4',
            enabled ? 'pointer-fine:hover:bg-muted' : 'cursor-not-allowed opacity-40'
          )}
        >
          <MoveIcon move={m.move} className="h-7 w-7 text-foreground" />
          <span className="text-muted-foreground">{m.label}</span>
        </button>
      ))}
    </div>
  )
}
