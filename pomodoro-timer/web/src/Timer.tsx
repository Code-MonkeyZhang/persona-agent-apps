import { useEffect, useState } from 'react'
import { Play } from 'lucide-react'
import { Countdown } from './components/Countdown'
import { ControlButtons } from './components/ControlButtons'
import { HistoryView } from './components/HistoryView'
import { RoundDisplay } from './components/RoundDisplay'
import { TaskStatus } from './components/TaskStatus'
import { TimeCircle } from './components/TimeCircle'
import { useTimerState } from './useTimerState'
import { cn } from './lib/utils'

export function Timer({ className }: { className?: string }) {
  const {
    state,
    monthSessions,
    remainingSeconds,
    sendStart,
    sendPause,
    sendResume,
    sendStop,
    sendUpdateSettings,
    sendGetMonth,
  } = useTimerState()
  const [tab, setTab] = useState<'focus' | 'history'>('focus')
  const [intent, setIntent] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(() => {
    if (tab === 'history') {
      const now = new Date()
      sendGetMonth(now.getFullYear(), now.getMonth() + 1)
    }
  }, [tab, sendGetMonth])

  if (!state) return null

  const isIdle = state.phase === 'idle'

  const handleStart = () => {
    sendStart(intent.trim())
    setIntent('')
  }

  const handleAdjustRounds = (delta: number) => {
    sendUpdateSettings({
      ...state.settings,
      focus_per_round: Math.max(
        2,
        Math.min(8, state.settings.focus_per_round + delta)
      ),
    })
  }

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
          专注
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
          历史
        </button>
      </div>

      {tab === 'history' ? (
        <HistoryView
          sessions={monthSessions}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onMonthChange={sendGetMonth}
        />
      ) : (
        <>
          <RoundDisplay
            state={state}
            onAdjustRounds={isIdle ? handleAdjustRounds : undefined}
          />

          {isIdle ? (
            <>
              <div className="flex justify-center gap-8 py-2">
                <TimeCircle
                  value={state.settings.focus_min}
                  onChange={(v) =>
                    sendUpdateSettings({ ...state.settings, focus_min: v })
                  }
                  min={1}
                  max={90}
                  label="工作"
                  color="var(--primary)"
                />
                <TimeCircle
                  value={state.settings.break_min}
                  onChange={(v) =>
                    sendUpdateSettings({ ...state.settings, break_min: v })
                  }
                  min={1}
                  max={30}
                  label="休息"
                  color="var(--muted-foreground)"
                />
              </div>

              <input
                type="text"
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                placeholder="写一句话意图（可选）"
                className="glass rounded-xl px-4 py-3 text-[14px] outline-none placeholder:text-muted-foreground"
              />

              <button
                onClick={handleStart}
                className="press flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-[14px] font-medium text-primary-foreground"
              >
                <Play className="h-4 w-4" />
                开始专注
              </button>
            </>
          ) : (
            <>
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
        </>
      )}
    </div>
  )
}
