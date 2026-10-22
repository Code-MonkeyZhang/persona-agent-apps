import { useMemo, useState } from 'react'
import { useParams } from 'react-router'
import {
  Activity,
  Beaker,
  Dna,
  Droplet,
  Ellipsis,
  TestTubes,
  type LucideIcon,
} from 'lucide-react'
import type { LabResult } from '../types'
import { formatDate } from '../helpers'
import { useI18n } from '../i18n'
import { useDrill, routes } from '@/lib/router'
import { DetailHeader } from './DetailHeader'
import { Badge } from './ui/badge'
import { Card, Chevron, IconTile, Row, SectionLabel } from './ui/primitives'

/** Same group order the server uses, unknown categories append at the end. */
const GROUP_ORDER = [
  '生化检查',
  '尿液检查',
  '血液常规',
  '免疫检查',
  '内分泌检查',
  '其他检查',
]

/** Icon and tint per category, unknown categories fall back to a neutral tile. */
const GROUP_STYLES: Record<string, { icon: LucideIcon; tint: string }> = {
  生化检查: { icon: Beaker, tint: 'bg-sky-500/10 text-sky-600' },
  尿液检查: { icon: Droplet, tint: 'bg-amber-500/10 text-amber-600' },
  血液常规: { icon: TestTubes, tint: 'bg-rose-500/10 text-rose-600' },
  免疫检查: { icon: Dna, tint: 'bg-violet-500/10 text-violet-600' },
  内分泌检查: { icon: Activity, tint: 'bg-emerald-500/10 text-emerald-600' },
}
const FALLBACK_STYLE = { icon: Ellipsis, tint: 'bg-slate-500/10 text-slate-600' }

/** Sort known categories into GROUP_ORDER, unknown ones append at the end. */
function byGroupOrder(a: string, b: string): number {
  const ia = GROUP_ORDER.indexOf(a)
  const ib = GROUP_ORDER.indexOf(b)
  return (ia === -1 ? GROUP_ORDER.length : ia) - (ib === -1 ? GROUP_ORDER.length : ib)
}

/** Latest record per analyte, so every catalog row shows the current value. */
function latestPerAnalyte(labs: LabResult[]): Map<string, LabResult> {
  const map = new Map<string, LabResult>()
  for (const lab of labs) {
    const existing = map.get(lab.analyte)
    if (!existing || lab.date >= existing.date) map.set(lab.analyte, lab)
  }
  return map
}

interface CatalogProps {
  labs: LabResult[]
  onBack: () => void
}

/** Lab catalog: category tiles by default, typing searches across all analytes. */
export function LabCatalog({ labs, onBack }: CatalogProps) {
  const { t } = useI18n()
  const drill = useDrill()
  const [query, setQuery] = useState('')

  if (labs.length === 0) {
    return (
      <div>
        <DetailHeader title={t('disease.labs')} onBack={onBack} />
        <div className="px-5 py-10 text-center text-[15px] leading-relaxed text-muted-foreground">
          {t('disease.emptyLabs')}
        </div>
      </div>
    )
  }

  const q = query.trim()
  const latest = latestPerAnalyte(labs)
  const categories = [...new Set(labs.map((r) => r.category))].sort(byGroupOrder)

  return (
    <div>
      <DetailHeader title={t('disease.labs')} onBack={onBack} />
      <div className="pb-4">
        <input
          className="h-9 w-full rounded-lg bg-muted px-3 text-[15px] outline-none"
          placeholder={t('disease.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {q ? (
        <SearchResults
          rows={[...latest.values()].filter((r) => r.analyte.includes(q))}
          counts={countPerAnalyte(labs)}
          onSelect={(analyte) => drill(routes.analyte(analyte))}
        />
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {categories.map((category) => {
            const style = GROUP_STYLES[category] ?? FALLBACK_STYLE
            return (
              <IconTile
                key={category}
                icon={style.icon}
                tint={style.tint}
                label={category}
                onClick={() => drill(routes.labCategory(category))}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

interface CategoryProps {
  labs: LabResult[]
  onBack: () => void
}

/** Third level: all analytes of one category, latest value per row. */
export function LabCategoryPage({ labs, onBack }: CategoryProps) {
  const drill = useDrill()
  const { category = '' } = useParams()
  const rows = [...latestPerAnalyte(labs)]
    .filter(([, row]) => row.category === category)
    .map(([, row]) => row)
  return (
    <div>
      <DetailHeader title={category} onBack={onBack} />
      <Card>
        {rows.map((row, i) => (
          <CatalogRow
            key={row.analyte}
            row={row}
            count={labs.filter((r) => r.analyte === row.analyte).length}
            bordered={i !== rows.length - 1}
            onClick={() => drill(routes.analyte(row.analyte))}
          />
        ))}
      </Card>
    </div>
  )
}

/** Matches of the search query, grouped by category in catalog order. */
function SearchResults({
  rows,
  counts,
  onSelect,
}: {
  rows: LabResult[]
  counts: Map<string, number>
  onSelect: (analyte: string) => void
}) {
  const { t } = useI18n()
  if (rows.length === 0) {
    return (
      <div className="px-5 py-10 text-center text-[15px] text-muted-foreground">
        {t('disease.noMatch')}
      </div>
    )
  }
  const grouped = new Map<string, LabResult[]>()
  for (const row of rows) {
    grouped.set(row.category, [...(grouped.get(row.category) ?? []), row])
  }
  const groups = [...grouped.keys()].sort(byGroupOrder)
  return (
    <div>
      {groups.map((category) => (
        <div key={category} className="mb-1">
          <SectionLabel>{category}</SectionLabel>
          <Card>
            {grouped.get(category)!.map((row, i, list) => (
              <CatalogRow
                key={row.analyte}
                row={row}
                count={counts.get(row.analyte) ?? 1}
                bordered={i !== list.length - 1}
                onClick={() => onSelect(row.analyte)}
              />
            ))}
          </Card>
        </div>
      ))}
    </div>
  )
}

/** Record count per analyte, shown as how much history a row drills into. */
function countPerAnalyte(labs: LabResult[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const lab of labs) map.set(lab.analyte, (map.get(lab.analyte) ?? 0) + 1)
  return map
}

/** Catalog row: analyte with flag on the left, record count and date on the right. */
function CatalogRow({
  row,
  count,
  bordered,
  onClick,
}: {
  row: LabResult
  count: number
  bordered: boolean
  onClick: () => void
}) {
  const { t, locale } = useI18n()
  return (
    <Row bordered={bordered} onClick={onClick}>
      <div className="flex items-center gap-2">
        <span className="text-[15px]">{row.analyte}</span>
        {row.abnormalFlag && (
          <Badge variant={row.abnormalFlag === 'H' ? 'warn' : 'notice'}>
            {t(row.abnormalFlag === 'H' ? 'disease.flagHigh' : 'disease.flagLow')}
          </Badge>
        )}
      </div>
      <div className="flex items-center text-muted-foreground">
        <span className="text-[13px]">
          {t('disease.recordsTimes', { n: count })}
          {' · '}
          {formatDate(row.date, locale)}
        </span>
        <Chevron />
      </div>
    </Row>
  )
}
