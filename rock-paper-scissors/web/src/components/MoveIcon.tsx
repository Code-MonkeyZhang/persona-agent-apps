import { MOVE_ICON } from '../constants'
import type { Move } from '../types'
import { cn } from '../lib/utils'

/** 渲染某个出招的 Lucide 图标；move 为空时显示占位问号。 */
export function MoveIcon({
  move,
  className,
}: {
  move: Move | null
  className?: string
}) {
  if (!move) {
    return (
      <span className={cn('font-semibold text-muted-foreground', className)}>
        ?
      </span>
    )
  }
  const Icon = MOVE_ICON[move]
  return <Icon className={className} />
}
