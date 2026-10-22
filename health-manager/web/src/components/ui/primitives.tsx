import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '../../i18n'

/** iOS grouped-table section header. */
export function SectionLabel({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'px-1 pb-1.5 text-[13px] font-normal text-muted-foreground',
        className
      )}
      {...props}
    />
  )
}

/** White rounded container holding a stack of rows. */
export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'mb-5 overflow-hidden rounded-xl bg-card text-card-foreground',
        className
      )}
      {...props}
    />
  )
}

export interface RowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Render a bottom divider. Set false on the last row of a group. */
  bordered?: boolean
}

/** A single label/value line inside a Card. Clickable when onClick is passed. */
export const Row = React.forwardRef<HTMLDivElement, RowProps>(
  ({ className, bordered = true, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex min-h-12 items-center justify-between gap-2 px-4 py-3.5 text-base mobile:px-4 mobile:py-4 mobile:min-h-[52px]',
        bordered && 'border-b border-border',
        props.onClick && 'cursor-pointer press',
        className
      )}
      {...props}
    />
  )
)
Row.displayName = 'Row'

/** Right chevron used on drill-in rows. */
export function Chevron({ className }: { className?: string }) {
  return (
    <ChevronRight
      className={cn('ml-0.5 size-5 text-[#c7c7cc]', className)}
      strokeWidth={2.5}
    />
  )
}

/**
 * Card wrapping a recharts chart with a header row holding a label and an
 * optional action, a fixed-height canvas, and an optional footer row.
 */
export function ChartCard({
  title,
  action,
  footer,
  children,
}: {
  title?: string
  action?: React.ReactNode
  footer?: React.ReactNode
  children: React.ReactNode
}) {
  const { t } = useI18n()
  return (
    <div className="mb-5 rounded-xl bg-card px-4 pb-3 pt-3.5">
      <div className="flex items-center justify-between pb-1.5">
        <SectionLabel className="px-0 pb-0">{title ?? t('common.trend')}</SectionLabel>
        {action}
      </div>
      <div className="h-[200px] w-full mobile:h-[180px]">{children}</div>
      {footer}
    </div>
  )
}

/** Tappable card tile (Apple-Health style) used by summary and ability lists. */
export const Tile = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      'flex w-full cursor-pointer flex-col items-start gap-0.5 rounded-xl border-none bg-card p-3.5 text-left press mobile:p-4',
      className
    )}
    {...props}
  />
))
Tile.displayName = 'Tile'

/** Small tappable tile: a tinted icon box over a label, used for entry grids. */
export function IconTile({
  icon: Icon,
  tint,
  label,
  onClick,
  className,
}: {
  icon: LucideIcon
  tint: string
  label: string
  onClick: () => void
  className?: string
}) {
  return (
    <button
      className={cn(
        'press flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-none bg-card py-3.5',
        className
      )}
      onClick={onClick}
    >
      <span
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-[10px]',
          tint
        )}
      >
        <Icon size={19} strokeWidth={2} />
      </span>
      <span className="text-[13px] font-medium">{label}</span>
    </button>
  )
}
