import type { DictItem, LabDictionary, LabResult } from '../types'

/**
 * Display kernel of the disease browsing views, ported from the finalized
 * design spec: abnormal judgement, continuous severity, ordering and
 * qualitative grading. Every grouping function takes the lab dictionary
 * shipped with the snapshot, so this module holds no data of its own.
 */

/** Accent color per fixed group, keyed by group name, slate as the fallback. */
const GROUP_COLORS: Record<string, string> = {
  生化检查: '#0284c7',
  尿液检查: '#b45309',
  血液常规: '#be123c',
  免疫检查: '#6d28d9',
  内分泌检查: '#047857',
  其他检查: '#475569',
}

/** Accent color of a fixed group. */
export function groupColor(name: string): string {
  return GROUP_COLORS[name] ?? '#475569'
}

/** Qualitative grade of a text value, 'n' when the value is unordered. */
export function qGrade(v: string): 'g' | 'y' | 'o' | 'r' | 'd' | 'n' {
  if (/^(阴性|-|未见|未检出|否)$/.test(v)) return 'g'
  if (/^(±|弱阳性|微量|可疑)$/.test(v)) return 'y'
  if (/^(\+|1\+|\+1|阳性|有|少量)$/.test(v)) return 'o'
  if (/^(2\+|\+2)$/.test(v)) return 'r'
  if (/^([3-9]\+|\+[3-9]|强阳性|大量)$/.test(v)) return 'd'
  return 'n'
}

/** Foreground color of a qualitative grade for tile and row values. */
export function qColor(g: string): string {
  return (
    { g: '#0f766e', y: '#b45309', o: '#c2410c', r: '#b91c1c', d: '#991b1b' } as Record<
      string,
      string
    >
  )[g] ?? ''
}

/** Latest record of an analyte, null when it has no record at all. */
export function latestOf(labs: LabResult[], analyte: string): LabResult | null {
  let latest: LabResult | null = null
  for (const lab of labs) {
    if (lab.analyte !== analyte) continue
    if (!latest || lab.date >= latest.date) latest = lab
  }
  return latest
}

/** All records of one analyte in chronological order. */
export function recsOf(labs: LabResult[], analyte: string): LabResult[] {
  return labs.filter((r) => r.analyte === analyte).sort((a, b) => a.date.localeCompare(b.date))
}

/** Latest qualitative grade of a record, null for numeric or unordered values. */
export function latestGrade(l: LabResult | null): string | null {
  if (!l || typeof l.valueNum === 'number' || l.valueText == null) return null
  const g = qGrade(l.valueText)
  return g === 'n' ? null : g
}

/** Whether the latest value counts as abnormal for the badge and ordering. */
export function isAbn(l: LabResult | null): boolean {
  if (!l) return false
  if (l.abnormalFlag) return true
  const g = typeof l.valueNum === 'number' || l.valueText == null ? 'n' : qGrade(l.valueText)
  return g !== 'n' && g !== 'g'
}

/** Severity of a latest value as a continuous ratio over the violated limit. */
export function sevOf(l: LabResult | null, dict: DictItem): number {
  if (!l) return 0
  if (typeof l.valueNum === 'number') {
    if (l.abnormalFlag === 'H')
      return dict.hi != null && dict.hi > 0 ? Math.max(l.valueNum / dict.hi, 1) : 1
    if (l.abnormalFlag === 'L')
      return dict.lo != null && dict.lo > 0 && l.valueNum > 0
        ? Math.max(dict.lo / l.valueNum, 1)
        : 1
    return 0
  }
  const g = l.valueText == null ? 'n' : qGrade(l.valueText)
  if (g === 'd') {
    const m = /^(?:([3-9])\+|\+([3-9]))$/.exec(l.valueText ?? '')
    return m ? Number(m[1] ?? m[2]) : 3
  }
  return ({ y: 1.2, o: 1.5, r: 2 } as Record<string, number>)[g] ?? 0
}

/** Number of items whose latest value is abnormal inside a subcategory. */
export function abnCount(members: string[], latest: Map<string, LabResult | null>): number {
  return members.filter((n) => isAbn(latest.get(n) ?? null)).length
}

/** Highest severity among the latest values of a subcategory's items. */
export function maxSev(
  members: string[],
  latest: Map<string, LabResult | null>,
  dict: LabDictionary
): number {
  let m = 0
  for (const n of members) {
    const s = sevOf(latest.get(n) ?? null, dict.items[n])
    if (s > m) m = s
  }
  return m
}

/** Members ordered abnormal-first, dictionary order kept as the tiebreak. */
export function orderedMembers(
  members: string[],
  latest: Map<string, LabResult | null>
): string[] {
  return [...members].sort(
    (a, b) => Number(isAbn(latest.get(b) ?? null)) - Number(isAbn(latest.get(a) ?? null))
  )
}

/** Latest-value map over every dictionary analyte. */
export function latestMap(dict: LabDictionary, labs: LabResult[]): Map<string, LabResult | null> {
  const map = new Map<string, LabResult | null>()
  for (const n of Object.keys(dict.items)) map.set(n, latestOf(labs, n))
  return map
}

/** Subcategory cards of one group that hold at least one recorded item. */
export function liveSubcatsOf(
  dict: LabDictionary,
  group: string,
  latest: Map<string, LabResult | null>
): { sub: string; members: string[]; abn: number; sev: number }[] {
  const subs = Object.entries(dict.subs)
    .filter(([, [g]]) => g === group)
    .map(([sub, [, members]]) => ({
      sub,
      members,
      abn: abnCount(members, latest),
      sev: maxSev(members, latest, dict),
    }))
    .filter(({ members }) => members.some((n) => (latest.get(n) ?? null) != null))
  return subs.sort((a, b) => b.sev - a.sev || b.abn - a.abn)
}

/** Analytes matching a query on name or alias, grouped per subcategory in group order. */
export function searchHits(
  dict: LabDictionary,
  q: string
): { group: string; color: string; sub: string; names: string[] }[] {
  const ql = q.trim().toLowerCase()
  const hits = new Map<string, string[]>()
  for (const [name, it] of Object.entries(dict.items)) {
    const matched =
      name.toLowerCase().includes(ql) || it.a.some((alias) => alias.toLowerCase().includes(ql))
    if (matched) hits.set(it.s, [...(hits.get(it.s) ?? []), name])
  }
  const out: { group: string; color: string; sub: string; names: string[] }[] = []
  for (const group of dict.groups) {
    for (const [sub, [g]] of Object.entries(dict.subs)) {
      if (g !== group || !hits.has(sub)) continue
      out.push({ group, color: groupColor(group), sub, names: hits.get(sub)! })
    }
  }
  return out
}

/** Value text of a record: trimmed number or the raw text value. */
export function fmtValue(l: LabResult | null): string {
  if (!l) return '—'
  if (typeof l.valueNum === 'number') return String(Math.round(l.valueNum * 100) / 100)
  return l.valueText ?? '—'
}

/** Arrow of an abnormal flag, empty for normal and qualitative values. */
export function arrowOf(l: LabResult | null): string {
  if (!l) return ''
  if (l.abnormalFlag === 'H') return ' ↑'
  if (l.abnormalFlag === 'L') return ' ↓'
  return ''
}

/** Foreground color of a latest value on tiles and rows. */
export function valueColor(l: LabResult | null): string {
  if (!l) return ''
  if (l.abnormalFlag) return '#b91c1c'
  const g = latestGrade(l)
  return g ? qColor(g) : ''
}
