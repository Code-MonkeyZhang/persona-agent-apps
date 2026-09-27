import { useEffect, useState } from 'react'
import { Countdown } from './components/Countdown'
import { ControlButtons } from './components/ControlButtons'
import { HistoryView } from './components/HistoryView'
import { LangToggle } from './components/LangToggle'
import { RoundDisplay } from './components/RoundDisplay'
import { SessionForm } from './components/SessionForm'
import { TaskStatus } from './components/TaskStatus'
import { useI18n } from './i18n'
import { useTimerState } from './useTimerState'
import { cn } from './lib/utils'

export function Timer({ className }: { className?: string }) {
  const { t } = useI18n()
  const {
    state,
    monthSessions,
    remainingSeconds,
    sendStart,
    sendPause,
    sendResume,
    sendStop,
    sendGetMonth,
  } = useTimerState()
  const [tab, setTab] = useState<'focus' | 'history'>('focus')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(() => {
    if (tab === 'history') {
      const now = new Date()
      sendGetMonth(now.getFullYear(), now.getMonth() + 1)
    }
  }, [tab, sendGetMonth])

  if (!state) return null

  const isIdle = state.phase === 'idle'

  return (
    <div
      className={cn(
        'flex min-h-screen flex-col gap-3 bg-background p-4',
        className
      )}
    >
      <div className="flex gap-1 rounded-xl bg-muted/50 p-1">
        <button
          onClick={() => setTab('focus')}
          className={cn(
            'flex-1 rounded-lg py-2 text-[14px] font-medium transition-colors',
            tab === 'focus'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground'
          )}
        >
          {t('tab.focus')}
        </button>
        <button
          onClick={() => setTab('history')}
          className={cn(
            'flex-1 rounded-lg py-2 text-[14px] font-medium transition-colors',
            tab === 'history'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground'
          )}
        >
          {t('tab.history')}
        </button>
        <LangToggle className="shrink-0 px-2" />
      </div>

      {tab === 'history' ? (
        <HistoryView
          sessions={monthSessions}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onMonthChange={sendGetMonth}
        />
      ) : isIdle ? (
        <SessionForm initialConfig={state.config} onStart={sendStart} />
      ) : (
        <>
          <RoundDisplay state={state} />
          <Countdown state={state} remainingSeconds={remainingSeconds} />
          <TaskStatus state={state} />
          <ControlButtons
            running={state.running}
            onPause={sendPause}
            onResume={sendResume}
            onStop={sendStop}
          />
        </>
      )}
    </div>
  )
}
