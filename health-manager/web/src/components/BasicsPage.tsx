import { Navigate, useNavigate, useParams } from 'react-router'
import { Settings as SettingsIcon } from 'lucide-react'
import type { BasicsState, DietState, DiseaseState, FitnessState } from '../types'
import { buildSummary, type SummaryCard, type TagTone } from '../summary'
import { formatDate, todayStr } from '../helpers'
import { useI18n } from '../i18n'
import type { TKey } from '../i18n/locales'
import { useDrill } from '@/lib/router'
import { Sparkline } from './Sparkline'
import { DetailHeader } from './DetailHeader'
import { ProfileDetail } from './ProfileDetail'
import { WeightDetail, BloodPressureDetail } from './DetailViews'
import { Badge } from './ui/badge'
import { Tile } from './ui/primitives'

const DETAIL_TITLES: Record<string, TKey> = {
  profile: 'detail.profile',
  weight: 'metric.weight',
  blood_pressure: 'metric.bloodPressure',
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
  disease: DiseaseState
}

/**
 * Home tab: fixed header (date / name / one-line status) on top, dynamically
 * selected cards below. Card selection rules live in summary.ts; every
 * drill-in is a router navigation.
 */
export function BasicsPage({ basics, diet, fitness, disease }: Props) {
  const { t } = useI18n()
  const drill = useDrill()
  const navigate = useNavigate()
  const { status, cards } = buildSummary(basics, diet, fitness, disease, t)

  return (
    <div>
      <HomeHeader
        name={basics.profile?.name}
        status={status}
        onSettings={() => drill('/summary/settings')}
      />
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <SummaryTile
            key={card.key}
            card={card}
            onClick={() => {
              if (card.go === 'diet' || card.go === 'fitness' || card.go === 'disease') {
                // Tab switches navigate without a direction marker and fade.
                navigate(`/${card.go}`)
              } else {
                drill(`/summary/${card.go}`)
              }
            }}
          />
        ))}
      </div>
    </div>
  )
}

/** Route view for the summary drill-ins: profile, weight or blood pressure. */
export function SummaryDetailPage({
  basics,
  onSetHeight,
}: {
  basics: BasicsState
  onSetHeight: (height: number) => void
}) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { detail } = useParams()
  if (!detail || !DETAIL_TITLES[detail]) return <Navigate to="/summary" replace />
  return (
    <div>
      <DetailHeader
        title={t(DETAIL_TITLES[detail])}
        onBack={() => navigate(-1)}
      />
      {detail === 'profile' && (
        <ProfileDetail
          profile={basics.profile}
          metrics={basics.metrics}
          onSetHeight={onSetHeight}
        />
      )}
      {detail === 'weight' && <WeightDetail metrics={basics.metrics} />}
      {detail === 'blood_pressure' && <BloodPressureDetail metrics={basics.metrics} />}
    </div>
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
  const { t, locale } = useI18n()
  return (
    <div className="relative px-1 pb-5 pt-2">
      <button
        onClick={onSettings}
        aria-label={t('common.settings')}
        className="press absolute right-1 top-1.5 flex items-center justify-center border-none bg-none p-1.5 text-muted-foreground active:text-primary"
      >
        <SettingsIcon size={22} />
      </button>
      <div className="text-[13px] text-muted-foreground">
        {formatDate(todayStr(), locale)}
      </div>
      <div className="my-1 text-[28px] font-bold">{name || t('home.hello')}</div>
      <div className="text-base">{status}</div>
    </div>
  )
}

function SummaryTile({ card, onClick }: { card: SummaryCard; onClick: () => void }) {
  const { t } = useI18n()
  return (
    <Tile onClick={onClick}>
      <div className="flex w-full items-center justify-between">
        <span className="text-[13px] font-medium text-muted-foreground">{card.label}</span>
        {card.tag && <Badge variant={TAG_VARIANT[card.tagTone ?? 'info']}>{t(card.tag)}</Badge>}
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
