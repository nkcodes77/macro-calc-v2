import type { Food } from './foods'
import { perPortion } from './foods'
import { add, type Nutrients, ZERO } from './nutrients'

export interface IdeaItem {
  food: Food
  count: number
}

export interface Idea {
  items: IdeaItem[]
  total: Nutrients
}

const COUNTS = [0.5, 1, 1.5, 2, 3] as const

/**
 * Suggests up to `limit` meals from in-stock foods (default portion each) that use the given calorie budget
 * and get as close as possible to the protein target, without going more than 3% over calories.
 * Scoring favors protein first, then using the calorie budget. Combinations use one to three foods.
 */
export function suggestMeals(foods: readonly Food[], target: { cal: number; protein: number }, limit = 6): Idea[] {
  if (target.cal < 50) return []
  const pool = foods.filter((f) => f.inStock && perPortion(f).cal > 0)
  const per = new Map(pool.map((f) => [f.id, perPortion(f)]))
  const scored: { idea: Idea; score: number }[] = []

  const consider = (items: IdeaItem[]) => {
    let total: Nutrients = { ...ZERO }
    for (const it of items) {
      const p = per.get(it.food.id)!
      total = add(total, {
        cal: p.cal * it.count,
        protein: p.protein * it.count,
        carbs: p.carbs * it.count,
        fat: p.fat * it.count,
      })
    }
    if (total.cal > target.cal * 1.03) return
    const proteinRatio = target.protein > 0 ? Math.min(total.protein / target.protein, 1.15) : 0
    const score = proteinRatio * 100 + (total.cal / target.cal) * 40
    scored.push({ idea: { items, total }, score })
  }

  for (let i = 0; i < pool.length; i++) {
    const a = pool[i]!
    for (const ca of COUNTS) {
      consider([{ food: a, count: ca }])
      for (let j = i + 1; j < pool.length; j++) {
        const b = pool[j]!
        for (const cb of COUNTS) {
          consider([
            { food: a, count: ca },
            { food: b, count: cb },
          ])
          for (let k = j + 1; k < pool.length; k++) {
            const c = pool[k]!
            for (const cc of [1, 2]) {
              consider([
                { food: a, count: ca },
                { food: b, count: cb },
                { food: c, count: cc },
              ])
            }
          }
        }
      }
    }
  }

  scored.sort((x, y) => y.score - x.score)
  const seen = new Set<string>()
  const out: Idea[] = []
  for (const s of scored) {
    const sig = s.idea.items
      .map((it) => it.food.id)
      .sort()
      .join('|')
    if (seen.has(sig)) continue
    seen.add(sig)
    out.push(s.idea)
    if (out.length >= limit) break
  }
  return out
}
