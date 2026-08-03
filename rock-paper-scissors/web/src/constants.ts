import type { Move } from './types'

export const EMOJI: Record<Move, string> = {
  rock: '✊',
  paper: '✋',
  scissors: '✌️',
}

export const RESULT_LABEL: Record<string, string> = {
  user_win: '你赢',
  agent_win: 'Agent赢',
  draw: '平局',
}

export const MOVES: { move: Move; emoji: string; label: string }[] = [
  { move: 'rock', emoji: '✊', label: '石头' },
  { move: 'scissors', emoji: '✌️', label: '剪刀' },
  { move: 'paper', emoji: '✋', label: '布' },
]
