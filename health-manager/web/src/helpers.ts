import type { Metric } from './types'

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
