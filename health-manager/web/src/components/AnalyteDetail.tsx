import { useParams } from 'react-router'
import type { LabResult } from '../types'
import { formatDate } from '../helpers'
import { useI18n } from '../i18n'
import { DetailHeader } from './DetailHeader'
import { TrendChart, type TrendPoint } from './TrendChart'
import { Badge } from './ui/badge'
import { Card, Row } from './ui/primitives'

interface Props {
  labs: LabResult[]
  onBack: () => void
}

/** Drill-in for one analyte: trend chart with the reference band, then history. */
export function AnalyteDetail({ labs, onBack }: Props) {
  const { t, locale } = useI18n()
  const { analyte = '' } = useParams()
  const rows = labs
    .filter((r) => r.analyte === analyte)
    .sort((a, b) => a.date.localeCompare(b.date))
  const latest = rows[rows.length - 1]
  const numeric: TrendPoint[] = rows
    .filter((r) => r.valueNum !== null)
    .map((r) => ({ date: r.date, value: r.valueNum as number, abnormal: r.abnormalFlag }))

  return (
    <div>
      <DetailHeader title={analyte} onBack={onBack} />
      {numeric.length > 1 && (
        <TrendChart
          data={numeric}
          color="#0ea5e9"
          label={analyte}
          unit={latest?.unit ?? ''}
          refLow={latest?.refLow ?? null}
          refHigh={latest?.refHigh ?? null}
          flagDots
        />
      )}
      <Card>
        {[...rows].reverse().map((row, i, reversed) => (
          <Row key={row.id} bordered={i !== reversed.length - 1}>
            <div className="flex flex-col">
              <span>{formatDate(row.date, locale)}</span>
              {row.refText && (
                <span className="text-[12px] text-muted-foreground">
                  {t('disease.ref', { ref: row.refText })}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[15px] tabular-nums">
                {row.valueNum !== null ? row.valueNum : row.valueText}
                {row.unit && row.valueNum !== null && (
                  <span className="ml-0.5 text-xs text-muted-foreground">{row.unit}</span>
                )}
              </span>
              {row.abnormalFlag && (
                <Badge variant={row.abnormalFlag === 'H' ? 'warn' : 'notice'}>
                  {t(row.abnormalFlag === 'H' ? 'disease.flagHigh' : 'disease.flagLow')}
                </Badge>
              )}
            </div>
          </Row>
        ))}
      </Card>
    </div>
  )
}
