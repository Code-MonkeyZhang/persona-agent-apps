import { motion, useReducedMotion } from 'motion/react'
import type { Metric } from '../types'
import { Card, Row, SectionLabel } from './ui/primitives'

interface Props {
  metrics: Metric[]
  filter: (m: Metric) => boolean
  formatValue: (m: Metric) => string
}

export function HistoryList({ metrics, filter, formatValue }: Props) {
  const reduce = useReducedMotion()
  const records = metrics.filter(filter).sort((a, b) => b.date.localeCompare(a.date))

  if (records.length === 0) {
    return null
  }

  return (
    <>
      <SectionLabel>历史记录</SectionLabel>
      <Card>
        {records.map((r, i) => (
          <motion.div
            key={r.date}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.2,
              ease: [0.23, 1, 0.32, 1],
              delay: Math.min(i * 0.04, 0.16),
            }}
          >
            <Row bordered={i !== records.length - 1}>
              <span className="text-[15px] text-muted-foreground">{r.date}</span>
              <span className="font-medium">{formatValue(r)}</span>
            </Row>
          </motion.div>
        ))}
      </Card>
    </>
  )
}
