import NumberFlow from '@number-flow/react'
import type { WorkoutEntry } from '../types'
import { formatDateCn } from '../helpers'
import { DetailHeader } from './DetailHeader'
import { Card, Row, SectionLabel } from './ui/primitives'

interface Props {
  date: string
  workouts: WorkoutEntry[]
  onBack: () => void
}

/** Push view: total calories + exercise breakdown for one workout day. */
export function WorkoutDayDetail({ date, workouts, onBack }: Props) {
  const dayWorkouts = workouts.filter((w) => w.date === date)
  const totalCalories = dayWorkouts.reduce((s, w) => s + (w.calories ?? 0), 0)

  return (
    <div>
      <DetailHeader title={formatDateCn(date)} onBack={onBack} />
      {dayWorkouts.length === 0 ? (
        <div className="px-5 py-10 text-center text-[15px] leading-relaxed text-muted-foreground">
          这天没有训练记录。
        </div>
      ) : (
        <>
          <div className="px-1 pb-0.5 pt-1 text-[40px] font-bold leading-tight mobile:text-[44px]">
            <NumberFlow value={totalCalories} className="tabular-nums" />
            <span className="ml-1 text-xl font-normal text-muted-foreground">kcal</span>
          </div>
          <div className="px-1 pb-4 text-[15px] text-muted-foreground">
            总消耗 · {dayWorkouts.length} 个动作
          </div>

          <SectionLabel>训练明细</SectionLabel>
          <Card>
            {dayWorkouts.map((w, i) => (
              <Row key={w.id} bordered={i !== dayWorkouts.length - 1}>
                <div className="flex flex-col">
                  <span>{w.exercise}</span>
                  <span className="text-[12px] text-muted-foreground">
                    {[
                      w.sets !== null
                        ? w.reps !== null
                          ? `${w.sets} × ${w.reps}`
                          : `${w.sets} sets`
                        : null,
                      w.weight !== null ? `${w.weight} kg` : null,
                      w.feeling,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </div>
              </Row>
            ))}
          </Card>
        </>
      )}
    </div>
  )
}
