import { describe, expect, it } from 'vitest'
import { type Food, fmtNumber, fromServing, measure, parseGrams, perPortion } from './foods'

const yogurt: Food = {
  id: 'y',
  name: 'Greek Yogurt',
  brand: "Trader Joe's",
  emoji: '🫙',
  ...(() => {
    const { per100g, portion } = fromServing({ cal: 130, protein: 22, carbs: 9, fat: 2 }, '1 cup (227g)')
    return { per100g, portions: [portion, { label: '1 tbsp', grams: 15, gramsKnown: true }] }
  })(),
  source: 'label',
  verified: true,
  inStock: true,
  createdAt: 0,
  updatedAt: 0,
}

describe('parseGrams', () => {
  it.each([
    ['1 cup (227g)', 227],
    ['3 oz (85 g)', 85],
    ['28g', 28],
    ['1 cup cooked (140g)', 140],
    ['2 tbsp (32G)', 32],
  ])('reads %s', (label, grams) => expect(parseGrams(label)).toBe(grams))

  it.each(['1 serving', '1 cup (240ml)', '1/3 sec spray', '(0g)'])('returns null for %s', (label) =>
    expect(parseGrams(label)).toBeNull(),
  )
})

describe('fromServing', () => {
  it('converts a gram-labelled serving to per-100g with a known portion', () => {
    const { per100g, portion } = fromServing({ cal: 100, protein: 9, carbs: 1, fat: 6 }, '1 stick (28g)')
    expect(portion).toEqual({ label: '1 stick', grams: 28, gramsKnown: true })
    expect(per100g.cal).toBeCloseTo(357.14, 2)
  })

  it('keeps per-serving values exact when grams are unknown', () => {
    const { per100g, portion } = fromServing({ cal: 130, protein: 8, carbs: 12, fat: 5 }, '1 cup (240ml)')
    expect(portion).toEqual({ label: '1 cup (240ml)', grams: 100, gramsKnown: false })
    expect(per100g).toEqual({ cal: 130, protein: 8, carbs: 12, fat: 5 })
  })

  it('falls back to "1 serving" for an empty label', () => {
    expect(fromServing({ cal: 1, protein: 0, carbs: 0, fat: 0 }, '  ').portion.label).toBe('1 serving')
  })
})

describe('measure', () => {
  it('returns label values for one default portion', () => {
    const n = perPortion(yogurt)
    expect(n.cal).toBeCloseTo(130, 6)
    expect(n.protein).toBeCloseTo(22, 6)
  })

  it('scales by portion count and labels it', () => {
    const m = measure(yogurt, { kind: 'portion', index: 0, count: 1.5 })
    expect(m.grams).toBeCloseTo(340.5)
    expect(m.nutrients.protein).toBeCloseTo(33)
    expect(m.label).toBe('1.5 × 1 cup')
  })

  it('uses a second portion', () => {
    expect(measure(yogurt, { kind: 'portion', index: 1, count: 2 }).grams).toBe(30)
  })

  it('logs by grams', () => {
    const m = measure(yogurt, { kind: 'grams', grams: 150 })
    expect(m.label).toBe('150 g')
    expect(m.nutrients.protein).toBeCloseTo(14.54, 2)
  })

  it('refuses grams when no portion weight is known', () => {
    const milk: Food = { ...yogurt, portions: [{ label: '1 cup', grams: 100, gramsKnown: false }] }
    expect(() => measure(milk, { kind: 'grams', grams: 100 })).toThrow(/no known gram weight/)
  })

  it('rejects a missing portion or a non-positive count', () => {
    expect(() => measure(yogurt, { kind: 'portion', index: 5, count: 1 })).toThrow(RangeError)
    expect(() => measure(yogurt, { kind: 'portion', index: 0, count: 0 })).toThrow(RangeError)
  })
})

describe('fmtNumber', () => {
  it('drops trailing decimals and rounds to one place', () => {
    expect(fmtNumber(2)).toBe('2')
    expect(fmtNumber(1.25)).toBe('1.3')
  })
})
