import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold',
  {
    variants: {
      variant: {
        warn: 'bg-red-100 text-red-500',
        notice: 'bg-indigo-100 text-indigo-500',
        success: 'bg-green-100 text-green-600',
        info: 'bg-muted text-muted-foreground',
      },
    },
    defaultVariants: { variant: 'info' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
