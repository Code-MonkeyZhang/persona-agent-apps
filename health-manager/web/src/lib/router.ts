import { useCallback } from 'react'
import { useNavigate } from 'react-router'

/**
 * Navigate with a forward direction marker so the page transition plays a
 * push animation instead of a tab fade.
 */
export function useDrill() {
  const navigate = useNavigate()
  return useCallback(
    (to: string) => navigate(to, { state: { dir: 1 } }),
    [navigate]
  )
}

/** Route path builders so every path shape lives in one place. */
export const routes = {
  analyte: (name: string) => `/disease/analyte/${encodeURIComponent(name)}`,
  labCategory: (category: string) =>
    `/disease/labs/${encodeURIComponent(category)}`,
  strength: (exercise: string, metric: string) =>
    `/fitness/strength/${encodeURIComponent(exercise)}?metric=${encodeURIComponent(metric)}`,
}
