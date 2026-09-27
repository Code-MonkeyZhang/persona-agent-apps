import type { Phase } from './types'
import type { TKey } from './i18n/locales'

export const PHASE_LABELS: Record<Phase, TKey> = {
  idle: 'phase.idle',
  focus: 'phase.focus',
  break: 'phase.break',
}
