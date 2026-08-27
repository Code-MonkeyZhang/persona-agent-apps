import type { Phase, TimerState } from './types'
import type { TKey } from './i18n/locales'

export const PHASE_LABELS: Record<Phase, TKey> = {
  idle: 'phase.idle',
  focus: 'phase.focus',
  short_break: 'phase.short_break',
  long_break: 'phase.long_break',
}

/** Compute the total duration in seconds for the current phase. */
export function totalSeconds(state: TimerState): number {
  const { phase, settings } = state
  if (phase === 'focus') return settings.focus_min * 60
  if (phase === 'short_break') return settings.break_min * 60
  if (phase === 'long_break') return settings.break_min * 3 * 60
  return settings.focus_min * 60
}
