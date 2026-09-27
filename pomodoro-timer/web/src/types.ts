export type Phase = 'idle' | 'focus' | 'break'

export interface SessionConfig {
  focus_min: number
  break_min: number
  rounds: number
}

export interface TimerState {
  phase: Phase
  running: boolean
  ends_at: number | null
  remaining_seconds: number
  phase_total_seconds: number
  intent: string
  round_current: number
  round_total: number
  config: SessionConfig
}

export interface FocusSession {
  id: number
  started_at: string
  ended_at: string
  duration_sec: number
  intent: string
  completed: number
  agent_id: string
  session_id: string
  round_index: number
  round_total: number
}

export interface Stats {
  today_count: number
  today_seconds: number
  week_count: number
  week_seconds: number
}
