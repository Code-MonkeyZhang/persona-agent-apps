import type { DietEntry, Metric, StrengthRecord, WorkoutEntry } from './types'

/** Find the latest and previous records that have a non-null value for a field. */
export function latestAndPrev(
  metrics: Metric[],
  field: 'weight' | 'systolic' | 'heartRate'
): { latest: Metric | null; prev: Metric | null } {
  const sorted = metrics
    .filter((m) => m[field] !== null)
    .sort((a, b) => b.date.localeCompare(a.date))
  return { latest: sorted[0] ?? null, prev: sorted[1] ?? null }
}

export function calcBMI(
  height: number | null,
  weight: number | null
): number | null {
  if (!height || !weight) return null
  const h = height / 100
  return Math.round((weight / (h * h)) * 10) / 10
}

export function bmiCategory(
  bmi: number
): { label: string; color: string } {
  if (bmi < 18.5) return { label: '偏瘦', color: '#3b82f6' }
  if (bmi < 24) return { label: '正常', color: '#22c55e' }
  if (bmi < 28) return { label: '偏胖', color: '#f59e0b' }
  return { label: '肥胖', color: '#ef4444' }
}

/** Format a numeric change as a human-readable arrow string. */
export function fmtChange(change: number | null): string {
  if (change === null || change === 0) return '持平'
  if (change > 0) return `↑${Math.abs(change)}`
  return `↓${Math.abs(change)}`
}

// --- Date helpers -----------------------------------------------------------

/** Local calendar date as YYYY-MM-DD (avoids UTC off-by-one from toISOString). */
export function todayStr(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** Whole days from date a to date b (both YYYY-MM-DD). */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000)
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/** Format a YYYY-MM-DD date as "6月25日 周三". */
export function formatDateCn(date: string): string {
  const d = new Date(date + 'T00:00:00')
  return `${d.getMonth() + 1}月${d.getDate()}日 ${WEEKDAYS[d.getDay()]}`
}

// --- Diet aggregation -------------------------------------------------------

/** Total calories per date, keyed by YYYY-MM-DD. */
export function caloriesByDate(entries: DietEntry[]): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const e of entries) {
    totals[e.date] = (totals[e.date] ?? 0) + e.calories
  }
  return totals
}

/** ISO week key (YYYY-Www) for a YYYY-MM-DD date, Monday-first. */
function isoWeekKey(date: string): string {
  const d = new Date(date + 'T00:00:00')
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day + 3)
  const firstThursday = new Date(d.getFullYear(), 0, 4)
  const firstDay = (firstThursday.getDay() + 6) % 7
  firstThursday.setDate(firstThursday.getDate() - firstDay + 3)
  const week = 1 + Math.round((d.getTime() - firstThursday.getTime()) / 604800000)
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`
}

/**
 * Daily calorie totals for the most recent `limit` days-on-record, oldest
 * first. Only days that actually have records are included; the date is
 * trimmed to MM-DD for compact axis labels.
 */
export function dailyCalorieSeries(
  entries: DietEntry[],
  limit: number
): { date: string; value: number }[] {
  const totals = caloriesByDate(entries)
  return Object.entries(totals)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-limit)
    .map(([date, value]) => ({ date: date.slice(5), value }))
}

/** Totals for one date: calories plus the three macros (null treated as 0). */
export function dayTotals(
  entries: DietEntry[],
  date: string
): { calories: number; carbs: number; protein: number; fat: number } {
  const day = entries.filter((e) => e.date === date)
  const macro = (field: 'carbs' | 'protein' | 'fat') =>
    day.reduce((s, e) => s + (e[field] ?? 0), 0)
  return {
    calories: day.reduce((s, e) => s + e.calories, 0),
    carbs: macro('carbs'),
    protein: macro('protein'),
    fat: macro('fat'),
  }
}

// --- Fitness transforms -----------------------------------------------------

/** Latest strength record per exercise + metric, ordered by most recent. */
export function latestPerExercise(records: StrengthRecord[]): StrengthRecord[] {
  const latest = new Map<string, StrengthRecord>()
  for (const r of records) {
    const key = `${r.exercise}::${r.metric}`
    const existing = latest.get(key)
    if (!existing || r.date >= existing.date) {
      latest.set(key, r)
    }
  }
  return [...latest.values()].sort((a, b) => b.date.localeCompare(a.date))
}

const _CATEGORY_ORDER = ['有氧', '上半身', '下半身']

/** Group records by category, sorted by a fixed preference then by name.
 *  Null/empty categories fall under "其他". */
export function groupByCategory(
  records: StrengthRecord[]
): { category: string; records: StrengthRecord[] }[] {
  const groups = new Map<string, StrengthRecord[]>()
  for (const r of records) {
    const cat = r.category || '其他'
    if (!groups.has(cat)) groups.set(cat, [])
    groups.get(cat)!.push(r)
  }
  return [...groups.entries()]
    .map(([category, recs]) => ({ category, records: recs }))
    .sort((a, b) => {
      const ia = _CATEGORY_ORDER.indexOf(a.category)
      const ib = _CATEGORY_ORDER.indexOf(b.category)
      if (ia !== -1 && ib !== -1) return ia - ib
      if (ia !== -1) return -1
      if (ib !== -1) return 1
      return a.category.localeCompare(b.category)
    })
}

/** Previous record before the latest one for the same exercise + metric. */
export function previousStrength(
  records: StrengthRecord[],
  exercise: string,
  metric: string
): StrengthRecord | null {
  const same = records
    .filter((r) => r.exercise === exercise && r.metric === metric)
    .sort((a, b) => b.date.localeCompare(a.date))
  return same[1] ?? null
}

/** Count of distinct workout dates in the current ISO week. */
export function workoutsThisWeek(entries: WorkoutEntry[]): number {
  const thisWeek = isoWeekKey(todayStr())
  return new Set(
    entries.filter((e) => isoWeekKey(e.date) === thisWeek).map((e) => e.date)
  ).size
}

/** Total calories burned per date, keyed by YYYY-MM-DD (null treated as 0). */
export function workoutCaloriesByDate(entries: WorkoutEntry[]): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const e of entries) {
    totals[e.date] = (totals[e.date] ?? 0) + (e.calories ?? 0)
  }
  return totals
}
