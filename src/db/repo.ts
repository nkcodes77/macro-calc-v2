import { dayKey, type DayKey } from '../core/dates'
import { type Amount, type Entry, type Food, measure, type Meal } from '../core/foods'
import { convertLegacy } from '../core/legacy'
import { sum, type Nutrients } from '../core/nutrients'
import { type Backup, BACKUP_FORMAT, BACKUP_VERSION, BackupSchema, FoodSchema, GoalsSchema } from '../core/schemas'
import { DEFAULT_GOALS, type Goals } from '../core/types'
import { db as defaultDb, type MacroDB } from './db'

export const newId = (): string => crypto.randomUUID()

const KEY_GOALS = 'goals'
const KEY_LEGACY_IMPORTED = 'legacyImportedAt'
const KEY_PRE_IMPORT = 'preImportSnapshot'

export function createRepo(db: MacroDB = defaultDb) {
  return {
    db,

    async getGoals(): Promise<Goals> {
      const row = await db.settings.get(KEY_GOALS)
      const parsed = GoalsSchema.safeParse(row?.value)
      return parsed.success ? parsed.data : DEFAULT_GOALS
    },

    async setGoals(goals: Goals): Promise<void> {
      await db.settings.put({ key: KEY_GOALS, value: GoalsSchema.parse(goals) })
    },

    async saveFood(food: Food): Promise<void> {
      await db.foods.put(FoodSchema.parse({ ...food, updatedAt: Date.now() }) as Food)
    },

    async deleteFood(id: string): Promise<void> {
      // History keeps its snapshot; only the link is dropped.
      await db.transaction('rw', db.foods, db.entries, async () => {
        await db.foods.delete(id)
        await db.entries
          .where('foodId')
          .equals(id)
          .modify((e) => {
            delete e.foodId
          })
      })
    },

    async setInStock(id: string, inStock: boolean): Promise<void> {
      await db.foods.update(id, { inStock, updatedAt: Date.now() })
    },

    async logFood(food: Food, amount: Amount, meal: Meal, date: DayKey = dayKey()): Promise<Entry> {
      const m = measure(food, amount)
      const entry: Entry = {
        id: newId(),
        date,
        meal,
        foodId: food.id,
        name: food.name,
        emoji: food.emoji,
        amount: m.label,
        nutrients: m.nutrients,
        createdAt: Date.now(),
      }
      await db.entries.add(entry)
      return entry
    },

    async logQuick(
      item: { name: string; emoji: string; nutrients: Nutrients },
      meal: Meal,
      date: DayKey = dayKey(),
    ): Promise<Entry> {
      const entry: Entry = {
        id: newId(),
        date,
        meal,
        name: item.name.trim() || 'Food',
        emoji: item.emoji || '🍽️',
        amount: '1 serving',
        nutrients: item.nutrients,
        createdAt: Date.now(),
      }
      await db.entries.add(entry)
      return entry
    },

    async deleteEntry(id: string): Promise<void> {
      await db.entries.delete(id)
    },

    async entriesFor(date: DayKey): Promise<Entry[]> {
      return db.entries.where('date').equals(date).sortBy('createdAt')
    },

    /** Totals per day, newest first. */
    async history(limit = 60): Promise<{ date: DayKey; total: Nutrients; count: number }[]> {
      const all = await db.entries.toArray()
      const byDay = new Map<DayKey, Nutrients[]>()
      for (const e of all) {
        const list = byDay.get(e.date) ?? []
        list.push(e.nutrients)
        byDay.set(e.date, list)
      }
      return [...byDay.entries()]
        .sort(([a], [b]) => (a < b ? 1 : -1))
        .slice(0, limit)
        .map(([date, list]) => ({ date, total: sum(list), count: list.length }))
    },

    async isEmpty(): Promise<boolean> {
      return (await db.foods.count()) === 0 && (await db.entries.count()) === 0
    },

    async exportBackup(): Promise<Backup> {
      return {
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        goals: await this.getGoals(),
        foods: await db.foods.toArray(),
        entries: await db.entries.toArray(),
      }
    },

    /**
     * Replaces all data with a backup. Accepts this app's backups and the first app's data.
     * The previous data is kept in settings so a bad import can be undone.
     */
    async importBackup(raw: unknown): Promise<{ foods: number; entries: number; skipped: number }> {
      const parsed = BackupSchema.safeParse(raw)
      let data: { goals: Goals; foods: Food[]; entries: Entry[]; skipped: number }
      if (parsed.success) {
        data = {
          ...parsed.data,
          foods: parsed.data.foods as Food[],
          entries: parsed.data.entries as Entry[],
          skipped: 0,
        }
      } else {
        try {
          data = convertLegacy(raw, newId)
        } catch {
          throw new Error("That file isn't a Macro Calc backup")
        }
      }
      const previous = await this.exportBackup()
      await db.transaction('rw', db.foods, db.entries, db.settings, async () => {
        await db.settings.put({ key: KEY_PRE_IMPORT, value: previous })
        await db.foods.clear()
        await db.entries.clear()
        await db.foods.bulkAdd(data.foods)
        await db.entries.bulkAdd(data.entries)
        await db.settings.put({ key: KEY_GOALS, value: data.goals })
      })
      return { foods: data.foods.length, entries: data.entries.length, skipped: data.skipped }
    },

    async undoImport(): Promise<boolean> {
      const row = await db.settings.get(KEY_PRE_IMPORT)
      const parsed = BackupSchema.safeParse(row?.value)
      if (!parsed.success) return false
      await db.transaction('rw', db.foods, db.entries, db.settings, async () => {
        await db.foods.clear()
        await db.entries.clear()
        await db.foods.bulkAdd(parsed.data.foods as Food[])
        await db.entries.bulkAdd(parsed.data.entries as Entry[])
        await db.settings.put({ key: KEY_GOALS, value: parsed.data.goals })
        await db.settings.delete(KEY_PRE_IMPORT)
      })
      return true
    },

    async canUndoImport(): Promise<boolean> {
      return (await db.settings.get(KEY_PRE_IMPORT)) !== undefined
    },

    async markLegacyImported(): Promise<void> {
      await db.settings.put({ key: KEY_LEGACY_IMPORTED, value: Date.now() })
    },

    async legacyImportedAt(): Promise<number | null> {
      const v = (await db.settings.get(KEY_LEGACY_IMPORTED))?.value
      return typeof v === 'number' ? v : null
    },

    async addFoods(foods: Food[]): Promise<void> {
      await db.foods.bulkPut(foods)
    },
  }
}

export type Repo = ReturnType<typeof createRepo>
export const repo = createRepo()
