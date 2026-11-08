import { useParams } from 'react-router'
import type { LabDictionary, LabResult } from '../types'
import { useI18n } from '../i18n'
import { useDrill, routes } from '@/lib/router'
import { DetailHeader } from './DetailHeader'
import { QMini, SparklineSvg } from './LabCharts'
import {
  arrowOf,
  fmtValue,
  latestMap,
  orderedMembers,
  qGrade,
  recsOf,
  valueColor,
} from '../lib/labDisplay'

interface Props {
  labs: LabResult[]
  dict: LabDictionary | null
  onBack: () => void
}

/**
 * Subcategory page: one row per dictionary member, abnormal items first with
 * dictionary order as the tiebreak. Numeric rows carry a sparkline on the
 * right, qualitative rows a mini grade strip.
 */
export function LabSubcatPage({ labs, dict, onBack }: Props) {
  const { sub = '' } = useParams()
  const { t } = useI18n()
  const drill = useDrill()
  const latest = dict ? latestMap(dict, labs) : null
  const members = dict ? (dict.subs[sub]?.[1] ?? []) : []
  const ordered = latest ? orderedMembers(members, latest) : []

  if (!dict || !latest) {
    return (
      <div>
        <DetailHeader title={sub} onBack={onBack} />
      </div>
    )
  }

  return (
    <div>
      <DetailHeader title={sub} onBack={onBack} />
      <div className="flex flex-col gap-1.5">
        {ordered.map((name) => {
          const l = latest.get(name) ?? null
          const rs = recsOf(labs, name)
          const item = dict.items[name]
          const color = valueColor(l)
          return (
            <div
              key={name}
              className="flex cursor-pointer items-center justify-between rounded-xl bg-card px-3.5 py-2 press"
              onClick={() => drill(routes.analyte(name))}
            >
              <div className="min-w-0">
                <div className="text-[10.5px] text-muted-foreground">{name}</div>
                {l ? (
                  <>
                    <div
                      className="text-[15.5px] font-bold"
                      style={color ? { color } : undefined}
                    >
                      {fmtValue(l)}
                      {item.u && (
                        <span className="ml-0.5 text-[9px] font-normal text-muted-foreground">
                          {item.u}
                        </span>
                      )}
                      {arrowOf(l)}
                    </div>
                    <div className="text-[9.5px] text-muted-foreground">
                      {item.r || '—'}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-[15.5px] font-bold text-muted-foreground">—</div>
                    <div className="text-[9.5px] text-muted-foreground">
                      {t('disease.noRecordYet', { ref: item.r || '—' })}
                    </div>
                  </>
                )}
              </div>
              <RowPreview labs={rs} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Right side of a subcategory row: sparkline or mini grade strip. */
function RowPreview({ labs }: { labs: LabResult[] }) {
  const nums = labs.filter((r) => typeof r.valueNum === 'number')
  if (nums.length >= 2) return <SparklineSvg labs={labs} />
  const texts = labs.filter((r) => r.valueText != null).slice(-8)
  if (texts.length >= 2) return <QMini labs={texts} gradeOf={qGrade} />
  return null
}
