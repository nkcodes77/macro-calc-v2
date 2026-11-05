import { describe, expect, it } from 'vitest'
import { convertLegacy } from './legacy'

let n = 0
const newId = () => `id${++n}`

const legacy = {
  goals: { cal: 2200, p: 180, c: 220, f: 65 },
  pantry: [
    {
      id: 1,
      name: "TJ's Low Fat Greek Yogurt",
      brand: "Trader Joe's",
      emoji: '🫙',
      serving: '1 cup (227g)',
      cal: 130,
      p: 22,
      c: 9,
      f: 2,
      stock: true,
    },
    { id: 2, name: 'Oat Milk', emoji: '🥛', serving: '1 cup (240ml)', cal: 120, p: 3, c: 16, f: 5, stock: false },
    { id: 1730000000000, name: 'Mystery', cal: 50, p: 1, c: 1, f: 1 },
  ],
  days: {
    '2026-11-03': {
      Breakfast: [{ name: "TJ's Low Fat Greek Yogurt", emoji: '🫙', cal: 130, p: 22, c: 9, f: 2, qty: 1.5 }],
      Lunch: [],
      Dinner: [{ name: 'Custom pizza', emoji: '🍕', cal: 600, p: 25, c: 70, f: 22, qty: 1 }],
      Snacks: [],
    },
    'not-a-date': { Breakfast: [] },
    '2026-11-04': { Brunch: [{ name: 'x', cal: 1, p: 0, c: 0, f: 0, qty: 1 }] },
  },
}

describe('convertLegacy', () => {
  const out = convertLegacy(legacy, newId, 1000)

  it('keeps goals', () => {
    expect(out.goals).toEqual({ cal: 2200, protein: 180, carbs: 220, fat: 65 })
  })

  it('converts pantry foods with gram weights where the label has them', () => {
    expect(out.foods).toHaveLength(3)
    const [yogurt, milk, mystery] = out.foods
    expect(yogurt?.portions[0]).toEqual({ label: '1 cup', grams: 227, gramsKnown: true })
    expect(yogurt?.source).toBe('imported')
    expect(yogurt?.verified).toBe(false)
    expect(milk?.portions[0]?.gramsKnown).toBe(false)
    expect(milk?.inStock).toBe(false)
    expect(mystery?.brand).toBe('')
    expect(mystery?.emoji).toBe('🍽️')
  })

  it('imports history with exact logged totals and links known foods', () => {
    expect(out.entries).toHaveLength(2)
    const [breakfast, dinner] = out.entries
    expect(breakfast).toMatchObject({
      date: '2026-11-03',
      meal: 'Breakfast',
      amount: '1.5 servings',
      foodId: out.foods[0]?.id,
    })
    expect(breakfast?.nutrients).toEqual({ cal: 195, protein: 33, carbs: 13.5, fat: 3 })
    expect(dinner?.foodId).toBeUndefined()
    expect(dinner?.amount).toBe('1 serving')
  })

  it('counts days and meals it could not read', () => {
    expect(out.skipped).toBe(2)
  })

  it('falls back to a default calorie goal and clamps bad numbers', () => {
    const odd = convertLegacy(
      {
        goals: { cal: 0, p: -5, c: 10, f: 10 },
        pantry: [{ id: 'a', name: '  ', cal: -1, p: null, c: 1, f: 1 }],
        days: {},
      },
      newId,
    )
    expect(odd.goals).toEqual({ cal: 2200, protein: 0, carbs: 10, fat: 10 })
    expect(odd.foods[0]?.name).toBe('Food')
    expect(odd.foods[0]?.per100g.cal).toBe(0)
  })

  it('rejects data that is not from the old app', () => {
    expect(() => convertLegacy({ hello: 'world' }, newId)).toThrow()
  })
})
