import { useLiveQuery } from 'dexie-react-hooks'
import type { DayKey } from '../core/dates'
import type { Entry, Food } from '../core/foods'
import { DEFAULT_GOALS, type Goals } from '../core/types'
import { repo } from '../db/repo'

export function useGoals(): Goals {
  return useLiveQuery(() => repo.getGoals(), [], DEFAULT_GOALS)
}

/** Pantry sorted by name. `undefined` while loading. */
export function useFoods(): Food[] | undefined {
  return useLiveQuery(() => repo.db.foods.orderBy('name').toArray(), [])
}

export function useEntries(date: DayKey): Entry[] | undefined {
  return useLiveQuery(() => repo.entriesFor(date), [date])
}
