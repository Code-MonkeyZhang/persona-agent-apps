import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { Metric } from '../types'
import { ChartCard } from './ui/primitives'

interface Props {
  metrics: Metric[]
}

export function BloodPressureChart({ metrics }: Props) {
  const data = metrics
    .filter((m) => m.systolic !== null)
    .map((m) => ({
      date: m.date,
      systolic: m.systolic,
      diastolic: m.diastolic,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  if (data.length === 0) {
    return null
  }

  return (
    <ChartCard>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5ea" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8e8e93' }} />
          <YAxis domain={[40, 180]} tick={{ fontSize: 11, fill: '#8e8e93' }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="systolic"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="收缩压"
            unit="mmHg"
          />
          <Line
            type="monotone"
            dataKey="diastolic"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="舒张压"
            unit="mmHg"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
