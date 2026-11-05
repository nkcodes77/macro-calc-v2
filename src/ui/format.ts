import { fromDayKey, type DayKey } from '../core/dates'

export const kcal = (n: number) => Math.round(n).toLocaleString('en-US')
export const grams = (n: number) => `${Math.round(n)}g`

export function dayLabel(key: DayKey, today: DayKey): string {
  if (key === today) return 'Today'
  const d = fromDayKey(key)
  const t = fromDayKey(today)
  const diff = Math.round((t.getTime() - d.getTime()) / 86_400_000)
  if (diff === 1) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function longDate(key: DayKey): string {
  return fromDayKey(key).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}
