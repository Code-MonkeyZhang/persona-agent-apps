import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { Metric } from '../types'
import { ChartCard } from './ui/primitives'

interface Props {
  metrics: Metric[]
}

export function WeightChart({ metrics }: Props) {
  const data = metrics
    .filter((m) => m.weight !== null)
    .map((m) => ({ date: m.date, weight: m.weight }))
    .sort((a, b) => a.date.localeCompare(b.date))

  if (data.length === 0) {
    return null
  }

  return (
    <ChartCard>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5ea" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8e8e93' }} />
          <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#8e8e93' }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#14b8a6"
            strokeWidth={2}
            dot={{ r: 4 }}
            name="体重"
            unit="kg"
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
