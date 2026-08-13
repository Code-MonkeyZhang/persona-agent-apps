import type { LucideIcon } from 'lucide-react'
import { Dumbbell, HeartPulse, Stethoscope, UtensilsCrossed } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Tab } from '../types'

interface Props {
  active: Tab
  onSelect: (tab: Tab) => void
}

const TABS: { key: Tab; label: string; icon: LucideIcon }[] = [
  { key: 'summary', label: '摘要', icon: HeartPulse },
  { key: 'diet', label: '饮食', icon: UtensilsCrossed },
  { key: 'fitness', label: '健身', icon: Dumbbell },
  { key: 'disease', label: '疾病', icon: Stethoscope },
]

export function TabBar({ active, onSelect }: Props) {
  return (
    <nav className="flex border-t border-border bg-card pb-[calc(6px+env(safe-area-inset-bottom))] pt-1.5">
      {TABS.map((t) => {
        const Icon = t.icon
        const on = active === t.key
        return (
          <button
            key={t.key}
            className={cn(
              'press flex flex-1 cursor-pointer flex-col items-center gap-0.5 border-none bg-none py-1.5 font-inherit mobile:py-2',
              on ? 'text-primary' : 'text-muted-foreground'
            )}
            onClick={() => onSelect(t.key)}
          >
            <Icon className="size-[22px] mobile:size-6" strokeWidth={2} />
            <span className="text-[11px]">{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
