import { useMemo } from 'react'
import { FlaskConical, NotebookPen, Scan } from 'lucide-react'
import type { DiseaseState, LabResult } from '../types'
import { useI18n } from '../i18n'
import { useDrill, routes } from '@/lib/router'
import { Badge } from './ui/badge'
import { IconTile, SectionLabel, Tile } from './ui/primitives'

interface Props {
  disease: DiseaseState
}

/**
 * Disease tab main view: peer entries into the lab catalog, imaging findings
 * and the journal on top, then the digest of analytes currently out of range.
 * Every drill-in is a router navigation; recording flows in through the
 * Agent, and the journal editor is the only write path in this module.
 */
export function DiseasePage({ disease }: Props) {
  const { t } = useI18n()
  const drill = useDrill()

  const abnormals = useMemo(
    () => currentAbnormals(disease.labResults),
    [disease.labResults]
  )
  const empty =
    disease.labResults.length === 0 &&
    disease.imagingFindings.length === 0 &&
    disease.journal.length === 0

  if (empty) {
    return (
      <div className="px-5 py-10 text-center text-[15px] leading-relaxed text-muted-foreground">
        {t('disease.empty')}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-5 grid grid-cols-3 gap-2">
        <IconTile
          icon={FlaskConical}
          tint="bg-sky-500/10 text-sky-600"
          label={t('disease.labs')}
          onClick={() => drill('/disease/labs')}
        />
        <IconTile
          icon={Scan}
          tint="bg-indigo-500/10 text-indigo-600"
          label={t('disease.imaging')}
          onClick={() => drill('/disease/imaging')}
        />
        <IconTile
          icon={NotebookPen}
          tint="bg-teal-500/10 text-teal-600"
          label={t('disease.journal')}
          onClick={() => drill('/disease/journal')}
        />
      </div>

      <SectionLabel>{t('disease.abnormal')}</SectionLabel>
      {abnormals.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {abnormals.map((row) => (
            <AbnormalTile
              key={row.analyte}
              row={row}
              onSelect={(analyte) => drill(routes.analyte(analyte))}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-green-50 px-4 py-3 text-[14px] font-medium text-green-600">
          {t('disease.allNormal')}
        </div>
      )}
    </div>
  )
}

/**
 * Abnormal analytes of the current period: for every analyte the latest
 * record decides, flagged high first, then by name.
 */
function currentAbnormals(labs: LabResult[]): LabResult[] {
  const latest = new Map<string, LabResult>()
  for (const lab of labs) {
    const existing = latest.get(lab.analyte)
    if (!existing || lab.date >= existing.date) latest.set(lab.analyte, lab)
  }
  return [...latest.values()]
    .filter((r) => r.abnormalFlag)
    .sort(
      (a, b) =>
        Number(b.abnormalFlag === 'H') - Number(a.abnormalFlag === 'H') ||
        a.analyte.localeCompare(b.analyte)
    )
}

/** Abnormal tile: analyte name, latest value and its high or low flag. */
function AbnormalTile({
  row,
  onSelect,
}: {
  row: LabResult
  onSelect: (analyte: string) => void
}) {
  const { t } = useI18n()

  return (
    <Tile className="gap-0 p-3 mobile:p-3" onClick={() => onSelect(row.analyte)}>
      <div className="flex w-full items-center justify-between">
        <span className="truncate text-[13px] font-medium text-muted-foreground">
          {row.analyte}
        </span>
        <Badge variant={row.abnormalFlag === 'H' ? 'warn' : 'notice'}>
          {t(row.abnormalFlag === 'H' ? 'disease.flagHigh' : 'disease.flagLow')}
        </Badge>
      </div>
      <span className="text-xl font-bold leading-tight tabular-nums">
        {row.valueNum !== null ? row.valueNum : row.valueText}
        {row.unit && row.valueNum !== null && (
          <span className="ml-0.5 text-xs font-normal text-muted-foreground">
            {row.unit}
          </span>
        )}
      </span>
    </Tile>
  )
}
