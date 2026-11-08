import { useParams } from 'react-router'
import type { Metric } from '../types'
import { useI18n } from '../i18n'
import { useDrill, routes } from '@/lib/router'
import { DetailHeader } from './DetailHeader'
import { BpChart, MetricChart } from './LabCharts'

/**
 * Routine checks: the three fixed vital entries. Blood pressure drills into
 * a dual-line chart against the 130 / 80 targets, weight and heart rate into
 * single-series charts; all three come from the daily metrics table.
 */

const BP_SYS_TARGET = 130
const BP_DIA_TARGET = 80

function bpSeries(metrics: Metric[]) {
  return metrics
    .filter((m) => m.systolic != null && m.diastolic != null)
    .map((m) => ({ date: m.date, sys: m.systolic as number, dia: m.diastolic as number }))
}

function metricSeries(metrics: Metric[], key: 'weight' | 'heartRate') {
  return metrics
    .filter((m) => m[key] != null)
    .map((m) => ({ date: m.date, value: m[key] as number }))
}

function fmt(v: number): string {
  return String(Math.round(v * 100) / 100)
}

/** Routine landing: three fixed rows with their latest value and caption. */
export function RoutinePage({ metrics, onBack }: { metrics: Metric[]; onBack: () => void }) {
  const { t } = useI18n()
  const drill = useDrill()
  const bp = bpSeries(metrics)
  const weight = metricSeries(metrics, 'weight')
  const hr = metricSeries(metrics, 'heartRate')
  const bpLast = bp[bp.length - 1]
  const bpOver = !!bpLast && (bpLast.sys > BP_SYS_TARGET || bpLast.dia > BP_DIA_TARGET)

  return (
    <div>
      <DetailHeader title={t('disease.routine')} onBack={onBack} />
      <div className="mb-5 rounded-xl bg-card px-4">
        <div
          className="flex cursor-pointer items-center justify-between border-b border-border py-2.5 press"
          onClick={() => drill(routes.routineBp())}
        >
          <span className="text-[15px] font-medium">{t('disease.bp')}</span>
          <span className={`text-[15px] font-bold ${bpOver ? 'text-[#b91c1c]' : ''}`}>
            {bpLast ? `${bpLast.sys} / ${bpLast.dia}${bpOver ? ' ↑' : ''}` : '—'}
          </span>
        </div>
        <div className="pb-2 pt-1 text-[10.5px] text-muted-foreground">
          {bpLast
            ? `${t('disease.lastDate', { date: bpLast.date })} · ${t('disease.bpTarget')}`
            : t('disease.noRecord')}
        </div>
        <div
          className="flex cursor-pointer items-center justify-between border-b border-border py-2.5 press"
          onClick={() => drill(routes.routineMetric('weight'))}
        >
          <span className="text-[15px] font-medium">{t('disease.weight')}</span>
          <span className="text-[15px] font-bold">
            {weight.length ? `${fmt(weight[weight.length - 1].value)} kg` : '—'}
          </span>
        </div>
        <div className="pb-2 pt-1 text-[10.5px] text-muted-foreground">
          {weight.length
            ? `${t('disease.lastDate', { date: weight[weight.length - 1].date })} · ${t(
                'disease.firstRec',
                { v: `${fmt(weight[0].value)} kg` }
              )}`
            : t('disease.noRecord')}
        </div>
        <div
          className="flex cursor-pointer items-center justify-between border-b border-border py-2.5 press"
          onClick={() => drill(routes.routineMetric('hr'))}
        >
          <span className="text-[15px] font-medium">{t('disease.hr')}</span>
          <span className="text-[15px] font-bold">
            {hr.length ? `${fmt(hr[hr.length - 1].value)} ${t('disease.hrUnit')}` : '—'}
          </span>
        </div>
        <div className="pb-2 pt-1 text-[10.5px] text-muted-foreground">{t('disease.hrRange')}</div>
      </div>
    </div>
  )
}

/** Blood pressure detail: dual lines against the two target lines. */
export function BpDetail({ metrics, onBack }: { metrics: Metric[]; onBack: () => void }) {
  const { t } = useI18n()
  const bp = bpSeries(metrics)
  return (
    <div>
      <DetailHeader title={t('disease.bp')} onBack={onBack} />
      <div className="mb-5 rounded-xl bg-card px-3.5 pb-2.5 pt-3">
        <div className="mb-2.5 text-[11.5px] text-muted-foreground">
          mmHg · {t('disease.bpCaption')}
        </div>
        {bp.length >= 2 ? (
          <BpChart series={bp} />
        ) : (
          <div className="rounded-[10px] border border-border bg-[#fafafa] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#52525b]">
            {t('disease.twoPoints')}
          </div>
        )}
      </div>
      {bp.length > 0 && (
        <div className="mb-5 rounded-xl bg-card px-3.5 py-1">
          {[...bp].reverse().map((p) => {
            const over = p.sys > BP_SYS_TARGET || p.dia > BP_DIA_TARGET
            return (
              <div
                key={p.date}
                className="flex items-baseline justify-between border-b border-border py-[7px] text-[12.5px] last:border-b-0"
              >
                <span className="text-[11px] text-muted-foreground">{p.date}</span>
                <span className={`tabular-nums ${over ? 'font-bold text-[#b91c1c]' : ''}`}>
                  {p.sys} / {p.dia}
                  {over ? ' ↑' : ''}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Weight or heart rate detail against its own reference behavior. */
export function MetricDetail({ metrics, onBack }: { metrics: Metric[]; onBack: () => void }) {
  const { t } = useI18n()
  const { metric = '' } = useParams()
  const key = metric === 'hr' ? 'heartRate' : 'weight'
  const meta =
    key === 'heartRate'
      ? {
          title: t('disease.hr'),
          unit: t('disease.hrUnit'),
          lo: 60,
          hi: 100,
          caption: t('disease.hrRange'),
        }
      : {
          title: t('disease.weight'),
          unit: 'kg',
          lo: null,
          hi: null,
          caption: t('disease.noRefBase'),
        }
  const series = metricSeries(metrics, key as 'weight' | 'heartRate')

  return (
    <div>
      <DetailHeader title={meta.title} onBack={onBack} />
      <div className="mb-5 rounded-xl bg-card px-3.5 pb-2.5 pt-3">
        <div className="mb-2.5 text-[11.5px] text-muted-foreground">
          {meta.unit} · {meta.caption}
        </div>
        {series.length >= 2 ? (
          <MetricChart series={series} lo={meta.lo} hi={meta.hi} />
        ) : (
          <div className="rounded-[10px] border border-border bg-[#fafafa] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#52525b]">
            {t('disease.twoPoints')}
          </div>
        )}
      </div>
      {series.length > 0 && (
        <div className="mb-5 rounded-xl bg-card px-3.5 py-1">
          {[...series].reverse().map((p) => (
            <div
              key={p.date}
              className="flex items-baseline justify-between border-b border-border py-[7px] text-[12.5px] last:border-b-0"
            >
              <span className="text-[11px] text-muted-foreground">{p.date}</span>
              <span className="tabular-nums">
                {fmt(p.value)}
                <span className="ml-0.5 text-[10px] text-muted-foreground">{meta.unit}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
