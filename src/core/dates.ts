/** Log days are keyed by the user's LOCAL calendar day, never UTC, so a 11pm snack lands on the right day. */

export type DayKey = string // 'YYYY-MM-DD'

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/

export function dayKey(date: Date = new Date()): DayKey {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function isDayKey(value: string): value is DayKey {
  if (!DAY_KEY.test(value)) return false
  return dayKey(fromDayKey(value)) === value
}

/** Noon local time on that day, which is safe from DST edges. */
export function fromDayKey(key: DayKey): Date {
  const [y, m, d] = key.split('-').map(Number) as [number, number, number]
  return new Date(y, m - 1, d, 12)
}

export function addDays(key: DayKey, days: number): DayKey {
  const date = fromDayKey(key)
  date.setDate(date.getDate() + days)
  return dayKey(date)
}
