import { useRef, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

export function TimeCircle({
  value,
  onChange,
  min,
  max,
  label,
  color,
}: {
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  label: string
  color: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))
  const inputRef = useRef<HTMLInputElement>(null)

  const startEdit = () => {
    setDraft(String(value))
    setEditing(true)
    requestAnimationFrame(() => inputRef.current?.select())
  }

  const commit = () => {
    const n = parseInt(draft, 10)
    if (!isNaN(n)) onChange(Math.max(min, Math.min(max, n)))
    setEditing(false)
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="press text-muted-foreground pointer-fine:hover:text-foreground"
        disabled={value >= max}
      >
        <ChevronUp className="h-5 w-5" />
      </button>
      <div
        className="relative flex h-24 w-24 cursor-text items-center justify-center rounded-full border-2"
        style={{ borderColor: color }}
        onClick={startEdit}
      >
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') setEditing(false)
            }}
            className="w-16 bg-transparent text-center text-2xl font-bold tabular-nums outline-none"
            style={{ color }}
          />
        ) : (
          <span
            className="text-2xl font-bold tabular-nums"
            style={{ color }}
          >
            {value}
          </span>
        )}
      </div>
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="press text-muted-foreground pointer-fine:hover:text-foreground"
        disabled={value <= min}
      >
        <ChevronDown className="h-5 w-5" />
      </button>
      <span className="text-[12px] text-muted-foreground">{label}</span>
    </div>
  )
}
