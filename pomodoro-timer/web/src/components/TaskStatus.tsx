import type { TimerState } from '../types'

export function TaskStatus({ state }: { state: TimerState }) {
  let text: string | null = null

  if (state.phase === 'idle') {
    text = null
  } else if (!state.running) {
    text = '已暂停'
  } else if (state.phase === 'focus') {
    text = state.intent ? `在${state.intent}中` : '专注中'
  } else {
    text = '休息中'
  }

  if (!text) return null

  return (
    <div className="text-center text-[15px] font-medium text-muted-foreground">
      {text}
    </div>
  )
}
