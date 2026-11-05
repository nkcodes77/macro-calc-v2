import type { DayKey } from './dates'
import { forGrams, type Nutrients } from './nutrients'

export const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'] as const
export type Meal = (typeof MEALS)[number]

export const SOURCES = ['label', 'usda', 'off', 'manual', 'imported'] as const
export type Source = (typeof SOURCES)[number]

export interface Portion {
  /** What the user sees, e.g. "1 stick" or "1 cup". */
  label: string
  /** Gram weight of one portion. */
  grams: number
  /**
   * False when the real weight is unknown (e.g. "1 serving" or a ml-based label). Then `grams` is a
   * stand-in of 100 so that per-100g math still yields correct per-portion values, and logging by grams is disabled.
   */
  gramsKnown: boolean
}

export interface Food {
  id: string
  name: string
  brand: string
  emoji: string
  /** Nutrients per 100 g. All math is done in grams. */
  per100g: Nutrients
  /** At least one. The first is the default when logging. */
  portions: Portion[]
  source: Source
  verified: boolean
  inStock: boolean
  createdAt: number
  updatedAt: number
}

export interface Entry {
  id: string
  date: DayKey
  meal: Meal
  /** Absent for one-off quick entries or imported history whose food no longer exists. */
  foodId?: string
  /** Snapshot so history never changes when a food is later edited. */
  name: string
  emoji: string
  /** Human description of the amount, e.g. "2 × 1 stick" or "150 g". */
  amount: string
  nutrients: Nutrients
  createdAt: number
}

export type Amount = { kind: 'portion'; index: number; count: number } | { kind: 'grams'; grams: number }

/** Resolves an amount of a food to grams, nutrients and a display label. */
export function measure(food: Food, amount: Amount): { grams: number; nutrients: Nutrients; label: string } {
  if (amount.kind === 'grams') {
    if (!food.portions.some((p) => p.gramsKnown)) {
      throw new Error(`${food.name} has no known gram weight; log it by portion`)
    }
    return {
      grams: amount.grams,
      nutrients: forGrams(food.per100g, amount.grams),
      label: `${fmtNumber(amount.grams)} g`,
    }
  }
  const portion = food.portions[amount.index]
  if (!portion) throw new RangeError(`${food.name} has no portion ${amount.index}`)
  if (!Number.isFinite(amount.count) || amount.count <= 0) {
    throw new RangeError(`count must be positive, got ${amount.count}`)
  }
  const grams = portion.grams * amount.count
  return {
    grams,
    nutrients: forGrams(food.per100g, grams),
    label: amount.count === 1 ? portion.label : `${fmtNumber(amount.count)} × ${portion.label}`,
  }
}

/** Nutrients for one default portion, which is what lists show. */
export function perPortion(food: Food, index = 0): Nutrients {
  return measure(food, { kind: 'portion', index, count: 1 }).nutrients
}

/**
 * Builds per-100g values and a portion from label-style per-serving values.
 * `servingLabel` like "1 cup (227g)" yields a known gram weight; anything else keeps per-serving values exact.
 */
export function fromServing(serving: Nutrients, servingLabel: string): { per100g: Nutrients; portion: Portion } {
  const grams = parseGrams(servingLabel)
  const label = servingLabel.replace(/\s*\([^)]*\)\s*$/, '').trim() || servingLabel.trim() || '1 serving'
  if (grams === null) {
    return {
      per100g: { ...serving },
      portion: { label: servingLabel.trim() || '1 serving', grams: 100, gramsKnown: false },
    }
  }
  const k = 100 / grams
  return {
    per100g: { cal: serving.cal * k, protein: serving.protein * k, carbs: serving.carbs * k, fat: serving.fat * k },
    portion: { label, grams, gramsKnown: true },
  }
}

/** Extracts a gram weight from labels like "1 cup (227g)", "3 oz (85 g)" or "28g". Returns null if none. */
export function parseGrams(label: string): number | null {
  const m = /(\d+(?:\.\d+)?)\s*g\b/i.exec(label)
  if (!m?.[1]) return null
  const grams = Number(m[1])
  return grams > 0 ? grams : null
}

export function fmtNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10)
}
