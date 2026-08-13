import { Pause, Play, Square } from 'lucide-react'
import { cn } from '../lib/utils'

export function ControlButtons({
  running,
  onPause,
  onResume,
  onStop,
}: {
  running: boolean
  onPause: () => void
  onResume: () => void
  onStop: () => void
}) {
  return (
    <div className="flex justify-center gap-3">
      <button
        onClick={running ? onPause : onResume}
        className={cn(
          'press flex items-center gap-2 rounded-xl px-6 py-3 text-[14px] font-medium',
          running
            ? 'border border-border bg-card text-foreground'
            : 'bg-primary text-primary-foreground'
        )}
      >
        {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        {running ? '暂停' : '继续'}
      </button>
      <button
        onClick={onStop}
        className="press flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-[14px] font-medium text-muted-foreground pointer-fine:hover:text-destructive"
      >
        <Square className="h-4 w-4" />
        停止
      </button>
    </div>
  )
}
