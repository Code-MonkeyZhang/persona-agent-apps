import type { LucideIcon } from 'lucide-react'
import { Dumbbell, HeartPulse, Stethoscope, UtensilsCrossed } from 'lucide-react'
import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'
import type { Tab } from '../types'
import { useI18n } from '../i18n'
import type { TKey } from '../i18n/locales'

const TABS: { key: Tab; label: TKey; icon: LucideIcon }[] = [
  { key: 'summary', label: 'tab.summary', icon: HeartPulse },
  { key: 'diet', label: 'tab.diet', icon: UtensilsCrossed },
  { key: 'fitness', label: 'tab.fitness', icon: Dumbbell },
  { key: 'disease', label: 'tab.disease', icon: Stethoscope },
]

/** Bottom tab bar as router links; the active tab derives from the URL. */
export function TabBar() {
  const { t } = useI18n()
  return (
    <nav className="flex border-t border-border bg-card pb-[calc(6px+env(safe-area-inset-bottom))] pt-1.5">
      {TABS.map((tab) => {
        const Icon = tab.icon
        return (
          <NavLink
            key={tab.key}
            to={`/${tab.key}`}
            className={({ isActive }) =>
              cn(
                'press flex flex-1 cursor-pointer flex-col items-center gap-0.5 border-none bg-none py-1.5 font-inherit mobile:py-2',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )
            }
          >
            <Icon className="size-[22px] mobile:size-6" strokeWidth={2} />
            <span className="text-[11px]">{t(tab.label)}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
