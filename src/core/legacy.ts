import { isDayKey } from './dates'
import { type Entry, type Food, fmtNumber, fromServing, MEALS, type Meal } from './foods'
import type { Nutrients } from './nutrients'
import { type Legacy, LegacySchema } from './schemas'
import type { Goals } from './types'

export interface Converted {
  goals: Goals
  foods: Food[]
  entries: Entry[]
  skipped: number
}

const clamp0 = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0)

/**
 * Converts data from the first Macro Calc app into the current model.
 * Throws a ZodError if `raw` is not that app's data. Days or meals it cannot read are counted in `skipped`.
 */
export function convertLegacy(raw: unknown, newId: () => string, now = Date.now()): Converted {
  const legacy: Legacy = LegacySchema.parse(raw)
  const foods: Food[] = []
  const byName = new Map<string, Food>()

  for (const item of legacy.pantry) {
    const serving: Nutrients = {
      cal: clamp0(item.cal),
      protein: clamp0(item.p),
      carbs: clamp0(item.c),
      fat: clamp0(item.f),
    }
    const { per100g, portion } = fromServing(serving, item.serving ?? '1 serving')
    const food: Food = {
      id: newId(),
      name: item.name.trim() || 'Food',
      brand: item.brand ?? '',
      emoji: item.emoji ?? '🍽️',
      per100g,
      portions: [portion],
      source: 'imported',
      verified: false,
      inStock: item.stock ?? true,
      createdAt: now,
      updatedAt: now,
    }
    foods.push(food)
    byName.set(food.name.toLowerCase(), food)
  }

  const entries: Entry[] = []
  let skipped = 0
  for (const [date, day] of Object.entries(legacy.days)) {
    if (!isDayKey(date)) {
      skipped++
      continue
    }
    for (const [mealName, items] of Object.entries(day)) {
      if (!(MEALS as readonly string[]).includes(mealName)) {
        skipped++
        continue
      }
      items.forEach((item, i) => {
        const qty = clamp0(item.qty)
        const food = byName.get(item.name.trim().toLowerCase())
        entries.push({
          id: newId(),
          date,
          meal: mealName as Meal,
          ...(food ? { foodId: food.id } : {}),
          name: item.name.trim() || 'Food',
          emoji: item.emoji ?? '🍽️',
          amount: qty === 1 ? '1 serving' : `${fmtNumber(qty)} servings`,
          nutrients: {
            cal: clamp0(item.cal) * qty,
            protein: clamp0(item.p) * qty,
            carbs: clamp0(item.c) * qty,
            fat: clamp0(item.f) * qty,
          },
          createdAt: now + i,
        })
      })
    }
  }

  const g = legacy.goals
  return {
    goals: { cal: g.cal > 0 ? g.cal : 2200, protein: clamp0(g.p), carbs: clamp0(g.c), fat: clamp0(g.f) },
    foods,
    entries,
    skipped,
  }
}
