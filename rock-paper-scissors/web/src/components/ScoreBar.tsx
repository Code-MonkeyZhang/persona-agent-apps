import NumberFlow from '@number-flow/react'
import type { GameState } from '../types'
import { useI18n } from '../i18n'
import { LangToggle } from './LangToggle'

export function ScoreBar({
  state,
  onEnd,
}: {
  state: GameState | null
  onEnd: () => void
}) {
  const { t } = useI18n()
  const meta = !state
    ? t('score.waiting')
    : state.gameOver
      ? t('score.finished')
      : t('score.round', { n: state.roundNo })
  const canEnd = !!state && !state.gameOver

  return (
    <div className="glass relative rounded-2xl p-4">
      <LangToggle className="absolute left-3 top-3" />
      {canEnd && (
        <button
          onClick={onEnd}
          className="press absolute right-3 top-3 text-xs text-muted-foreground pointer-fine:hover:text-destructive"
        >
          {t('score.endGame')}
        </button>
      )}
      <div className="flex items-center justify-around">
        <ScoreSide label={t('score.user')} value={state?.userScore ?? 0} />
        <span className="text-xs font-medium text-muted-foreground">VS</span>
        <ScoreSide label={t('score.agent')} value={state?.agentScore ?? 0} />
      </div>
      <div className="mt-2 text-center text-xs text-muted-foreground">
        {meta}
      </div>
    </div>
  )
}

function ScoreSide({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <NumberFlow
        value={value}
        className="text-2xl font-semibold tabular-nums tracking-tight text-foreground"
      />
    </div>
  )
}
