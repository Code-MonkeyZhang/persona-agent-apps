import type { LucideIcon } from 'lucide-react'
import { Dumbbell, HeartPulse, Stethoscope, UtensilsCrossed } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Tab } from '../types'
import { useI18n } from '../i18n'
import type { TKey } from '../i18n/locales'

interface Props {
  active: Tab
  onSelect: (tab: Tab) => void
}

const TABS: { key: Tab; label: TKey; icon: LucideIcon }[] = [
  { key: 'summary', label: 'tab.summary', icon: HeartPulse },
  { key: 'diet', label: 'tab.diet', icon: UtensilsCrossed },
  { key: 'fitness', label: 'tab.fitness', icon: Dumbbell },
  { key: 'disease', label: 'tab.disease', icon: Stethoscope },
]

export function TabBar({ active, onSelect }: Props) {
  const { t } = useI18n()
  return (
    <nav className="flex border-t border-border bg-card pb-[calc(6px+env(safe-area-inset-bottom))] pt-1.5">
      {TABS.map((tab) => {
        const Icon = tab.icon
        const on = active === tab.key
        return (
          <button
            key={tab.key}
            className={cn(
              'press flex flex-1 cursor-pointer flex-col items-center gap-0.5 border-none bg-none py-1.5 font-inherit mobile:py-2',
              on ? 'text-primary' : 'text-muted-foreground'
            )}
            onClick={() => onSelect(tab.key)}
          >
            <Icon className="size-[22px] mobile:size-6" strokeWidth={2} />
            <span className="text-[11px]">{t(tab.label)}</span>
          </button>
        )
      })}
    </nav>
  )
}
