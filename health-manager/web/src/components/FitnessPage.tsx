import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Dumbbell, Flame, Footprints } from 'lucide-react'
import type { FitnessState, StrengthRecord, WorkoutEntry } from '../types'
import {
  categoryLabelKey,
  formatDate,
  groupByCategory,
  latestPerExercise,
  previousStrength,
  workoutCaloriesByDate,
} from '../helpers'
import { useI18n } from '../i18n'
import { useDrill, routes } from '@/lib/router'
import { Sparkline } from './Sparkline'
import { WorkoutCalendar } from './WorkoutCalendar'
import { Card, Chevron, Row, SectionLabel, Tile } from './ui/primitives'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

interface Props {
  fitness: FitnessState
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  '有氧': Flame,
  '上半身': Dumbbell,
  '下半身': Footprints,
}

/** Fitness tab: workout diary (default) and ability records; day and
 *  exercise drill-ins are router navigations. */
export function FitnessPage({ fitness }: Props) {
  const { t } = useI18n()
  const drill = useDrill()
  const [segment, setSegment] = useState<'diary' | 'ability'>('diary')

  return (
    <Tabs
      value={segment}
      onValueChange={(v) => setSegment(v as 'diary' | 'ability')}
    >
      <TabsList className="mb-4 grid w-full grid-cols-2">
        <TabsTrigger value="diary">{t('fitness.diary')}</TabsTrigger>
        <TabsTrigger value="ability">{t('fitness.ability')}</TabsTrigger>
      </TabsList>
      <TabsContent value="diary">
        <DiaryView
          workouts={fitness.workouts}
          onSelectDate={(date) => drill(`/fitness/day/${date}`)}
        />
      </TabsContent>
      <TabsContent value="ability">
        <AbilityList
          records={fitness.strengthRecords}
          onSelect={(rec) => drill(routes.strength(rec.exercise, rec.metric))}
        />
      </TabsContent>
    </Tabs>
  )
}

/** Diary view: contribution graph + compact recent-days list. */
function DiaryView({
  workouts,
  onSelectDate,
}: {
  workouts: WorkoutEntry[]
  onSelectDate: (date: string) => void
}) {
  const { t, locale } = useI18n()
  const caloriesByDate = workoutCaloriesByDate(workouts)

  // Summary: distinct workout days + total calories in the current month.
  const now = new Date()
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthDates = Object.keys(caloriesByDate).filter((d) => d.startsWith(monthPrefix))
  const monthCalories = monthDates.reduce((s, d) => s + caloriesByDate[d], 0)

  // Compact list: most recent 7 workout days.
  const dates = [...new Set(workouts.map((w) => w.date))]
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 7)

  if (dates.length === 0) {
    return (
      <div className="px-5 py-10 text-center text-[15px] leading-relaxed text-muted-foreground">
        {t('fitness.emptyDiary')}
      </div>
    )
  }

  return (
    <div>
      <SectionLabel>
        {t('fitness.monthSummary', { days: monthDates.length, cal: monthCalories })}
      </SectionLabel>
      <WorkoutCalendar caloriesByDate={caloriesByDate} onSelectDate={onSelectDate} />

      <SectionLabel className="mt-2">{t('fitness.recent')}</SectionLabel>
      <Card>
        {dates.map((date, i) => {
          const dayWorkouts = workouts.filter((w) => w.date === date)
          const exerciseNames = dayWorkouts.map((w) => w.exercise).join(' · ')
          return (
            <Row
              key={date}
              bordered={i !== dates.length - 1}
              onClick={() => onSelectDate(date)}
            >
              <div className="flex flex-col">
                <span>{formatDate(date, locale)}</span>
                <span className="text-[12px] text-muted-foreground">{exerciseNames}</span>
              </div>
              <div className="flex items-center">
                <span className="text-[13px] text-muted-foreground">
                  {caloriesByDate[date] ?? 0} kcal
                </span>
                <Chevron />
              </div>
            </Row>
          )
        })}
      </Card>
    </div>
  )
}

function CategoryLabel({ category }: { category: string }) {
  const { t } = useI18n()
  const Icon = CATEGORY_ICONS[category]
  const key = categoryLabelKey(category)
  return (
    <SectionLabel className="flex items-center gap-1">
      {Icon && <Icon className="size-3.5" />}
      {key ? t(key) : category}
    </SectionLabel>
  )
}

function AbilityList({
  records,
  onSelect,
}: {
  records: StrengthRecord[]
  onSelect: (rec: StrengthRecord) => void
}) {
  const { t } = useI18n()
  const latest = latestPerExercise(records)
  if (latest.length === 0) {
    return (
      <div className="px-5 py-10 text-center text-[15px] leading-relaxed text-muted-foreground">
        {t('fitness.emptyAbility')}
      </div>
    )
  }
  const groups = groupByCategory(latest)
  return (
    <div>
      {groups.map((group) => (
        <div key={group.category} className="mb-4 last:mb-0">
          <CategoryLabel category={group.category} />
          <div className="grid grid-cols-2 gap-3">
            {group.records.map((rec) => {
              const prev = previousStrength(records, rec.exercise, rec.metric)
              const change = prev ? Math.round((rec.value - prev.value) * 10) / 10 : null
              const series = records
                .filter((r) => r.exercise === rec.exercise && r.metric === rec.metric)
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((r) => r.value)
              return (
                <Tile
                  key={`${rec.exercise}:${rec.metric}`}
                  onClick={() => onSelect(rec)}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-[13px] font-medium text-muted-foreground">
                      {rec.exercise}
                    </span>
                    <span className="text-[11px] text-[#c7c7cc]">
                      {rec.metric}
                    </span>
                  </div>
                  <span className="text-2xl font-bold leading-tight tabular-nums">
                    {rec.value}
                    {rec.unit && (
                      <span className="ml-0.5 text-[15px] font-normal text-muted-foreground">
                        {rec.unit}
                      </span>
                    )}
                  </span>
                  {change !== null && change !== 0 && (
                    <span className="text-xs text-muted-foreground">
                      {t('common.vsLast', {
                        v: `${change > 0 ? '↑' : '↓'}${Math.abs(change)}`,
                      })}
                    </span>
                  )}
                  <Sparkline data={series} color="#6366f1" />
                </Tile>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
