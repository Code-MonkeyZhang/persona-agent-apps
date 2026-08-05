import type { Metric } from '../types'

interface Props {
  metrics: Metric[]
  filter: (m: Metric) => boolean
  formatValue: (m: Metric) => string
}

export function HistoryList({ metrics, filter, formatValue }: Props) {
  const records = metrics
    .filter(filter)
    .sort((a, b) => b.date.localeCompare(a.date))

  if (records.length === 0) {
    return null
  }

  return (
    <>
      <div className="section-label">历史记录</div>
      <div className="card-group">
        {records.map((r, i) => (
          <div
            key={r.date}
            className={`metric-row static-row${i === records.length - 1 ? '' : ' metric-row-bordered'}`}
          >
            <span className="metric-row-label date-label">{r.date}</span>
            <span className="metric-row-value">{formatValue(r)}</span>
          </div>
        ))}
      </div>
    </>
  )
}
