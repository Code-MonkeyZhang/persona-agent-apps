import type { LucideIcon } from 'lucide-react'
import { Apple, Sandwich, Soup, Utensils } from 'lucide-react'
import type { Meal, MacroGoals } from './types'
import type { TKey } from './i18n/locales'

export type MacroKey = keyof MacroGoals

/** Three macronutrients with their display label and chart color. */
export const MACROS: { key: MacroKey; label: TKey; color: string }[] = [
  { key: 'carbs', label: 'macro.carbs', color: '#f59e0b' },
  { key: 'protein', label: 'macro.protein', color: '#3b82f6' },
  { key: 'fat', label: 'macro.fat', color: '#a855f7' },
]

/** Display label and icon for each meal type. */
export const MEAL_META: Record<Meal, { label: TKey; icon: LucideIcon }> = {
  breakfast: { label: 'meal.breakfast', icon: Sandwich },
  lunch: { label: 'meal.lunch', icon: Soup },
  dinner: { label: 'meal.dinner', icon: Utensils },
  snack: { label: 'meal.snack', icon: Apple },
}

/** Resolve meal metadata, falling back to 其他 for uncategorized entries. */
export function mealMeta(meal: Meal | null): { label: TKey; icon: LucideIcon } {
  return meal ? MEAL_META[meal] : { label: 'common.other', icon: Utensils }
}
