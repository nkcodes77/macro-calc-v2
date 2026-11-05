/**
 * Core nutrition math. Pure functions only: no React, no storage, no DOM.
 * All internal math is done in grams and at full precision; round only for display.
 */

export interface Nutrients {
  /** kilocalories */
  cal: number
  /** grams */
  protein: number
  /** grams */
  carbs: number
  /** grams */
  fat: number
}

export const ZERO: Readonly<Nutrients> = Object.freeze({ cal: 0, protein: 0, carbs: 0, fat: 0 })

/** Nutrients for a given gram amount of a food whose values are stored per 100g. */
export function forGrams(per100g: Nutrients, grams: number): Nutrients {
  if (!Number.isFinite(grams) || grams < 0) {
    throw new RangeError(`grams must be a non-negative number, got ${grams}`)
  }
  const k = grams / 100
  return {
    cal: per100g.cal * k,
    protein: per100g.protein * k,
    carbs: per100g.carbs * k,
    fat: per100g.fat * k,
  }
}

export function add(a: Nutrients, b: Nutrients): Nutrients {
  return {
    cal: a.cal + b.cal,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
  }
}

export function sum(items: readonly Nutrients[]): Nutrients {
  return items.reduce<Nutrients>((acc, n) => add(acc, n), { ...ZERO })
}

/** Goal minus eaten. Negative values mean over the goal. */
export function remaining(goal: Nutrients, eaten: Nutrients): Nutrients {
  return {
    cal: goal.cal - eaten.cal,
    protein: goal.protein - eaten.protein,
    carbs: goal.carbs - eaten.carbs,
    fat: goal.fat - eaten.fat,
  }
}

/** Calories implied by macros (4 / 4 / 9 kcal per gram). */
export function caloriesFromMacros(n: Pick<Nutrients, 'protein' | 'carbs' | 'fat'>): number {
  return n.protein * 4 + n.carbs * 4 + n.fat * 9
}

/**
 * Flags label values whose stated calories disagree with their macros by more than `tolerance`
 * (default 15%). Small foods under 20 kcal are skipped because label rounding dominates.
 */
export function isPlausible(n: Nutrients, tolerance = 0.15): boolean {
  const implied = caloriesFromMacros(n)
  if (n.cal < 20 && implied < 20) return true
  const base = Math.max(n.cal, implied)
  return Math.abs(n.cal - implied) / base <= tolerance
}
