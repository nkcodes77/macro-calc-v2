import Dexie, { type EntityTable } from 'dexie'
import type { Entry, Food } from '../core/foods'

export interface Setting {
  key: string
  value: unknown
}

/**
 * IndexedDB database. Schema changes MUST add a new `this.version(n)` block with an upgrade function and a
 * migration test in db.test.ts. Never edit an existing version block.
 */
export class MacroDB extends Dexie {
  foods!: EntityTable<Food, 'id'>
  entries!: EntityTable<Entry, 'id'>
  settings!: EntityTable<Setting, 'key'>

  constructor(name = 'macro-calc') {
    super(name)
    this.version(1).stores({
      foods: 'id, name, inStock, updatedAt',
      entries: 'id, date, [date+meal], foodId, createdAt',
      settings: 'key',
    })
  }
}

export const db = new MacroDB()
