import * as React from 'react'
import * as SwitchPrimitives from '@radix-ui/react-switch'
import { cn } from '@/lib/utils'

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      'inline-flex h-[26px] w-[44px] shrink-0 cursor-pointer items-center rounded-full bg-border transition-colors focus-visible:outline-none data-[state=checked]:bg-primary',
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb className="pointer-events-none block h-[22px] w-[22px] rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-[20px] data-[state=unchecked]:translate-x-[2px]" />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
