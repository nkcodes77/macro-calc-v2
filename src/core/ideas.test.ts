import { describe, expect, it } from 'vitest'
import { foodFromRow, matchesQuery } from './catalog'
import { suggestMeals } from './ideas'

const foods = [
  foodFromRow(['Greek Yogurt', '🫙', '1 cup (227g)', 130, 22, 9, 2], 'y', 'TJ'),
  foodFromRow(['Chicken Strips', '🍗', '3 oz (85g)', 90, 19, 1, 1.5], 'c', 'TJ'),
  foodFromRow(['Jasmine Rice', '🍚', '1 cup (140g)', 210, 4, 45, 1], 'r', 'TJ'),
  foodFromRow(['Honey', '🍯', '1 tbsp (21g)', 60, 0, 17, 0], 'h', 'TJ'),
  { ...foodFromRow(['Steak', '🥩', '4 oz (112g)', 240, 24, 0, 16], 's', 'TJ'), inStock: false },
  foodFromRow(['Hot Sauce', '🌶️', '1 tsp (5g)', 0, 0, 0, 0], 'x', 'TJ'),
]

describe('suggestMeals', () => {
  const ideas = suggestMeals(foods, { cal: 600, protein: 50 })

  it('returns distinct combinations that stay within 3% of the calorie budget', () => {
    expect(ideas.length).toBeGreaterThan(0)
    expect(ideas.length).toBeLessThanOrEqual(6)
    for (const idea of ideas) expect(idea.total.cal).toBeLessThanOrEqual(618)
    const sigs = ideas.map((i) =>
      i.items
        .map((it) => it.food.id)
        .sort()
        .join(),
    )
    expect(new Set(sigs).size).toBe(sigs.length)
  })

  it('puts the highest-protein option first', () => {
    expect(ideas[0]!.total.protein).toBeGreaterThanOrEqual(45)
  })

  it('never uses out-of-stock or zero-calorie foods', () => {
    const ids = ideas.flatMap((i) => i.items.map((it) => it.food.id))
    expect(ids).not.toContain('s')
    expect(ids).not.toContain('x')
  })

  it('returns nothing when the budget is spent', () => {
    expect(suggestMeals(foods, { cal: 30, protein: 10 })).toEqual([])
  })

  it('handles a zero protein target and respects the limit', () => {
    expect(suggestMeals(foods, { cal: 400, protein: 0 }, 2)).toHaveLength(2)
  })
})

describe('matchesQuery', () => {
  it('matches word prefixes for every typed word', () => {
    expect(matchesQuery('Just Grilled Chicken Strips', 'gr chi')).toBe(true)
    expect(matchesQuery('Chicken Tikka Masala', 'sal')).toBe(false)
    expect(matchesQuery('Smoked Salmon', 'sal')).toBe(true)
    expect(matchesQuery('Anything', '  ')).toBe(true)
  })
})

describe('foodFromRow', () => {
  it('uses the row brand when given and starts unverified', () => {
    const f = foodFromRow(['Banana', '🍌', '1 medium (118g)', 105, 1, 27, 0, 'Fresh'], 'b', 'TJ', 5)
    expect(f).toMatchObject({ brand: 'Fresh', verified: false, source: 'manual', createdAt: 5 })
  })
})
