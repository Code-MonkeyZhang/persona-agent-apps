import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import { Dumbbell, Flame, Footprints } from 'lucide-react'
import type { FitnessState, StrengthRecord, WorkoutEntry } from '../types'
import {
  formatDateCn,
  groupByCategory,
  latestPerExercise,
  previousStrength,
  workoutCaloriesByDate,
} from '../helpers'
import { pushVariants, fadeVariants, PAGE_TRANSITION } from '@/lib/transitions'
import { Sparkline } from './Sparkline'
import { StrengthDetail } from './StrengthDetail'
import { WorkoutCalendar } from './WorkoutCalendar'
import { WorkoutDayDetail } from './WorkoutDayDetail'
import { Card, Chevron, Row, SectionLabel, Tile } from './ui/primitives'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

interface Props {
  fitness: FitnessState
}

type FitnessDetail =
  | { kind: 'none' }
  | { kind: 'workout-day'; date: string }
  | { kind: 'strength'; exercise: string; metric: string }

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  '有氧': Flame,
  '上半身': Dumbbell,
  '下半身': Footprints,
}

/** Fitness tab: workout diary (default) and ability records, with push/pop
 *  drill-in for day detail and exercise trends. */
export function FitnessPage({ fitness }: Props) {
  const [segment, setSegment] = useState<'diary' | 'ability'>('diary')
  const [detail, setDetail] = useState<FitnessDetail>({ kind: 'none' })
  const [dir, setDir] = useState(0)
  const reduce = useReducedMotion()
  const variants = reduce ? fadeVariants : pushVariants

  const openDetail = (d: Exclude<FitnessDetail, { kind: 'none' }>) => {
    setDir(1)
    setDetail(d)
  }
  const closeDetail = () => {
    setDir(-1)
    setDetail({ kind: 'none' })
  }

  return (
    <AnimatePresence mode="wait" custom={dir} initial={false}>
      {detail.kind === 'workout-day' ? (
        <motion.div
          key="workout-day"
          custom={dir}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={PAGE_TRANSITION}
        >
          <WorkoutDayDetail
            date={detail.date}
            workouts={fitness.workouts}
            onBack={closeDetail}
          />
        </motion.div>
      ) : detail.kind === 'strength' ? (
        <motion.div
          key="strength"
          custom={dir}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={PAGE_TRANSITION}
        >
          <StrengthDetail
            records={fitness.strengthRecords}
            exercise={detail.exercise}
            metric={detail.metric}
            onBack={closeDetail}
          />
        </motion.div>
      ) : (
        <motion.div
          key="main"
          custom={dir}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={PAGE_TRANSITION}
        >
          <Tabs
            value={segment}
            onValueChange={(v) => setSegment(v as 'diary' | 'ability')}
          >
            <TabsList className="mb-4 grid w-full grid-cols-2">
              <TabsTrigger value="diary">训练记录</TabsTrigger>
              <TabsTrigger value="ability">身体能力</TabsTrigger>
            </TabsList>
            <TabsContent value="diary">
              <DiaryView
                workouts={fitness.workouts}
                onSelectDate={(date) => openDetail({ kind: 'workout-day', date })}
              />
            </TabsContent>
            <TabsContent value="ability">
              <AbilityList
                records={fitness.strengthRecords}
                onSelect={(rec) =>
                  openDetail({ kind: 'strength', exercise: rec.exercise, metric: rec.metric })
                }
              />
            </TabsContent>
          </Tabs>
        </motion.div>
      )}
    </AnimatePresence>
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
        还没有运动日记。跟 Agent 说"今天练了胸"试试。
      </div>
    )
  }

  return (
    <div>
      <SectionLabel>
        本月已练 {monthDates.length} 天 · 消耗 {monthCalories} kcal
      </SectionLabel>
      <WorkoutCalendar caloriesByDate={caloriesByDate} onSelectDate={onSelectDate} />

      <SectionLabel className="mt-2">最近训练</SectionLabel>
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
                <span>{formatDateCn(date)}</span>
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
  const Icon = CATEGORY_ICONS[category]
  return (
    <SectionLabel className="flex items-center gap-1">
      {Icon && <Icon className="size-3.5" />}
      {category}
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
  const latest = latestPerExercise(records)
  if (latest.length === 0) {
    return (
      <div className="px-5 py-10 text-center text-[15px] leading-relaxed text-muted-foreground">
        还没有能力记录。跟 Agent 说"深蹲能蹲 100"试试。
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
                      比上次 {change > 0 ? '↑' : '↓'}
                      {Math.abs(change)}
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
