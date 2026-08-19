export type Phase = 'idle' | 'focus' | 'short_break' | 'long_break'

export interface TimerSettings {
  focus_min: number
  break_min: number
  focus_per_round: number
}

export interface TimerState {
  phase: Phase
  running: boolean
  ends_at: number | null
  remaining_seconds: number
  intent: string
  focus_count_in_round: number
  settings: TimerSettings
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
}

export interface Stats {
  today_count: number
  today_seconds: number
  week_count: number
  week_seconds: number
}
