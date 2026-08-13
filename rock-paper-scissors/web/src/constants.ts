import { HandFist, Hand, Scissors } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Move, RoundResult } from './types'

/** 每种出招对应的 Lucide 图标。 */
export const MOVE_ICON: Record<Move, LucideIcon> = {
  rock: HandFist,
  paper: Hand,
  scissors: Scissors,
}

export const RESULT_LABEL: Record<RoundResult, string> = {
  user_win: '你赢',
  agent_win: 'Agent赢',
  draw: '平局',
}

export const MOVES: { move: Move; label: string }[] = [
  { move: 'rock', label: '石头' },
  { move: 'scissors', label: '剪刀' },
  { move: 'paper', label: '布' },
]
