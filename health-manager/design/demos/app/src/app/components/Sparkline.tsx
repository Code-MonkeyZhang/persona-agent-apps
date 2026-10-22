import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface Props {
  data: number[]
  color: string
}

/**
 * Tile sparkline: an axis-less recharts line. The y domain is pinned to the
 * data range so the slope reads honestly, with a one-step guard when all
 * values are equal.
 */
export function Sparkline({ data, color }: Props) {
  if (data.length < 2) return null

  const points = data.map((v, i) => ({ i, v }))
  const min = Math.min(...data)
  const max = Math.max(...data)
  const yDomain: [number, number] = min === max ? [min - 1, max + 1] : [min, max]

  return (
    <div className="mt-1.5 h-8 w-full mobile:h-9">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 2, right: 4, bottom: 2, left: 4 }}>
          <XAxis dataKey="i" hide type="number" domain={[0, points.length - 1]} />
          <YAxis hide domain={yDomain} />
          <Tooltip
            cursor={false}
            contentStyle={{
              borderRadius: 8,
              border: '1px solid #e5e5ea',
              fontSize: 12,
              padding: '2px 8px',
            }}
            formatter={(v) => [v, '']}
            labelFormatter={() => ''}
          />
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 2.5, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
