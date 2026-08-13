import type { Variants } from 'motion/react'

/**
 * Directional push variants: forward (drill in) slides in from the right,
 * backward (back) slides in from the left. Reads like an iOS nav stack.
 */
export const pushVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir >= 0 ? 24 : -24 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir >= 0 ? -24 : 24 }),
}

/** Reduced-motion fallback: drop the geometric transform, keep the fade. */
export const fadeVariants: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
}

export const PAGE_TRANSITION = { duration: 0.26, ease: [0.23, 1, 0.32, 1] as const }
