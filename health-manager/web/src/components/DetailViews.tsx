import type { Metric } from '../types'
import { WeightChart } from './WeightChart'
import { BloodPressureChart } from './BloodPressureChart'
import { HistoryList } from './HistoryList'
import { latestAndPrev, fmtChange } from '../helpers'

function MetricHero({
  value,
  unit,
  change,
  extra,
}: {
  value: string
  unit: string
  change: number | null
  extra?: string
}) {
  const sub = [change !== null && change !== 0 ? fmtChange(change) : null, extra]
    .filter(Boolean)
    .join(' · ')
  return (
    <>
      <div className="big-number">
        {value}
        <span className="big-unit">{unit}</span>
      </div>
      {sub && <div className="big-change">{sub}</div>}
    </>
  )
}

interface DetailProps {
  metrics: Metric[]
}

export function WeightDetail({ metrics }: DetailProps) {
  const { latest, prev } = latestAndPrev(metrics, 'weight')
  const change =
    latest && prev
      ? Math.round((latest.weight! - prev.weight!) * 10) / 10
      : null
  return (
    <>
      <MetricHero
        value={latest ? String(latest.weight) : '——'}
        unit="kg"
        change={change}
      />
      <WeightChart metrics={metrics} />
      <HistoryList
        metrics={metrics}
        filter={(m) => m.weight !== null}
        formatValue={(m) => `${m.weight} kg`}
      />
    </>
  )
}

export function BloodPressureDetail({ metrics }: DetailProps) {
  const { latest, prev } = latestAndPrev(metrics, 'systolic')
  const change = latest && prev ? latest.systolic! - prev.systolic! : null
  const heartRate = latest?.heartRate ? `心率 ${latest.heartRate}` : undefined
  return (
    <>
      <MetricHero
        value={latest ? `${latest.systolic}/${latest.diastolic}` : '——'}
        unit="mmHg"
        change={change}
        extra={heartRate}
      />
      <BloodPressureChart metrics={metrics} />
      <HistoryList
        metrics={metrics}
        filter={(m) => m.systolic !== null}
        formatValue={(m) =>
          `${m.systolic}/${m.diastolic}${m.heartRate ? ` · ${m.heartRate}` : ''}`
        }
      />
    </>
  )
}
