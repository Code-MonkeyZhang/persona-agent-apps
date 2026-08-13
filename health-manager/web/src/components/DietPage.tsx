import { useState } from 'react'
import type { DietState } from '../types'
import { dailyCalorieSeries, dayTotals, todayStr } from '../helpers'
import { NutritionSummary } from './NutritionSummary'
import { TrendChart } from './TrendChart'
import { MealList } from './MealList'
import { DietHistoryPage } from './DietHistoryPage'
import { Chevron, SectionLabel } from './ui/primitives'
import { Tabs, TabsList, TabsTrigger } from './ui/tabs'

interface Props {
  diet: DietState
}

type View = { name: 'main' } | { name: 'history' }
type Range = 'week' | 'month'

const RANGE_DAYS: Record<Range, number> = { week: 7, month: 30 }

/** Diet tab: today's nutrition summary + meal list + a calorie trend with a
 * week/month window toggle, drilling into a collapsible history list. */
export function DietPage({ diet }: Props) {
  const [view, setView] = useState<View>({ name: 'main' })
  const [range, setRange] = useState<Range>('week')

  if (view.name === 'history') {
    return <DietHistoryPage diet={diet} onBack={() => setView({ name: 'main' })} />
  }

  const today = todayStr()
  const todayEntries = diet.entries.filter((e) => e.date === today)
  const totals = dayTotals(diet.entries, today)
  const series = dailyCalorieSeries(diet.entries, RANGE_DAYS[range])

  console.debug('[diet] main view', {
    todayCalories: totals.calories,
    range,
    points: series.length,
  })

  return (
    <div>
      <div className="flex items-center pb-3 pt-2">
        <span className="text-[17px] font-semibold">饮食</span>
      </div>

      <NutritionSummary
        calories={totals.calories}
        goal={diet.goal}
        macros={{ carbs: totals.carbs, protein: totals.protein, fat: totals.fat }}
        macroGoals={diet.macroGoals}
      />

      <SectionLabel>今天吃了</SectionLabel>
      {todayEntries.length === 0 ? (
        <div className="px-5 py-10 text-center text-[15px] leading-relaxed text-muted-foreground">
          今天还没记录。跟 Agent 说"中午吃了牛肉面"试试。
        </div>
      ) : (
        <MealList entries={todayEntries} />
      )}

      {series.length > 0 && (
        <TrendChart
          data={series}
          color="#f59e0b"
          label="卡路里"
          unit="kcal"
          title="卡路里趋势"
          action={
            <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
              <TabsList className="h-7">
                <TabsTrigger value="week" className="px-2.5 py-1 text-xs">
                  周
                </TabsTrigger>
                <TabsTrigger value="month" className="px-2.5 py-1 text-xs">
                  月
                </TabsTrigger>
              </TabsList>
            </Tabs>
          }
          footer={
            <button
              onClick={() => setView({ name: 'history' })}
              className="press -mb-3 mt-2 flex w-full items-center justify-between border-t border-border py-3 text-base"
            >
              <span>查看历史</span>
              <Chevron />
            </button>
          }
        />
      )}
    </div>
  )
}
