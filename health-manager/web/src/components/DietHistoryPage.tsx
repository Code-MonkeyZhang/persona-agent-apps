import { useState } from 'react'
import type { DietState } from '../types'
import type { DietEntry } from '../types'
import { caloriesByDate, dayTotals, formatDateCn } from '../helpers'
import { MACROS } from '../macroMeta'
import { DetailHeader } from './DetailHeader'
import { MealList } from './MealList'
import { Card, Row, SectionLabel } from './ui/primitives'
import { cn } from '@/lib/utils'

interface Props {
  diet: DietState
  onBack: () => void
}

/**
 * Diet history: a single collapsible list of recorded days. Per Apple-style
 * simplification there is no separate trend chart here — the main diet tab owns
 * the only one. Tapping a day expands its meals and macro totals inline.
 */
export function DietHistoryPage({ diet, onBack }: Props) {
  const [open, setOpen] = useState<string | null>(null)

  const totals = caloriesByDate(diet.entries)
  const byDate = new Map<string, DietEntry[]>()
  for (const e of diet.entries) {
    const list = byDate.get(e.date) ?? []
    list.push(e)
    byDate.set(e.date, list)
  }
  const dates = [...byDate.keys()].sort((a, b) => b.localeCompare(a))

  const all = Object.values(totals)
  const avg = all.length ? Math.round(all.reduce((s, v) => s + v, 0) / all.length) : 0

  console.debug('[diet] history view', { days: dates.length, avg })

  return (
    <div>
      <DetailHeader title="饮食历史" onBack={onBack} />

      <SectionLabel>每日记录 · 日均 {avg} kcal</SectionLabel>
      {dates.length === 0 ? (
        <div className="px-5 py-10 text-center text-[15px] leading-relaxed text-muted-foreground">
          还没有饮食记录。
        </div>
      ) : (
        dates.map((date) => {
          const entries = byDate.get(date)!
          const expanded = open === date
          const dayMacro = dayTotals(diet.entries, date)
          return (
            <Card key={date} className="mb-3">
              <Row bordered={false} onClick={() => setOpen(expanded ? null : date)}>
                <div className="flex flex-col">
                  <span>{formatDateCn(date)}</span>
                  <span className="flex flex-wrap items-center gap-x-2 text-[12px] text-muted-foreground">
                    {MACROS.map(({ key, label, color }) => (
                      <span key={key} className="flex items-center gap-1">
                        <span
                          className="inline-block size-1.5 rounded-full"
                          style={{ background: color }}
                        />
                        {label} {dayMacro[key]}g
                      </span>
                    ))}
                  </span>
                </div>
                <span className="flex items-center font-medium">
                  {totals[date]} kcal
                  <span
                    className={cn(
                      'ml-1 text-xl font-light text-[#c7c7cc] transition-transform',
                      expanded && 'rotate-90'
                    )}
                  >
                    ›
                  </span>
                </span>
              </Row>
              {expanded && (
                <div className="px-1 pb-1 pt-1">
                  <MealList entries={entries} />
                </div>
              )}
            </Card>
          )
        })
      )}
    </div>
  )
}
