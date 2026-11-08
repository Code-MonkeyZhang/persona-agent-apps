import { useMemo, useState } from 'react'
import { Activity, NotebookPen, Scan, Search } from 'lucide-react'
import type { DiseaseState, LabDictionary, LabResult } from '../types'
import { useI18n } from '../i18n'
import { useDrill, routes } from '@/lib/router'
import {
  arrowOf,
  fmtValue,
  groupColor,
  latestMap,
  liveSubcatsOf,
  orderedMembers,
  searchHits,
  valueColor,
} from '../lib/labDisplay'

interface Props {
  disease: DiseaseState
}

/**
 * Disease tab root: the browsing page itself. Search on top, the three peer
 * entries below it, then fixed group sections stacking subcategory cards by
 * worst-item severity. Every drill-in is a router navigation; the page stays
 * a pure read of the data.
 */
export function DiseasePage({ disease }: Props) {
  const { t } = useI18n()
  const drill = useDrill()
  const [query, setQuery] = useState('')
  const labs = disease.labResults
  const dict = disease.labDictionary

  const empty =
    labs.length === 0 &&
    disease.imagingFindings.length === 0 &&
    disease.journal.length === 0

  const latest = useMemo(() => (dict ? latestMap(dict, labs) : null), [dict, labs])
  const sections = useMemo(() => {
    if (!dict || !latest) return []
    return dict.groups.map((g) => ({
      group: g,
      color: groupColor(g),
      subs: liveSubcatsOf(dict, g, latest),
    }))
  }, [dict, latest])

  if (!dict || !latest) return null
  if (empty) {
    return (
      <div className="px-5 py-10 text-center text-[15px] leading-relaxed text-muted-foreground">
        {t('disease.empty')}
      </div>
    )
  }

  const q = query.trim()

  return (
    <div>
      <div className="mb-4 flex h-9 items-center rounded-[10px] bg-card px-2.5 shadow-sm">
        <Search className="mr-1.5 size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
        <input
          className="h-full w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
          placeholder={t('disease.searchHint')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {q ? (
        <SearchResults dict={dict} q={q} latest={latest} />
      ) : (
        <>
          <div className="mb-2 grid grid-cols-3 gap-1.5">
            <Entry
              icon={Activity}
              tint="bg-orange-500/10 text-orange-600"
              label={t('disease.routine')}
              onClick={() => drill('/disease/routine')}
            />
            <Entry
              icon={Scan}
              tint="bg-indigo-500/10 text-indigo-600"
              label={t('disease.imaging')}
              onClick={() => drill('/disease/imaging')}
            />
            <Entry
              icon={NotebookPen}
              tint="bg-teal-500/10 text-teal-600"
              label={t('disease.journal')}
              onClick={() => drill('/disease/journal')}
            />
          </div>
          {sections.map(
            ({ group, color, subs }) =>
              subs.length > 0 && (
                <div key={group}>
                  <div className="mb-1.5 mt-3 flex items-center gap-1.5">
                    <span className="size-2 rounded-[3px]" style={{ background: color }} />
                    <span className="text-[13px] font-bold">{group}</span>
                  </div>
                  {subs.map(({ sub, members, abn }) => (
                    <SubcatCard
                      key={sub}
                      sub={sub}
                      members={orderedMembers(members, latest)}
                      abn={abn}
                      dict={dict}
                      latest={latest}
                    />
                  ))}
                </div>
              )
          )}
        </>
      )}
    </div>
  )
}

/** Peer entry tile into the routine, imaging and journal pages. */
function Entry({
  icon: Icon,
  tint,
  label,
  onClick,
}: {
  icon: typeof Activity
  tint: string
  label: string
  onClick: () => void
}) {
  return (
    <div
      className="flex cursor-pointer flex-col items-center gap-[3px] rounded-xl bg-card px-1 py-2 shadow-sm press"
      onClick={onClick}
    >
      <span className={`flex size-7 items-center justify-center rounded-lg ${tint}`}>
        <Icon className="size-3.5" strokeWidth={2} />
      </span>
      <span className="text-[10.5px] font-semibold">{label}</span>
    </div>
  )
}

/** Full-width subcategory card: header with the abnormal capsule and tiles. */
function SubcatCard({
  sub,
  members,
  abn,
  dict,
  latest,
}: {
  sub: string
  members: string[]
  abn: number
  dict: LabDictionary
  latest: Map<string, LabResult | null>
}) {
  const drill = useDrill()
  return (
    <div className="mb-2 rounded-[14px] bg-card px-3 pb-2 pt-2.5 shadow-sm">
      <div
        className="mb-2 flex cursor-pointer items-center gap-1.5 press"
        onClick={() => drill(routes.subcat(sub))}
      >
        <span className="text-[13px] font-bold">{sub}</span>
        {abn > 0 && (
          <span className="ml-auto rounded-md bg-red-100 px-1.5 py-px text-[10px] font-semibold text-[#b91c1c]">
            {abn}
          </span>
        )}
      </div>
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-0.5">
        {members.map((name) => (
          <Tile key={name} name={name} dict={dict} latest={latest.get(name) ?? null} />
        ))}
      </div>
    </div>
  )
}

/** Horizontally scrolled item tile with the latest value and unit. */
function Tile({
  name,
  dict,
  latest,
}: {
  name: string
  dict: LabDictionary
  latest: LabResult | null
}) {
  const { t } = useI18n()
  const drill = useDrill()
  const color = valueColor(latest)
  return (
    <div
      className="w-[88px] flex-none cursor-pointer rounded-[10px] bg-[#f7f7fa] px-1.5 pb-1.75 pt-2 press"
      onClick={() => drill(routes.analyte(name))}
    >
      <div className="truncate text-[10px] text-muted-foreground">{name}</div>
      <div
        className="mt-0.5 whitespace-nowrap text-[13.5px] font-bold"
        style={color ? { color } : undefined}
      >
        {fmtValue(latest)}
        {arrowOf(latest)}
      </div>
      <div className="whitespace-nowrap text-[9px] text-muted-foreground">
        {latest ? dict.items[name].u || ' ' : t('disease.noRecord')}
      </div>
    </div>
  )
}

/** Search matches grouped per subcategory in group order. */
function SearchResults({
  dict,
  q,
  latest,
}: {
  dict: LabDictionary
  q: string
  latest: Map<string, LabResult | null>
}) {
  const { t } = useI18n()
  const drill = useDrill()
  const groups = searchHits(dict, q)
  if (groups.length === 0) {
    return (
      <div className="px-5 py-10 text-center text-[15px] text-muted-foreground">
        {t('disease.noMatch')}
      </div>
    )
  }
  return (
    <div>
      {groups.map(({ color, sub, names }) => (
        <div key={sub} className="mb-1">
          <div className="mb-1.5 mt-3 flex items-center gap-1.5">
            <span className="size-2 rounded-[3px]" style={{ background: color }} />
            <span className="text-[13px] font-bold">{sub}</span>
          </div>
          <div className="rounded-xl bg-card px-3.5 py-1">
            {names.map((n) => {
              const l = latest.get(n) ?? null
              const color2 = valueColor(l)
              return (
                <div
                  key={n}
                  className="flex min-h-11 cursor-pointer items-center justify-between border-b border-border py-2 last:border-b-0 press"
                  onClick={() => drill(routes.analyte(n))}
                >
                  <span className="text-[15px]">{n}</span>
                  {l ? (
                    <span
                      className="text-[13px] font-bold"
                      style={color2 ? { color: color2 } : undefined}
                    >
                      {fmtValue(l)}
                      {arrowOf(l)}
                      {dict.items[n].u && (
                        <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">
                          {dict.items[n].u}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-[13px] font-normal text-muted-foreground">—</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
