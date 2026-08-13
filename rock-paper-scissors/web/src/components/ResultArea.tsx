import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { Transition } from 'motion/react'
import { Loader2, RotateCcw } from 'lucide-react'
import type { ReactNode } from 'react'
import type { GameState } from '../types'
import { RESULT_LABEL } from '../constants'
import { MoveIcon } from './MoveIcon'
import { cn } from '../lib/utils'

interface Props {
  state: GameState | null
  onRematch: () => void
  onStartGame: () => void
}

const PRIMARY_BTN =
  'press inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground pointer-fine:hover:opacity-90'

const RESULT_TONE: Record<string, string> = {
  user_win: 'text-primary',
  agent_win: 'text-destructive',
  draw: 'text-muted-foreground',
}

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]
const PHASE_TRANSITION: Transition = { duration: 0.22, ease: EASE_OUT }

/**
 * State-driven result area — the heart of the UI. Renders one of five shapes,
 * cross-faded between phases via AnimatePresence with mode="wait" so the old
 * phase fully exits before the new one enters (no overlapping states).
 * - no game        → 开始游戏 button
 * - awaiting move  → 出招提示
 * - agent thinking → user's move + spinner
 * - round result   → icon VS icon + verdict (draw replays)
 * - match over     → final verdict + score + 再来一局
 */
export function ResultArea({ state, onRematch, onStartGame }: Props) {
  const reduce = useReducedMotion()
  const phase = renderPhase(state, onRematch, onStartGame)

  return (
    <div className="flex min-h-[180px] flex-1 items-center justify-center rounded-2xl bg-card p-6 shadow-sm">
      <AnimatePresence mode="wait">
        <motion.div
          key={phase.key}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={PHASE_TRANSITION}
          className="flex flex-col items-center justify-center gap-3"
        >
          {phase.body}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function renderPhase(
  state: GameState | null,
  onRematch: () => void,
  onStartGame: () => void
): { key: string; body: ReactNode } {
  // 无游戏
  if (!state) {
    return {
      key: 'idle',
      body: (
        <button className={PRIMARY_BTN} onClick={onStartGame}>
          <MoveIcon move="rock" className="h-4 w-4" />
          开始游戏
        </button>
      ),
    }
  }

  // 整场结束
  if (state.gameOver) {
    // 中途结束（弃权）：无胜负
    if (state.winner === null) {
      return {
        key: 'over',
        body: (
          <>
            <div className="text-xl font-semibold text-muted-foreground">
              本局已结束
            </div>
            <div className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
              {state.userScore} - {state.agentScore}
            </div>
            <button className={PRIMARY_BTN} onClick={onRematch}>
              <RotateCcw className="h-4 w-4" />
              再来一局
            </button>
          </>
        ),
      }
    }
    const userWin = state.winner === 'user'
    return {
      key: 'over',
      body: (
        <>
          <div
            className={cn(
              'text-xl font-semibold',
              userWin ? 'text-primary' : 'text-destructive'
            )}
          >
            {userWin ? '你赢了整场！' : 'Agent 赢了整场！'}
          </div>
          <div className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
            {state.userScore} - {state.agentScore}
          </div>
          <button className={PRIMARY_BTN} onClick={onRematch}>
            <RotateCcw className="h-4 w-4" />
            再来一局
          </button>
        </>
      ),
    }
  }

  // Agent 思考中
  if (state.waitingForAgent) {
    return {
      key: 'thinking',
      body: (
        <>
          <MoveIcon
            move={state.lastUserMove}
            className="h-14 w-14 text-foreground"
          />
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Agent 思考中...
          </span>
        </>
      ),
    }
  }

  // 有上一局结果（含平局重出）
  if (state.lastResult) {
    return {
      key: 'result',
      body: (
        <>
          <div className="flex items-center gap-4">
            <MoveIcon
              move={state.lastUserMove}
              className="h-12 w-12 text-foreground"
            />
            <span className="text-xs font-medium text-muted-foreground">VS</span>
            <MoveIcon
              move={state.lastAgentMove}
              className="h-12 w-12 text-foreground"
            />
          </div>
          <span
            className={cn('text-sm font-medium', RESULT_TONE[state.lastResult])}
          >
            {RESULT_LABEL[state.lastResult]}
            {state.lastResult === 'draw' ? '（重出）' : ''}
          </span>
        </>
      ),
    }
  }

  // 等用户出招（新比赛 / 新一局）
  return {
    key: 'awaiting',
    body: <span className="text-sm text-muted-foreground">出招吧！</span>,
  }
}
