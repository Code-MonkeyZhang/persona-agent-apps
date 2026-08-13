import { motion, useReducedMotion } from 'motion/react'
import type { Transition } from 'motion/react'
import { Check, Minus, X } from 'lucide-react'
import type { GameHistory, RoundResult, Winner } from '../types'
import { MoveIcon } from './MoveIcon'
import { cn } from '../lib/utils'

const STATUS: Record<string, { label: string; tone: string }> = {
  user: { label: '你赢', tone: 'text-primary' },
  agent: { label: '你输', tone: 'text-destructive' },
  draw: { label: '中途结束', tone: 'text-muted-foreground' },
}

const ROUND_ICON: Record<RoundResult, typeof Check> = {
  user_win: Check,
  agent_win: X,
  draw: Minus,
}

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]

function statusOf(winner: Winner | null) {
  if (winner === 'user') return STATUS.user
  if (winner === 'agent') return STATUS.agent
  return STATUS.draw
}

export function History({ history }: { history: GameHistory[] }) {
  const reduce = useReducedMotion()
  return (
    <details className="rounded-lg bg-card p-3">
      <summary className="cursor-pointer text-sm font-medium text-foreground">
        历史记录{history.length > 0 && ` · ${history.length} 场`}
      </summary>
      <div className="mt-3 flex flex-col gap-2">
        {history.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground">暂无记录</div>
        ) : (
          history.map((g, i) => {
            const s = statusOf(g.winner)
            // Stagger only the initial group entrance; items are keyed by
            // gameId so existing rows never re-animate — a newly appended row
            // just fades in on its own (no whole-list re-stagger on update).
            const transition: Transition = reduce
              ? { duration: 0.2, ease: EASE_OUT }
              : { duration: 0.28, ease: EASE_OUT, delay: Math.min(i * 0.04, 0.16) }
            return (
              <motion.div
                key={g.gameId}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={transition}
                className="rounded-md border border-border p-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium tabular-nums text-foreground">
                    {g.userScore} : {g.agentScore}
                  </span>
                  <span className={cn('text-xs font-medium', s.tone)}>
                    {s.label}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {g.rounds.map((r, idx) => {
                    const RI = ROUND_ICON[r.result]
                    return (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-muted-foreground"
                      >
                        <MoveIcon move={r.userMove} className="h-3 w-3" />
                        <MoveIcon move={r.agentMove} className="h-3 w-3" />
                        <RI className="h-3 w-3" />
                      </span>
                    )
                  })}
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </details>
  )
}
