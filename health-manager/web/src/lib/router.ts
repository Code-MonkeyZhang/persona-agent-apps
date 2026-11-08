import { useCallback } from 'react'
import { useNavigate } from 'react-router'

/**
 * Entry base of the app, frozen at module load before any client-side
 * routing runs. The page is only ever served at a shell entry URL, which is
 * the app root, the /mobile entry, or the /apps/<name> prefix when persona
 * agent proxies the panel, so the load-time pathname minus its trailing
 * slash is always the base. The router strips it as its basename and the
 * WebSocket pins to it, which keeps both correct in every hosting context.
 */
export const ENTRY_BASE = location.pathname.replace(/\/+$/, '')

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
  subcat: (sub: string) => `/disease/subcat/${encodeURIComponent(sub)}`,
  routineBp: () => '/disease/routine/bp',
  routineMetric: (key: string) => `/disease/routine/${encodeURIComponent(key)}`,
  strength: (exercise: string, metric: string) =>
    `/fitness/strength/${encodeURIComponent(exercise)}?metric=${encodeURIComponent(metric)}`,
}
