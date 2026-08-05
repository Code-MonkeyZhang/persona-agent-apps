import type { Profile, Metric, View } from '../types'
import { Sparkline } from './Sparkline'
import { latestAndPrev, fmtChange, calcBMI, bmiCategory } from '../helpers'

interface Props {
  profile: Profile | null
  metrics: Metric[]
  onSelect: (view: View) => void
}

export function OverviewPage({ profile, metrics, onSelect }: Props) {
  const height = profile?.height ?? null
  const weight = latestAndPrev(metrics, 'weight')
  const bp = latestAndPrev(metrics, 'systolic')

  const weightChange =
    weight.latest && weight.prev
      ? Math.round((weight.latest.weight! - weight.prev.weight!) * 10) / 10
      : null
  const bpChange =
    bp.latest && bp.prev ? bp.latest.systolic! - bp.prev.systolic! : null

  const bmi = calcBMI(height, weight.latest?.weight ?? null)
  const bmiCat = bmi !== null ? bmiCategory(bmi) : null

  const series = (field: 'weight' | 'systolic'): number[] =>
    metrics
      .filter((m) => m[field] !== null)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((m) => m[field]! as number)

  const weightSeries = series('weight')
  const bpSeries = series('systolic')

  const bpSub = [
    bpChange !== null ? fmtChange(bpChange) : null,
    bp.latest?.heartRate ? `心率 ${bp.latest.heartRate}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="overview">
      <div className="section-label">你的身体数据</div>

      <button
        className="metric-tile metric-tile-wide"
        onClick={() => onSelect('profile')}
      >
        <span className="tile-label">身高</span>
        <div className="tile-main">
          <span className="tile-value">
            {height ?? '——'}
            {height && <span className="tile-unit">cm</span>}
          </span>
          {bmiCat && (
            <span className="tile-bmi">
              BMI {bmi}
              <span className="bmi-tag" style={{ background: bmiCat.color }}>
                {bmiCat.label}
              </span>
            </span>
          )}
        </div>
      </button>

      <div className="overview-grid">
        <button
          className="metric-tile"
          onClick={() => onSelect('weight')}
        >
          <span className="tile-label">体重</span>
          <span className="tile-value">
            {weight.latest ? weight.latest.weight : '——'}
            {weight.latest && <span className="tile-unit">kg</span>}
          </span>
          {weightChange !== null && (
            <span className="tile-change">{fmtChange(weightChange)}</span>
          )}
          <Sparkline data={weightSeries} color="#14b8a6" />
        </button>

        <button
          className="metric-tile"
          onClick={() => onSelect('blood_pressure')}
        >
          <span className="tile-label">血压</span>
          <span className="tile-value">
            {bp.latest ? `${bp.latest.systolic}/${bp.latest.diastolic}` : '——'}
          </span>
          {bpSub && <span className="tile-change">{bpSub}</span>}
          <Sparkline data={bpSeries} color="#ef4444" />
        </button>
      </div>
    </div>
  )
}
