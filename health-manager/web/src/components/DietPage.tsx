import { useState } from 'react'
import type { DietState } from '../types'
import { dailyCalorieSeries, dayTotals, todayStr } from '../helpers'
import { useI18n } from '../i18n'
import { useDrill } from '@/lib/router'
import { NutritionSummary } from './NutritionSummary'
import { TrendChart } from './TrendChart'
import { MealList } from './MealList'
import { Chevron, SectionLabel } from './ui/primitives'
import { Tabs, TabsList, TabsTrigger } from './ui/tabs'

interface Props {
  diet: DietState
}

type Range = 'week' | 'month'

const RANGE_DAYS: Record<Range, number> = { week: 7, month: 30 }

/** Diet tab: today's nutrition summary + meal list + a calorie trend with a
 * week/month window toggle, drilling into a collapsible history list. */
export function DietPage({ diet }: Props) {
  const { t } = useI18n()
  const drill = useDrill()
  const [range, setRange] = useState<Range>('week')

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
        <span className="text-[17px] font-semibold">{t('diet.title')}</span>
      </div>

      <NutritionSummary
        calories={totals.calories}
        goal={diet.goal}
        macros={{ carbs: totals.carbs, protein: totals.protein, fat: totals.fat }}
        macroGoals={diet.macroGoals}
      />

      <SectionLabel>{t('diet.todayEats')}</SectionLabel>
      {todayEntries.length === 0 ? (
        <div className="px-5 py-10 text-center text-[15px] leading-relaxed text-muted-foreground">
          {t('diet.emptyToday')}
        </div>
      ) : (
        <MealList entries={todayEntries} />
      )}

      {series.length > 0 && (
        <TrendChart
          data={series}
          color="#f59e0b"
          label={t('diet.calories')}
          unit="kcal"
          title={t('diet.calorieTrend')}
          action={
            <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
              <TabsList className="h-7">
                <TabsTrigger value="week" className="px-2.5 py-1 text-xs">
                  {t('diet.week')}
                </TabsTrigger>
                <TabsTrigger value="month" className="px-2.5 py-1 text-xs">
                  {t('diet.month')}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          }
          footer={
            <button
              onClick={() => drill('/diet/history')}
              className="press -mb-3 mt-2 flex w-full items-center justify-between border-t border-border py-3 text-base"
            >
              <span>{t('diet.viewHistory')}</span>
              <Chevron />
            </button>
          }
        />
      )}
    </div>
  )
}
