import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Settings as SettingsIcon } from 'lucide-react'
import type { BasicsState, DietState, FitnessState, GoalMode, Tab } from '../types'
import { buildSummary, type SummaryCard, type TagTone } from '../summary'
import { formatDateCn, todayStr } from '../helpers'
import { pushVariants, fadeVariants, PAGE_TRANSITION } from '@/lib/transitions'
import { Sparkline } from './Sparkline'
import { DetailHeader } from './DetailHeader'
import { ProfileDetail } from './ProfileDetail'
import { WeightDetail, BloodPressureDetail } from './DetailViews'
import { SettingsPage } from './SettingsPage'
import { Badge } from './ui/badge'
import { Tile } from './ui/primitives'

type Detail = 'none' | 'settings' | 'profile' | 'weight' | 'blood_pressure'

const DETAIL_TITLES: Record<Exclude<Detail, 'none' | 'settings'>, string> = {
  profile: '基本信息',
  weight: '体重',
  blood_pressure: '血压',
}

const TAG_VARIANT: Record<TagTone, 'warn' | 'notice' | 'info'> = {
  warn: 'warn',
  notice: 'notice',
  info: 'info',
}

interface Props {
  basics: BasicsState
  diet: DietState
  fitness: FitnessState
  mockOn: boolean
  version: string
  schemaVersion: number
  onSetHeight: (height: number) => void
  onSetName: (name: string) => void
  onSetDietGoal: (goal: number) => void
  onSetGoalMode: (mode: GoalMode) => void
  onSetMacroGoals: (carbs: number, protein: number, fat: number) => void
  onToggleMock: () => void
  onNavigate: (tab: Tab) => void
}

/**
 * Home tab: fixed header (date / name / one-line status) on top, dynamically
 * selected cards below. Card selection rules live in summary.ts.
 */
export function BasicsPage({
  basics,
  diet,
  fitness,
  mockOn,
  version,
  schemaVersion,
  onSetHeight,
  onSetName,
  onSetDietGoal,
  onSetGoalMode,
  onSetMacroGoals,
  onToggleMock,
  onNavigate,
}: Props) {
  const [detail, setDetailState] = useState<Detail>('none')
  const [dir, setDir] = useState(0)
  const reduce = useReducedMotion()
  const { status, cards } = buildSummary(basics, diet, fitness)

  const openDetail = (d: Exclude<Detail, 'none'>) => {
    setDir(1)
    setDetailState(d)
  }
  const closeDetail = () => {
    setDir(-1)
    setDetailState('none')
  }

  const variants = reduce ? fadeVariants : pushVariants

  return (
    <AnimatePresence mode="wait" custom={dir} initial={false}>
      {detail === 'settings' ? (
        <motion.div
          key="settings"
          custom={dir}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={PAGE_TRANSITION}
        >
          <SettingsPage
            name={basics.profile?.name ?? ''}
            height={basics.profile?.height ?? null}
            dietGoal={diet.goal}
            goalMode={diet.goalMode}
            macroGoals={diet.macroGoals}
            mockOn={mockOn}
            version={version}
            schemaVersion={schemaVersion}
            onSetName={onSetName}
            onSetHeight={onSetHeight}
            onSetDietGoal={onSetDietGoal}
            onSetGoalMode={onSetGoalMode}
            onSetMacroGoals={onSetMacroGoals}
            onToggleMock={onToggleMock}
            onBack={closeDetail}
          />
        </motion.div>
      ) : detail !== 'none' ? (
        <motion.div
          key={detail}
          custom={dir}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={PAGE_TRANSITION}
        >
          <DetailHeader title={DETAIL_TITLES[detail]} onBack={closeDetail} />
          {detail === 'profile' && (
            <ProfileDetail profile={basics.profile} metrics={basics.metrics} onSetHeight={onSetHeight} />
          )}
          {detail === 'weight' && <WeightDetail metrics={basics.metrics} />}
          {detail === 'blood_pressure' && <BloodPressureDetail metrics={basics.metrics} />}
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
          <HomeHeader
            name={basics.profile?.name}
            status={status}
            onSettings={() => openDetail('settings')}
          />
          <div className="grid grid-cols-2 gap-3">
            {cards.map((card) => (
              <SummaryTile
                key={card.key}
                card={card}
                onClick={() => {
                  if (card.go === 'diet' || card.go === 'fitness') onNavigate(card.go)
                  else openDetail(card.go)
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function HomeHeader({
  name,
  status,
  onSettings,
}: {
  name?: string | null
  status: string
  onSettings: () => void
}) {
  return (
    <div className="relative px-1 pb-5 pt-2">
      <button
        onClick={onSettings}
        aria-label="设置"
        className="press absolute right-1 top-1.5 flex items-center justify-center border-none bg-none p-1.5 text-muted-foreground active:text-primary"
      >
        <SettingsIcon size={22} />
      </button>
      <div className="text-[13px] text-muted-foreground">{formatDateCn(todayStr())}</div>
      <div className="my-1 text-[28px] font-bold">{name || '你好'}</div>
      <div className="text-base">{status}</div>
    </div>
  )
}

function SummaryTile({ card, onClick }: { card: SummaryCard; onClick: () => void }) {
  return (
    <Tile onClick={onClick}>
      <div className="flex w-full items-center justify-between">
        <span className="text-[13px] font-medium text-muted-foreground">{card.label}</span>
        {card.tag && <Badge variant={TAG_VARIANT[card.tagTone ?? 'info']}>{card.tag}</Badge>}
      </div>
      <span className="text-2xl font-bold leading-tight">
        {card.value}
        {card.unit && (
          <span className="ml-0.5 text-[15px] font-normal text-muted-foreground">{card.unit}</span>
        )}
      </span>
      {card.sub && <span className="text-xs text-muted-foreground">{card.sub}</span>}
      {card.series && <Sparkline data={card.series} color="#14b8a6" />}
    </Tile>
  )
}
