import { Minus, Plus } from 'lucide-react'

/** Numeric row with minus and plus buttons, clamped to its range. */
export function Stepper({
  label,
  unit,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  unit: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[14px] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="press pointer-fine:hover:text-foreground flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground disabled:opacity-40"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-24 text-center text-[18px] font-bold tabular-nums">
          {value}
          <span className="ml-1 text-[12px] font-normal text-muted-foreground">
            {unit}
          </span>
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="press pointer-fine:hover:text-foreground flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
