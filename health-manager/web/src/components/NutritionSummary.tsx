import NumberFlow from '@number-flow/react'
import { PolarAngleAxis, RadialBar, RadialBarChart } from 'recharts'
import type { MacroGoals } from '../types'
import { MACROS } from '../macroMeta'
import { Progress } from './ui/progress'

interface Props {
  calories: number
  goal: number | null
  macros: { carbs: number; protein: number; fat: number }
  macroGoals: MacroGoals
}

/**
 * Today's nutrition summary: a thin full-circle calorie ring on the left and
 * one progress bar per macro on the right. Values are pre-aggregated by the
 * caller and shown against the resolved goals.
 */
export function NutritionSummary({ calories, goal, macros, macroGoals }: Props) {
  const pct = goal ? Math.min((calories / goal) * 100, 100) : 0
  const over = goal !== null && calories > goal
  const ringColor = over ? '#ef4444' : '#14b8a6'

  return (
    <div className="mb-5 flex items-center gap-5 rounded-xl bg-card px-4 py-4">
      <div className="flex shrink-0 flex-col items-center">
        <div className="relative h-[104px] w-[104px]">
          <RadialBarChart
            width={104}
            height={104}
            cx="50%"
            cy="50%"
            innerRadius="78%"
            outerRadius="100%"
            barSize={7}
            data={[{ name: 'calories', value: pct }]}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar
              background={{ fill: '#e5e5ea' }}
              dataKey="value"
              cornerRadius={7}
              fill={ringColor}
            />
          </RadialBarChart>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <NumberFlow value={calories} className="text-[22px] font-semibold leading-none tabular-nums" />
            <span className="mt-0.5 text-[10px] text-muted-foreground">kcal</span>
          </div>
        </div>
        <span className="mt-1 text-[11px] text-muted-foreground">
          {goal !== null ? `/ ${goal}` : '未设目标'}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        {MACROS.map(({ key, label, color }) => {
          const value = macros[key]
          const target = macroGoals[key]
          const ratio = target ? Math.min((value / target) * 100, 100) : 0
          return (
            <div key={key}>
              <div className="flex items-baseline justify-between text-[12px]">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span
                    className="inline-block size-1.5 rounded-full"
                    style={{ background: color }}
                  />
                  {label}
                </span>
                <span className="tabular-nums font-medium">
                  {value}
                  <span className="font-normal text-muted-foreground">
                    /{target ?? '—'}g
                  </span>
                </span>
              </div>
              <Progress value={ratio} color={color} className="mt-1" />
            </div>
          )
        })}
      </div>
    </div>
  )
}
