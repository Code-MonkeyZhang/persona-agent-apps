import { useI18n } from '../i18n'
import type { LabResult } from '../types'
import type { DictItem } from '../types'

/**
 * SVG charts of the disease module, ported point-by-point from the finalized
 * design spec: dashed red limit lines with inline labels, a teal reference
 * band, red dots for out-of-range points and value labels on the first, peak
 * and last points.
 */

const TEAL = '#14b8a6'
const RED = '#ef4444'
const DARK_RED = '#b91c1c'
const LINE = '#7c8aa0'
const LINE_LIGHT = '#a8b3c4'

/** Cell colors of the qualitative grade scale, shared by strip and mini. */
export const QCELL: Record<string, { bg: string; fg: string }> = {
  g: { bg: 'rgba(20,184,166,.12)', fg: '#0f766e' },
  y: { bg: 'rgba(245,158,11,.16)', fg: '#b45309' },
  o: { bg: 'rgba(234,88,12,.16)', fg: '#c2410c' },
  r: { bg: 'rgba(239,68,68,.14)', fg: '#b91c1c' },
  d: { bg: 'rgba(185,28,28,.18)', fg: '#991b1b' },
  n: { bg: '#f2f2f7', fg: '#52525b' },
}

function fmt(v: number): string {
  return String(Math.round(v * 100) / 100)
}

interface Point {
  date: string
  value: number
  over: boolean
}

/** Shared geometry of the two full-size charts. */
function useScale(pts: Point[], lo: number | null, hi: number | null) {
  const vals = pts.map((p) => p.value)
  let vmin = Math.min(...vals)
  let vmax = Math.max(...vals)
  if (lo !== null) vmin = Math.min(vmin, lo)
  if (hi !== null) vmax = Math.max(vmax, hi)
  if (vmin === vmax) {
    vmin -= 1
    vmax += 1
  }
  const pad = (vmax - vmin) * 0.1
  vmin -= pad
  vmax += pad
  const L = 16
  const R = 264
  const T = 14
  const B = 140
  const X = (i: number) => (pts.length === 1 ? (L + R) / 2 : L + ((R - L) * i) / (pts.length - 1))
  const Y = (v: number) => B - ((B - T) * (v - vmin)) / (vmax - vmin)
  return { L, R, T, B, X, Y }
}

/** Value labels on the first, peak and last points of a series. */
function PointLabels({
  pts,
  X,
  Y,
}: {
  pts: Point[]
  X: (i: number) => number
  Y: (v: number) => number
}) {
  const peakI = pts.reduce((m, p, i) => (p.value > pts[m].value ? i : m), 0)
  const seen = new Set<number>()
  const marks: { i: number; anchor: 'start' | 'middle' | 'end' }[] = [
    { i: 0, anchor: 'start' },
    { i: peakI, anchor: 'middle' },
    { i: pts.length - 1, anchor: 'end' },
  ]
  return (
    <>
      {marks.map(({ i, anchor }) => {
        if (seen.has(i)) return null
        seen.add(i)
        const p = pts[i]
        const x = i === 0 ? 16 : i === pts.length - 1 ? 264 : X(i)
        let y = Y(p.value) - 6
        if (y < 10) y = Y(p.value) + 12
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor={anchor}
            fontSize={8.5}
            fill={p.over ? DARK_RED : '#52525b'}
          >
            {fmt(p.value)}
          </text>
        )
      })}
    </>
  )
}

/** Row-level sparkline of the last ten numeric points. */
export function SparklineSvg({ labs }: { labs: LabResult[] }) {
  const rs = labs.filter((r) => typeof r.valueNum === 'number').slice(-10)
  if (rs.length < 2) return null
  const vals = rs.map((r) => r.valueNum as number)
  let lo = Math.min(...vals)
  let hi = Math.max(...vals)
  if (lo === hi) {
    lo -= 1
    hi += 1
  }
  const P = 6
  const W = 92
  const H = 30
  const X = (i: number) => P + ((W - 2 * P) * i) / (rs.length - 1)
  const Y = (v: number) => P + (H - 2 * P) * (1 - (v - lo) / (hi - lo))
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="shrink-0">
      <polyline
        fill="none"
        stroke={LINE}
        strokeWidth={1.3}
        points={rs
          .map((r, i) => `${X(i).toFixed(1)},${Y(r.valueNum as number).toFixed(1)}`)
          .join(' ')}
      />
      {rs.map((r, i) => (
        <circle
          key={r.id}
          cx={X(i)}
          cy={Y(r.valueNum as number)}
          r={2.2}
          fill={r.abnormalFlag ? RED : TEAL}
        />
      ))}
    </svg>
  )
}

/** Full-size chart of one numeric analyte with its dictionary limits. */
export function AnalyteChart({ labs, dict }: { labs: LabResult[]; dict: DictItem }) {
  const { t } = useI18n()
  const pts: Point[] = labs
    .filter((r) => typeof r.valueNum === 'number')
    .map((r) => ({ date: r.date, value: r.valueNum as number, over: !!r.abnormalFlag }))
  const { lo, hi } = dict
  const { L, R, X, Y, B } = useScale(pts, lo, hi)
  return (
    <svg viewBox="0 0 280 158" className="block h-auto w-full">
      {lo !== null && hi !== null && (
        <rect x={L} y={Y(hi)} width={R - L} height={Y(lo) - Y(hi)} fill={TEAL} opacity={0.08} />
      )}
      {lo === null && hi !== null && (
        <rect x={L} y={Y(hi)} width={R - L} height={B - Y(hi)} fill={TEAL} opacity={0.08} />
      )}
      {lo !== null && (
        <>
          <line x1={L} y1={Y(lo)} x2={R} y2={Y(lo)} stroke={RED} strokeDasharray="5 4" opacity={0.5} />
          <text x={R} y={Y(lo) + 10} textAnchor="end" fontSize={8} fill={RED}>
            {t('disease.lower', { v: fmt(lo) })}
          </text>
        </>
      )}
      {hi !== null && (
        <>
          <line x1={L} y1={Y(hi)} x2={R} y2={Y(hi)} stroke={RED} strokeDasharray="5 4" opacity={0.5} />
          <text x={R} y={Y(hi) - 4} textAnchor="end" fontSize={8} fill={RED}>
            {t('disease.upper', { v: fmt(hi) })}
          </text>
        </>
      )}
      <polyline
        fill="none"
        stroke={LINE}
        strokeWidth={1.5}
        points={pts.map((p, i) => `${X(i).toFixed(1)},${Y(p.value).toFixed(1)}`).join(' ')}
      />
      {pts.map((p, i) => (
        <circle key={i} cx={X(i)} cy={Y(p.value)} r={3.5} fill={p.over ? RED : TEAL} />
      ))}
      <PointLabels pts={pts} X={X} Y={Y} />
      <text x={L} y={152} fontSize={8} fill="#8e8e93">
        {pts[0].date.slice(0, 7)}
      </text>
      <text x={R} y={152} textAnchor="end" fontSize={8} fill="#8e8e93">
        {pts[pts.length - 1].date.slice(0, 7)}
      </text>
    </svg>
  )
}

/** Full-size chart of a routine metric judged against its own limits. */
export function MetricChart({
  series,
  lo,
  hi,
}: {
  series: { date: string; value: number }[]
  lo: number | null
  hi: number | null
}) {
  const over = (v: number) => (lo !== null && v < lo) || (hi !== null && v > hi)
  const pts: Point[] = series.map((p) => ({ ...p, over: over(p.value) }))
  const { L, R, X, Y, B } = useScale(pts, lo, hi)
  return (
    <svg viewBox="0 0 280 158" className="block h-auto w-full">
      {lo !== null && hi !== null && (
        <rect x={L} y={Y(hi)} width={R - L} height={Y(lo) - Y(hi)} fill={TEAL} opacity={0.08} />
      )}
      {lo === null && hi !== null && (
        <rect x={L} y={Y(hi)} width={R - L} height={B - Y(hi)} fill={TEAL} opacity={0.08} />
      )}
      {lo !== null && (
        <line x1={L} y1={Y(lo)} x2={R} y2={Y(lo)} stroke={RED} strokeDasharray="5 4" opacity={0.5} />
      )}
      {hi !== null && (
        <line x1={L} y1={Y(hi)} x2={R} y2={Y(hi)} stroke={RED} strokeDasharray="5 4" opacity={0.5} />
      )}
      <polyline
        fill="none"
        stroke={LINE}
        strokeWidth={1.5}
        points={pts.map((p, i) => `${X(i).toFixed(1)},${Y(p.value).toFixed(1)}`).join(' ')}
      />
      {pts.map((p, i) => (
        <circle key={i} cx={X(i)} cy={Y(p.value)} r={3.5} fill={p.over ? RED : TEAL} />
      ))}
      <PointLabels pts={pts} X={X} Y={Y} />
      <text x={L} y={152} fontSize={8} fill="#8e8e93">
        {pts[0].date}
      </text>
      <text x={R} y={152} textAnchor="end" fontSize={8} fill="#8e8e93">
        {pts[pts.length - 1].date}
      </text>
    </svg>
  )
}

/** Dual-line blood pressure chart against the 130 / 80 targets. */
export function BpChart({ series }: { series: { date: string; sys: number; dia: number }[] }) {
  const { t } = useI18n()
  const vals = series.flatMap((p) => [p.sys, p.dia]).concat([80, 130])
  const vmin = Math.min(...vals) - 8
  const vmax = Math.max(...vals) + 8
  const L = 16
  const R = 264
  const T = 14
  const B = 150
  const X = (i: number) =>
    series.length <= 1 ? (L + R) / 2 : L + ((R - L) * i) / (series.length - 1)
  const Y = (v: number) => B - ((B - T) * (v - vmin)) / (vmax - vmin)
  const last = series[series.length - 1]
  return (
    <svg viewBox="0 0 280 164" className="block h-auto w-full">
      <line x1={L} y1={Y(130)} x2={R} y2={Y(130)} stroke={RED} strokeDasharray="5 4" opacity={0.5} />
      <text x={L} y={Y(130) - 4} fontSize={8} fill={RED}>
        {t('disease.sysTarget')}
      </text>
      <line x1={L} y1={Y(80)} x2={R} y2={Y(80)} stroke={RED} strokeDasharray="5 4" opacity={0.5} />
      <text x={L} y={Y(80) - 4} fontSize={8} fill={RED}>
        {t('disease.diaTarget')}
      </text>
      <polyline
        fill="none"
        stroke={LINE}
        strokeWidth={1.5}
        points={series.map((p, i) => `${X(i).toFixed(1)},${Y(p.sys).toFixed(1)}`).join(' ')}
      />
      {series.map((p, i) => (
        <circle
          key={`s${i}`}
          cx={X(i)}
          cy={Y(p.sys)}
          r={p.sys > 130 ? 3.5 : 3}
          fill={p.sys > 130 ? RED : TEAL}
        />
      ))}
      <polyline
        fill="none"
        stroke={LINE_LIGHT}
        strokeWidth={1.5}
        points={series.map((p, i) => `${X(i).toFixed(1)},${Y(p.dia).toFixed(1)}`).join(' ')}
      />
      {series.map((p, i) => (
        <circle
          key={`d${i}`}
          cx={X(i)}
          cy={Y(p.dia)}
          r={p.dia > 80 ? 3.5 : 3}
          fill={p.dia > 80 ? RED : TEAL}
        />
      ))}
      {series.length > 0 && (
        <>
          <text x={L} y={Y(series[0].sys) - 7} fontSize={8.5} fill="#52525b">
            {series[0].sys}
          </text>
          <text
            x={R}
            y={Y(last.sys) - 7}
            textAnchor="end"
            fontSize={8.5}
            fill={last.sys > 130 ? DARK_RED : '#52525b'}
          >
            {last.sys}
          </text>
          <text x={R} y={Y(last.dia) + 12} textAnchor="end" fontSize={8.5} fill="#52525b">
            {last.dia}
          </text>
          <text x={L} y={160} fontSize={8} fill="#8e8e93">
            {series[0].date}
          </text>
          <text x={R} y={160} textAnchor="end" fontSize={8} fill="#8e8e93">
            {last.date}
          </text>
        </>
      )}
    </svg>
  )
}

/** Qualitative timeline strip with the record values and date span. */
export function QStrip({ labs, gradeOf }: { labs: LabResult[]; gradeOf: (v: string) => string }) {
  return (
    <div>
      <div className="mt-0.5 flex gap-[3px]">
        {labs.map((r) => {
          const g = gradeOf(r.valueText ?? '')
          const c = QCELL[g]
          return (
            <div
              key={r.id}
              className="flex h-[26px] min-w-0 flex-1 items-center justify-center rounded-md px-[2px] text-[10px] font-semibold"
              style={{ background: c.bg, color: c.fg }}
            >
              {r.valueText}
            </div>
          )
        })}
      </div>
      <div className="mt-0.5 flex justify-between text-[10px] text-muted-foreground">
        <span>{labs[0].date.slice(0, 7)}</span>
        <span>{labs[labs.length - 1].date.slice(0, 7)}</span>
      </div>
    </div>
  )
}

/** Mini qualitative strip of the last eight text values for row previews. */
export function QMini({ labs, gradeOf }: { labs: LabResult[]; gradeOf: (v: string) => string }) {
  return (
    <div className="flex flex-none items-center gap-[3px]">
      {labs.map((r) => (
        <i
          key={r.id}
          className="block h-[14px] w-[10px] rounded-[3px]"
          style={{ background: QCELL[gradeOf(r.valueText ?? '')].bg }}
        />
      ))}
    </div>
  )
}
