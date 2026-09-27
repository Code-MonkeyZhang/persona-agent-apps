import { PHASE_LABELS } from '../constants'
import type { TimerState } from '../types'
import { useI18n } from '../i18n'

/** Running-state header showing round progress and the phase label. */
export function RoundDisplay({ state }: { state: TimerState }) {
  const { t } = useI18n()
  return (
    <div className="flex items-center justify-center gap-2 py-2 text-[15px] font-medium text-muted-foreground">
      <span className="tabular-nums">
        {t('round.progress', {
          current: state.round_current,
          total: state.round_total,
        })}
      </span>
      <span>·</span>
      <span>{t(PHASE_LABELS[state.phase])}</span>
    </div>
  )
}
