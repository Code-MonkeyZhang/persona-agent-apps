import { useParams } from 'react-router'
import type { LabDictionary, LabResult } from '../types'
import { useI18n } from '../i18n'
import { DetailHeader } from './DetailHeader'
import { AnalyteChart, QStrip } from './LabCharts'
import { fmtValue, qGrade, recsOf } from '../lib/labDisplay'

interface Props {
  labs: LabResult[]
  dict: LabDictionary | null
  onBack: () => void
}

/**
 * Drill-in for one analyte. The chart dispatches on the recorded values:
 * numeric series get the reference-band chart, qualitative series the
 * timeline strip, anything thinner a plain note. The record list below is
 * chronological, newest on top.
 */
export function AnalyteDetail({ labs, dict, onBack }: Props) {
  const { t } = useI18n()
  const { analyte = '' } = useParams()
  const item = dict ? dict.items[analyte] : undefined
  const rs = recsOf(labs, analyte)
  const nums = rs.filter((r) => typeof r.valueNum === 'number')
  const texts = rs.filter((r) => r.valueText != null)

  if (!item) return <DetailHeader title={analyte} onBack={onBack} />

  return (
    <div>
      <DetailHeader title={analyte} onBack={onBack} />
      <div className="mb-5 rounded-xl bg-card px-3.5 pb-2.5 pt-3">
        <div className="mb-2.5 text-[11.5px] text-muted-foreground">
          {item.u || t('disease.qualitative')} · {item.r || t('disease.noRefLine')}
        </div>
        {nums.length >= 2 ? (
          <AnalyteChart labs={rs} dict={item} />
        ) : texts.length >= 2 ? (
          <QStrip labs={texts} gradeOf={qGrade} />
        ) : rs.length ? (
          <div className="rounded-[10px] border border-border bg-[#fafafa] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#52525b]">
            {t('disease.singlePoint')}
          </div>
        ) : (
          <div className="rounded-[10px] border border-border bg-[#fafafa] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#52525b]">
            {t('disease.emptyDetail')}
          </div>
        )}
      </div>
      {rs.length > 0 && (
        <div className="mb-5 rounded-xl bg-card px-3.5 py-1">
          {[...rs].reverse().map((r) => (
            <div
              key={r.id}
              className="flex items-baseline justify-between border-b border-border py-[7px] text-[12.5px] last:border-b-0"
            >
              <span className="text-[11px] text-muted-foreground">{r.date}</span>
              <span className="tabular-nums">
                {fmtValue(r)}
                {typeof r.valueNum === 'number' && item.u && (
                  <span className="ml-0.5 text-[10px] text-muted-foreground">{item.u}</span>
                )}
                {r.abnormalFlag && (
                  <span className="ml-1.5 text-[10px] font-bold text-[#b91c1c]">
                    {r.abnormalFlag}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
