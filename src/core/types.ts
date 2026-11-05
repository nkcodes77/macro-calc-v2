import type { Nutrients } from './nutrients'

/** Daily targets. Same units as Nutrients. */
export type Goals = Nutrients

export const DEFAULT_GOALS: Goals = { cal: 2200, protein: 180, carbs: 220, fat: 65 }
