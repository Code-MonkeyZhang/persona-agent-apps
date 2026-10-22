import type { BasicsState, DietState, DiseaseState, FitnessState } from './types'
import type { TFunc } from './i18n'
import type { TKey } from './i18n/locales'
import {
  calcBMI,
  caloriesByDate,
  daysBetween,
  latestAndPrev,
  latestPerExercise,
  previousStrength,
  todayStr,
} from './helpers'

/**
 * Summary card selection engine.
 *
 * The home tab shows "today's highlights", not an exhaustive list. Cards are
 * chosen by deterministic rules — the same data always yields the same cards —
 * and each card carries a tag explaining why it surfaced.
 *
 * Selection model:
 * - Basic vital cards (weight / blood pressure / BMI) are always present, since
 *   their details are only reachable from this tab.
 * - Dynamic cards (today's calories, strength progress) appear only when they
 *   are recent or notable.
 * - Every card gets a tier; sorting floats notable ones to the top.
 */
export type CardGo =
  | 'weight'
  | 'blood_pressure'
  | 'profile'
  | 'diet'
  | 'fitness'
  | 'disease'

export type TagTone = 'warn' | 'notice' | 'info'

export interface SummaryCard {
  key: string
  label: string
  value: string
  unit?: string
  sub?: string
  tag?: TKey
  tagTone?: TagTone
  series?: number[]
  go: CardGo
  tier: number
  recencyDays: number
}

export interface Summary {
  status: string
  cards: SummaryCard[]
}

const TIER_CORE = 0
const TIER_RECENT = 1
const TIER_CHANGE = 2
const TIER_ATTENTION = 3

const MAX_CARDS = 6
const WEIGHT_CHANGE_THRESHOLD = 3
const BP_CHANGE_THRESHOLD = 10
const SYS_HIGH = 140
const DIA_HIGH = 90

export function buildSummary(
  basics: BasicsState,
  diet: DietState,
  fitness: FitnessState,
  disease: DiseaseState,
  t: TFunc
): Summary {
  const today = todayStr()
  const cards: SummaryCard[] = []

  const weightCard = buildWeightCard(basics, today, t)
  if (weightCard) cards.push(weightCard)

  const bpCard = buildBloodPressureCard(basics, today, t)
  if (bpCard) cards.push(bpCard)

  const bmiCard = buildBmiCard(basics)
  if (bmiCard) cards.push(bmiCard)

  const calorieCard = buildCalorieCard(diet, today, t)
  if (calorieCard) cards.push(calorieCard)

  cards.push(...buildStrengthCards(fitness, today, t))

  const labCard = buildLabAbnormalCard(disease, today, t)
  if (labCard) cards.push(labCard)

  cards.sort((a, b) => b.tier - a.tier || a.recencyDays - b.recencyDays)

  return {
    status: buildStatus(cards, basics, t),
    cards: cards.slice(0, MAX_CARDS),
  }
}

function daysAgo(date: string, today: string): number {
  return Math.max(daysBetween(date, today), 0)
}

function buildWeightCard(
  basics: BasicsState,
  today: string,
  t: TFunc
): SummaryCard | null {
  const { latest, prev } = latestAndPrev(basics.metrics, 'weight')
  if (!latest || latest.weight === null) return null

  const series = basics.metrics
    .filter((m) => m.weight !== null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((m) => m.weight as number)

  let tier = TIER_CORE
  let tag: TKey | undefined
  let sub: string | undefined
  if (prev && prev.weight !== null) {
    const change = Math.round((latest.weight - prev.weight) * 10) / 10
    sub = t('common.vsLast', { v: `${change > 0 ? '+' : ''}${change}kg` })
    if (Math.abs(change) > WEIGHT_CHANGE_THRESHOLD) {
      tier = TIER_CHANGE
      tag = 'summary.tag.change'
    }
  }
  if (tier === TIER_CORE && daysAgo(latest.date, today) <= 1) tier = TIER_RECENT

  return {
    key: 'weight',
    label: t('metric.weight'),
    value: String(latest.weight),
    unit: 'kg',
    sub,
    tag,
    tagTone: tier === TIER_CHANGE ? 'notice' : undefined,
    series,
    go: 'weight',
    tier,
    recencyDays: daysAgo(latest.date, today),
  }
}

function buildBloodPressureCard(
  basics: BasicsState,
  today: string,
  t: TFunc
): SummaryCard | null {
  const { latest, prev } = latestAndPrev(basics.metrics, 'systolic')
  if (!latest || latest.systolic === null) return null

  let tier = TIER_CORE
  let tag: TKey | undefined
  let tagTone: TagTone | undefined
  let sub: string | undefined
  if (latest.systolic >= SYS_HIGH || (latest.diastolic ?? 0) >= DIA_HIGH) {
    tier = TIER_ATTENTION
    tag = 'summary.tag.attention'
    tagTone = 'warn'
  } else if (prev && prev.systolic !== null) {
    const change = latest.systolic - prev.systolic
    sub = t('common.vsLast', { v: `${change > 0 ? '+' : ''}${change}` })
    if (Math.abs(change) > BP_CHANGE_THRESHOLD) {
      tier = TIER_CHANGE
      tag = 'summary.tag.change'
      tagTone = 'notice'
    }
  }
  if (tier === TIER_CORE && daysAgo(latest.date, today) <= 1) tier = TIER_RECENT

  return {
    key: 'blood_pressure',
    label: t('metric.bloodPressure'),
    value: `${latest.systolic}/${latest.diastolic}`,
    unit: 'mmHg',
    sub,
    tag,
    tagTone,
    go: 'blood_pressure',
    tier,
    recencyDays: daysAgo(latest.date, today),
  }
}

function buildBmiCard(basics: BasicsState): SummaryCard | null {
  const height = basics.profile?.height ?? null
  const weight = latestAndPrev(basics.metrics, 'weight').latest?.weight ?? null
  const bmi = calcBMI(height, weight)
  if (bmi === null) return null
  return {
    key: 'bmi',
    label: 'BMI',
    value: String(bmi),
    go: 'profile',
    tier: TIER_CORE,
    recencyDays: 999,
  }
}

function buildCalorieCard(
  diet: DietState,
  today: string,
  t: TFunc
): SummaryCard | null {
  if (diet.entries.length === 0) return null
  const todayTotal = caloriesByDate(diet.entries)[today] ?? 0
  if (todayTotal === 0) return null

  let sub: string | undefined
  if (diet.goal) {
    const pct = Math.round((todayTotal / diet.goal) * 100)
    sub = t('summary.goalPct', { goal: diet.goal, pct })
  }

  return {
    key: 'calories',
    label: t('summary.label.todayCalories'),
    value: String(todayTotal),
    unit: t('summary.unit.cal'),
    sub,
    go: 'diet',
    tier: TIER_RECENT,
    recencyDays: 0,
  }
}

function buildStrengthCards(
  fitness: FitnessState,
  today: string,
  t: TFunc
): SummaryCard[] {
  const cards: SummaryCard[] = []
  for (const rec of latestPerExercise(fitness.strengthRecords)) {
    const prev = previousStrength(fitness.strengthRecords, rec.exercise, rec.metric)
    const recency = daysAgo(rec.date, today)

    let tier = TIER_CORE
    let tag: TKey | undefined
    let sub: string | undefined
    if (prev) {
      const change = Math.round((rec.value - prev.value) * 10) / 10
      if (change > 0) {
        tier = TIER_CHANGE
        tag = 'summary.tag.progress'
        sub = t('common.vsLast', { v: `+${change}` })
      } else if (change !== 0) {
        sub = t('common.vsLast', { v: String(change) })
      }
    }
    if (tier === TIER_CORE && recency <= 2) tier = TIER_RECENT
    if (tier === TIER_CORE) continue

    cards.push({
      key: `strength:${rec.exercise}:${rec.metric}`,
      label: rec.exercise,
      value: String(rec.value),
      unit: rec.unit ?? (rec.metric === 'max_weight' ? 'kg' : t('summary.unit.times')),
      sub,
      tag,
      tagTone: tier === TIER_CHANGE ? 'notice' : undefined,
      go: 'fitness',
      tier,
      recencyDays: recency,
    })
  }
  return cards
}

/**
 * Lab abnormal card: analytes whose latest value is out of range.
 * Sits at the attention tier so it floats to the top of the home tab.
 */
function buildLabAbnormalCard(
  disease: DiseaseState,
  today: string,
  t: TFunc
): SummaryCard | null {
  const latest = new Map<string, DiseaseState['labResults'][number]>()
  for (const row of disease.labResults) latest.set(row.analyte, row)
  const flagged = [...latest.values()].filter((r) => r.abnormalFlag)
  if (flagged.length === 0) return null

  const newest = flagged.reduce((a, b) => (a.date > b.date ? a : b)).date
  const names = flagged.map((r) => r.analyte)
  const sub = names.slice(0, 3).join('、') + (names.length > 3 ? '…' : '')
  return {
    key: 'lab_abnormal',
    label: t('summary.labAbnormal'),
    value: String(flagged.length),
    unit: t('summary.unit.labItems'),
    sub,
    tag: 'summary.tag.attention',
    tagTone: 'warn',
    go: 'disease',
    tier: TIER_ATTENTION,
    recencyDays: daysAgo(newest, today),
  }
}

function buildStatus(cards: SummaryCard[], basics: BasicsState, t: TFunc): string {
  const top = cards[0]
  if (!top) return t('summary.status.start')
  if (top.tier === TIER_ATTENTION) {
    if (top.key === 'lab_abnormal') {
      return t('summary.status.labAbnormal', { n: top.value })
    }
    return t('summary.status.bpHigh')
  }

  const pr = cards.find((c) => c.tag === 'summary.tag.progress')
  if (pr)
    return t('summary.status.newHigh', {
      label: pr.label,
      value: pr.value,
      unit: pr.unit ?? '',
    })

  const bigWeight = cards.find((c) => c.key === 'weight' && c.tier === TIER_CHANGE)
  if (bigWeight) {
    const { latest, prev } = latestAndPrev(basics.metrics, 'weight')
    if (latest && prev && latest.weight !== null && prev.weight !== null) {
      const change = Math.round((latest.weight - prev.weight) * 10) / 10
      return change > 0
        ? t('summary.status.weightHeavier', { v: Math.abs(change) })
        : t('summary.status.weightLighter', { v: Math.abs(change) })
    }
  }
  return t('summary.status.stable')
}
