import type { Phase, TimerState } from './types'

export const PHASE_LABELS: Record<Phase, string> = {
  idle: '空闲',
  focus: '专注',
  short_break: '短休息',
  long_break: '长休息',
}

/** Compute the total duration in seconds for the current phase. */
export function totalSeconds(state: TimerState): number {
  const { phase, settings } = state
  if (phase === 'focus') return settings.focus_min * 60
  if (phase === 'short_break') return settings.break_min * 60
  if (phase === 'long_break') return settings.break_min * 3 * 60
  return settings.focus_min * 60
}
