import type { LucideIcon } from 'lucide-react'
import { Apple, Sandwich, Soup, Utensils } from 'lucide-react'
import type { Meal, MacroGoals } from './types'

export type MacroKey = keyof MacroGoals

/** Three macronutrients with their display label and chart color. */
export const MACROS: { key: MacroKey; label: string; color: string }[] = [
  { key: 'carbs', label: '碳水', color: '#f59e0b' },
  { key: 'protein', label: '蛋白质', color: '#3b82f6' },
  { key: 'fat', label: '脂肪', color: '#a855f7' },
]

/** Display label and icon for each meal type. */
export const MEAL_META: Record<Meal, { label: string; icon: LucideIcon }> = {
  breakfast: { label: '早餐', icon: Sandwich },
  lunch: { label: '午餐', icon: Soup },
  dinner: { label: '晚餐', icon: Utensils },
  snack: { label: '加餐', icon: Apple },
}

/** Resolve meal metadata, falling back to 其他 for uncategorized entries. */
export function mealMeta(meal: Meal | null): { label: string; icon: LucideIcon } {
  return meal ? MEAL_META[meal] : { label: '其他', icon: Utensils }
}
