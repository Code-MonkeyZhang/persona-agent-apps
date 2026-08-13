import { motion, useReducedMotion } from 'motion/react'
import type { DietEntry, Meal } from '../types'
import { mealMeta } from '../macroMeta'
import { Card, Row } from './ui/primitives'

// Render order; null covers any entry without an explicit meal
const ORDER: (Meal | null)[] = ['breakfast', 'lunch', 'dinner', 'snack', null]

interface Props {
  entries: DietEntry[]
}

/**
 * Shared meal-grouped list. Each meal becomes a labelled block with its
 * calorie subtotal and one row per food (food name + optional quantity).
 */
export function MealList({ entries }: Props) {
  const reduce = useReducedMotion()

  // Pre-filter visible meals so stagger indices stay contiguous (skipping
  // empty meals would otherwise leave gaps in the delay sequence).
  const blocks = ORDER.map((meal) => {
    const items = entries.filter((e) => e.meal === meal)
    if (items.length === 0) return null
    const subtotal = items.reduce((s, e) => s + e.calories, 0)
    const { label, icon: Icon } = mealMeta(meal)
    return { key: meal ?? 'other', items, subtotal, label, Icon }
  }).filter((b): b is NonNullable<typeof b> => b !== null)

  return (
    <>
      {blocks.map((b, i) => (
        <motion.div
          key={b.key}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.2,
            ease: [0.23, 1, 0.32, 1],
            delay: Math.min(i * 0.04, 0.16),
          }}
          className="mb-5"
        >
          <div className="flex items-center justify-between px-1 pb-1.5">
            <span className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
              <b.Icon size={14} />
              {b.label}
            </span>
            <span className="text-[13px] text-muted-foreground">{b.subtotal} kcal</span>
          </div>
          <Card>
            {b.items.map((e, j) => (
              <Row key={j} bordered={false}>
                <span>
                  {e.food}
                  {e.quantity && (
                    <span className="text-muted-foreground"> · {e.quantity}</span>
                  )}
                </span>
                <span className="font-medium">{e.calories} kcal</span>
              </Row>
            ))}
          </Card>
        </motion.div>
      ))}
    </>
  )
}
