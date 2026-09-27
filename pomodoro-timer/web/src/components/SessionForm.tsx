import { useState } from 'react'
import { Play } from 'lucide-react'
import { Stepper } from './Stepper'
import { useI18n } from '../i18n'
import type { SessionConfig } from '../types'

/** Idle-state form that configures and starts one full session. */
export function SessionForm({
  initialConfig,
  onStart,
}: {
  initialConfig: SessionConfig
  onStart: (intent: string, config: SessionConfig) => void
}) {
  const { t } = useI18n()
  const [config, setConfig] = useState<SessionConfig>(initialConfig)
  const [intent, setIntent] = useState('')

  const patch = (part: Partial<SessionConfig>) =>
    setConfig((current) => ({ ...current, ...part }))

  const start = () => {
    onStart(intent.trim(), config)
    setIntent('')
  }

  return (
    <div className="flex flex-1 items-center pb-24">
      <div className="glass flex w-full flex-col gap-4 rounded-2xl p-5">
        <div className="flex flex-col gap-1">
          <Stepper
            label={t('form.focusMin')}
            unit={t('form.minutes')}
            value={config.focus_min}
            min={1}
            max={90}
            onChange={(v) => patch({ focus_min: v })}
          />
          <Stepper
            label={t('form.breakMin')}
            unit={t('form.minutes')}
            value={config.break_min}
            min={1}
            max={30}
            onChange={(v) => patch({ break_min: v })}
          />
          <Stepper
            label={t('form.rounds')}
            unit={t('form.roundsUnit')}
            value={config.rounds}
            min={1}
            max={8}
            onChange={(v) => patch({ rounds: v })}
          />
        </div>

        <input
          type="text"
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && start()}
          placeholder={t('timer.intentPlaceholder')}
          className="rounded-xl border border-border bg-card px-4 py-3 text-[14px] outline-none placeholder:text-muted-foreground"
        />

        <button
          onClick={start}
          className="press flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-[14px] font-medium text-primary-foreground"
        >
          <Play className="h-4 w-4" />
          {t('timer.start')}
        </button>
      </div>
    </div>
  )
}
