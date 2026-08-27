import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { TFunc } from '../i18n'

/** Merge Tailwind classes with conditional logic, de-duping conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format seconds as a human-readable duration, e.g. "25 分钟" / "4 分 30 秒". */
export function formatDuration(totalSeconds: number, t: TFunc): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (seconds === 0) return t('duration.minutes', { n: minutes })
  if (minutes === 0) return t('duration.seconds', { n: seconds })
  return t('duration.compound', { m: minutes, s: seconds })
}

/** Format an ISO timestamp as a short relative label, e.g. "今天 14:30". */
export function formatTime(iso: string, t: TFunc): string {
  const d = new Date(iso)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  const time = `${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes()
  ).padStart(2, '0')}`

  if (d.toDateString() === now.toDateString()) return t('time.today', { time })
  if (d.toDateString() === yesterday.toDateString())
    return t('time.yesterday', { time })
  return `${d.getMonth() + 1}/${d.getDate()} ${time}`
}
