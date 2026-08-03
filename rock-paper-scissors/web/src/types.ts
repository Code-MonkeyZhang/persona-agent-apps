// Shared types — mirror the WS protocol defined by the Python server.

export type Move = 'rock' | 'paper' | 'scissors'
export type RoundResult = 'user_win' | 'agent_win' | 'draw'
export type Winner = 'user' | 'agent'

export interface GameState {
  gameId: string
  roundNo: number
  userScore: number
  agentScore: number
  lastUserMove: Move | null
  lastAgentMove: Move | null
  lastResult: RoundResult | null
  waitingForAgent: boolean
  gameOver: boolean
  winner: Winner | null
}

export interface Round {
  roundNo: number
  userMove: Move
  agentMove: Move
  result: RoundResult
}

export interface GameHistory {
  gameId: string
  startedAt: string
  endedAt: string | null
  userScore: number
  agentScore: number
  winner: Winner | null
  rounds: Round[]
}

export interface ServerMessage {
  type: 'init' | 'update'
  state: GameState | null
  history: GameHistory[]
}
