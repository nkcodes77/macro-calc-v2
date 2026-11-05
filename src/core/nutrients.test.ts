import { describe, expect, it } from 'vitest'
import { add, caloriesFromMacros, forGrams, isPlausible, remaining, sum, ZERO } from './nutrients'

const greekYogurtPer100g = { cal: 57.3, protein: 9.7, carbs: 4, fat: 0.9 }

describe('forGrams', () => {
  it('scales per-100g values to the logged amount', () => {
    expect(forGrams(greekYogurtPer100g, 227)).toEqual({
      cal: expect.closeTo(130.07, 2),
      protein: expect.closeTo(22.02, 2),
      carbs: expect.closeTo(9.08, 2),
      fat: expect.closeTo(2.04, 2),
    })
  })

  it('returns zero for zero grams', () => {
    expect(forGrams(greekYogurtPer100g, 0)).toEqual(ZERO)
  })

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid gram amount %s', (g) => {
    expect(() => forGrams(greekYogurtPer100g, g)).toThrow(RangeError)
  })
})

describe('sum and remaining', () => {
  const egg = { cal: 70, protein: 6, carbs: 0, fat: 5 }

  it('adds nutrients field by field', () => {
    expect(add(egg, egg)).toEqual({ cal: 140, protein: 12, carbs: 0, fat: 10 })
  })

  it('sums an empty day to zero', () => {
    expect(sum([])).toEqual(ZERO)
  })

  it('keeps full precision across many entries', () => {
    const tenth = { cal: 0.1, protein: 0.1, carbs: 0.1, fat: 0.1 }
    expect(sum(Array.from({ length: 30 }, () => tenth)).cal).toBeCloseTo(3, 10)
  })

  it('reports negative remaining when over goal', () => {
    const goal = { cal: 2200, protein: 180, carbs: 220, fat: 65 }
    const eaten = { cal: 2300, protein: 150, carbs: 200, fat: 70 }
    expect(remaining(goal, eaten)).toEqual({ cal: -100, protein: 30, carbs: 20, fat: -5 })
  })
})

describe('plausibility check', () => {
  it('computes 4/4/9 calories', () => {
    expect(caloriesFromMacros({ protein: 10, carbs: 10, fat: 10 })).toBe(170)
  })

  it('accepts a real label', () => {
    expect(isPlausible({ cal: 140, protein: 13, carbs: 1, fat: 9 })).toBe(true)
  })

  it('flags a likely typo', () => {
    expect(isPlausible({ cal: 14, protein: 13, carbs: 1, fat: 9 })).toBe(false)
  })

  it('skips tiny foods where label rounding dominates', () => {
    expect(isPlausible({ cal: 0, protein: 0, carbs: 1, fat: 0 })).toBe(true)
  })

  it('respects a custom tolerance', () => {
    const n = { cal: 120, protein: 10, carbs: 10, fat: 4 } // implied 116
    expect(isPlausible(n, 0.01)).toBe(false)
    expect(isPlausible(n, 0.05)).toBe(true)
  })
})
