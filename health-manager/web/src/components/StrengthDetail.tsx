import NumberFlow from '@number-flow/react'
import type { StrengthRecord } from '../types'
import { daysBetween, formatDate } from '../helpers'
import { useI18n } from '../i18n'
import { DetailHeader } from './DetailHeader'
import { TrendChart } from './TrendChart'
import { Badge } from './ui/badge'
import { Card, Row, SectionLabel } from './ui/primitives'

interface Props {
  records: StrengthRecord[]
  exercise: string
  metric: string
  onBack: () => void
}

/** Detail view for one exercise + metric: latest value, trend line, history. */
export function StrengthDetail({ records, exercise, metric, onBack }: Props) {
  const { t, locale } = useI18n()
  const same = records
    .filter((r) => r.exercise === exercise && r.metric === metric)
    .sort((a, b) => a.date.localeCompare(b.date))

  const latest = same[same.length - 1] ?? null
  const prev = same[same.length - 2] ?? null
  const change = latest && prev ? Math.round((latest.value - prev.value) * 10) / 10 : null
  const unit = latest?.unit ?? ''
 
  // Progress summary: only meaningful with two or more records.
  const totalChange =
    same.length >= 2 && latest
      ? Math.round((latest.value - same[0].value) * 10) / 10
      : null
  const monthsSpan =
    same.length >= 2 && latest
      ? Math.max(1, Math.round(daysBetween(same[0].date, latest.date) / 30))
      : 0

  return (
    <div>
      <DetailHeader title={exercise} onBack={onBack} />
      <div className="px-1 pb-0.5 pt-1 text-[40px] font-bold leading-tight mobile:text-[44px]">
        {latest ? (
          <NumberFlow value={latest.value} className="tabular-nums" />
        ) : (
          '——'
        )}
        {unit && (
          <span className="ml-1 text-xl font-normal text-muted-foreground">{unit}</span>
        )}
      </div>
      <div className="px-1 pb-4 text-[15px] text-muted-foreground">
        {metric}
        {change !== null && change !== 0 && (
          <span>
            {' · '}
            {t('common.vsLast', {
              v: `${change > 0 ? '↑' : '↓'}${Math.abs(change)}`,
            })}
          </span>
        )}
      </div>
      <TrendChart
        data={same.map((r) => ({ date: r.date, value: r.value }))}
        color="#6366f1"
        label={exercise}
        unit={unit}
      />
      <SectionLabel>{t('common.history')}</SectionLabel>
      <Card>
        {[...same].reverse().map((r, i) => {
          const isLatest = i === 0
          const isEarliest = i === same.length - 1
          return (
            <Row key={`${r.date}-${i}`} bordered={i !== same.length - 1}>
              <div className="flex items-center gap-2">
                <span className="text-[15px] text-muted-foreground">
                  {formatDate(r.date, locale)}
                </span>
                {same.length >= 2 && isLatest && (
                  <Badge variant="success">{t('fitness.newHigh')}</Badge>
                )}
                {same.length >= 2 && isEarliest && (
                  <Badge variant="info">{t('fitness.start')}</Badge>
                )}
              </div>
              <span className="font-medium tabular-nums">
                {r.value} {unit}
              </span>
            </Row>
          )
        })}
      </Card>
      {totalChange !== null && (
        <div className="mb-5 rounded-xl bg-card px-4 py-3 text-center">
          <span className="text-[15px] font-medium">
            {t('fitness.totalChange', {
              arrow: totalChange > 0 ? '↑' : '↓',
              v: Math.abs(totalChange),
              unit,
            })}
          </span>
          <span className="text-[13px] text-muted-foreground">
            {' · '}
            {t('fitness.recordsSpan', { months: monthsSpan, n: same.length })}
          </span>
        </div>
      )}
    </div>
  )
}
