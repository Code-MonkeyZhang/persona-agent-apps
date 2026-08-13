import type { ReactNode } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { ChartCard } from './ui/primitives'

export interface TrendPoint {
  date: string
  value: number
}

interface Props {
  data: TrendPoint[]
  color: string
  label: string
  unit: string
  title?: string
  /** Optional node rendered on the right of the chart header, e.g. a toggle. */
  action?: ReactNode
  /** Optional node rendered below the chart, e.g. a drill-in row. */
  footer?: ReactNode
}

/** Generic single-series trend chart, shared by strength and calorie views. */
export function TrendChart({ data, color, label, unit, title, action, footer }: Props) {
  if (data.length === 0) return null
  return (
    <ChartCard title={title} action={action} footer={footer}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5ea" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8e8e93' }} />
          <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#8e8e93' }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={{ r: 4 }}
            name={label}
            unit={unit}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
