import { HandFist, Hand, Scissors } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Move, RoundResult } from './types'
import type { TKey } from './i18n/locales'

/** 每种出招对应的 Lucide 图标。 */
export const MOVE_ICON: Record<Move, LucideIcon> = {
  rock: HandFist,
  paper: Hand,
  scissors: Scissors,
}

export const RESULT_LABEL: Record<RoundResult, TKey> = {
  user_win: 'result.user_win',
  agent_win: 'result.agent_win',
  draw: 'result.draw',
}

export const MOVES: { move: Move; label: TKey }[] = [
  { move: 'rock', label: 'move.rock' },
  { move: 'scissors', label: 'move.scissors' },
  { move: 'paper', label: 'move.paper' },
]
