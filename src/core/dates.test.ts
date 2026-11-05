import { describe, expect, it } from 'vitest'
import { addDays, dayKey, fromDayKey, isDayKey } from './dates'

describe('day keys', () => {
  it('uses the local calendar day, not UTC', () => {
    expect(dayKey(new Date(2026, 10, 5, 23, 30))).toBe('2026-11-05')
    expect(dayKey(new Date(2026, 0, 1, 0, 5))).toBe('2026-01-01')
  })

  it('round-trips and validates', () => {
    expect(dayKey(fromDayKey('2026-03-08'))).toBe('2026-03-08')
    expect(isDayKey('2026-11-05')).toBe(true)
    expect(isDayKey('2026-02-30')).toBe(false)
    expect(isDayKey('11/05/2026')).toBe(false)
  })

  it('adds days across month, year and DST boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-08', -1)).toBe('2026-03-07')
    expect(addDays('2026-11-01', 1)).toBe('2026-11-02')
  })

  it('defaults to today', () => {
    expect(dayKey()).toBe(dayKey(new Date()))
  })
})
