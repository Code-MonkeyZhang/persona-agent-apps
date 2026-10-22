import type { ReactNode } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
} from 'recharts'
import { ChartCard } from './ui/primitives'

export interface TrendPoint {
  date: string
  value: number
  /** Out-of-range marker for lab series; colors this dot red or blue. */
  abnormal?: 'H' | 'L' | null
}

interface DotProps {
  cx?: number
  cy?: number
  payload?: TrendPoint
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
  /** Optional reference band drawn behind the line when both bounds exist. */
  refLow?: number | null
  refHigh?: number | null
  /** Flag-colored dots instead of a single color, used by lab trends. */
  flagDots?: boolean
}

/** Dot renderer painting abnormal lab points red or blue, in-range ones main. */
function renderFlagDot({ cx, cy, payload }: DotProps) {
  if (cx == null || cy == null || !payload) return <></>
  const fill = payload.abnormal === 'H' ? '#ef4444' : payload.abnormal === 'L' ? '#3b82f6' : '#0ea5e9'
  return <circle cx={cx} cy={cy} r={4} fill={fill} />
}

/** Generic single-series trend chart, shared by strength, calorie and lab views. */
export function TrendChart({
  data,
  color,
  label,
  unit,
  title,
  action,
  footer,
  refLow,
  refHigh,
  flagDots,
}: Props) {
  if (data.length === 0) return null
  const hasBand = refLow != null && refHigh != null
  return (
    <ChartCard title={title} action={action} footer={footer}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
          {hasBand && (
            <ReferenceArea
              y1={refLow ?? undefined}
              y2={refHigh ?? undefined}
              fill="#22c55e"
              fillOpacity={0.08}
              strokeOpacity={0}
              ifOverflow="extendDomain"
            />
          )}
          {refHigh != null && (
            <ReferenceLine
              y={refHigh}
              stroke="#22c55e"
              strokeDasharray="4 4"
              ifOverflow="extendDomain"
            />
          )}
          {refLow != null && (
            <ReferenceLine
              y={refLow}
              stroke="#22c55e"
              strokeDasharray="4 4"
              ifOverflow="extendDomain"
            />
          )}
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5ea" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8e8e93' }} />
          <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#8e8e93' }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={flagDots ? renderFlagDot : { r: 4 }}
            name={label}
            unit={unit}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
