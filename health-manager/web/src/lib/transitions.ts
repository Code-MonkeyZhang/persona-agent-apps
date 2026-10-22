import type { Variants } from 'motion/react'

/**
 * Directional page variants driven by router state: 0 is a tab switch and
 * fades in place, 1 slides in from the right edge like an iOS push, -1
 * reveals from the left quarter like an iOS pop. Runs under popLayout so
 * both pages animate at the same time.
 */
export const pageVariants: Variants = {
  enter: (dir: number) =>
    dir === 0 ? { opacity: 0, y: 8 } : { opacity: 1, x: dir > 0 ? '100%' : '-25%' },
  center: { opacity: 1, x: '0%', y: 0 },
  exit: (dir: number) =>
    dir === 0 ? { opacity: 0, y: -8 } : { opacity: 1, x: dir > 0 ? '-25%' : '100%' },
}

/** Reduced-motion fallback: drop the geometric transform, keep the fade. */
export const fadeVariants: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
}

export const PAGE_TRANSITION = { duration: 0.26, ease: [0.23, 1, 0.32, 1] as const }
