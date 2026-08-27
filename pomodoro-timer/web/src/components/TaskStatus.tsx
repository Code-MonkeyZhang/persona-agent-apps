import type { TimerState } from '../types'
import { useI18n } from '../i18n'

export function TaskStatus({ state }: { state: TimerState }) {
  const { t } = useI18n()
  let text: string | null = null

  if (state.phase === 'idle') {
    text = null
  } else if (!state.running) {
    text = t('status.paused')
  } else if (state.phase === 'focus') {
    text = state.intent
      ? t('status.intent', { intent: state.intent })
      : t('status.focusing')
  } else {
    text = t('status.resting')
  }

  if (!text) return null

  return (
    <div className="text-center text-[15px] font-medium text-muted-foreground">
      {text}
    </div>
  )
}
