import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { foodFromRow } from '../core/catalog'
import { DEFAULT_GOALS } from '../core/types'
import { MacroDB } from './db'
import { readLegacy } from './legacy-source'
import { createRepo, type Repo } from './repo'

let repo: Repo
let db: MacroDB

beforeEach(async () => {
  db = new MacroDB(`test-${crypto.randomUUID()}`)
  repo = createRepo(db)
})
afterEach(async () => {
  await db.delete()
})

const yogurt = () => foodFromRow(['Greek Yogurt', '🫙', '1 cup (227g)', 130, 22, 9, 2], 'yog', "Trader Joe's")

describe('goals', () => {
  it('defaults, saves and validates', async () => {
    expect(await repo.getGoals()).toEqual(DEFAULT_GOALS)
    await repo.setGoals({ cal: 2000, protein: 170, carbs: 200, fat: 60 })
    expect((await repo.getGoals()).protein).toBe(170)
    await expect(repo.setGoals({ cal: -1, protein: 1, carbs: 1, fat: 1 })).rejects.toThrow()
  })
})

describe('foods and logging', () => {
  it('logs a food by portion and by grams for a given day', async () => {
    const food = yogurt()
    await repo.saveFood(food)
    await repo.logFood(food, { kind: 'portion', index: 0, count: 2 }, 'Breakfast', '2026-11-05')
    await repo.logFood(food, { kind: 'grams', grams: 100 }, 'Snacks', '2026-11-05')
    await repo.logFood(food, { kind: 'grams', grams: 100 }, 'Snacks', '2026-11-04')
    const today = await repo.entriesFor('2026-11-05')
    expect(today.map((e) => e.amount)).toEqual(['2 × 1 cup', '100 g'])
    expect(today[0]!.nutrients.protein).toBeCloseTo(44)
  })

  it('logs a quick entry with fallbacks', async () => {
    const e = await repo.logQuick(
      { name: ' ', emoji: '', nutrients: { cal: 500, protein: 30, carbs: 40, fat: 20 } },
      'Dinner',
    )
    expect(e).toMatchObject({ name: 'Food', emoji: '🍽️', amount: '1 serving' })
    await repo.deleteEntry(e.id)
    expect(await db.entries.count()).toBe(0)
  })

  it('rejects an invalid food', async () => {
    await expect(repo.saveFood({ ...yogurt(), name: '' })).rejects.toThrow()
  })

  it('toggles stock', async () => {
    await repo.saveFood(yogurt())
    await repo.setInStock('yog', false)
    expect((await db.foods.get('yog'))?.inStock).toBe(false)
  })

  it('deleting a food keeps history but drops the link', async () => {
    const food = yogurt()
    await repo.saveFood(food)
    const e = await repo.logFood(food, { kind: 'portion', index: 0, count: 1 }, 'Lunch', '2026-11-05')
    await repo.deleteFood(food.id)
    const kept = await db.entries.get(e.id)
    expect(kept?.name).toBe('Greek Yogurt')
    expect(kept?.foodId).toBeUndefined()
  })

  it('summarizes history newest first', async () => {
    const food = yogurt()
    await repo.addFoods([food])
    await repo.logFood(food, { kind: 'portion', index: 0, count: 1 }, 'Lunch', '2026-11-03')
    await repo.logFood(food, { kind: 'portion', index: 0, count: 1 }, 'Lunch', '2026-11-05')
    await repo.logFood(food, { kind: 'portion', index: 0, count: 1 }, 'Dinner', '2026-11-05')
    const h = await repo.history()
    expect(h.map((d) => d.date)).toEqual(['2026-11-05', '2026-11-03'])
    expect(h[0]!.count).toBe(2)
    expect(h[0]!.total.cal).toBeCloseTo(260)
  })
})

describe('backup and import', () => {
  it('round-trips its own backup and can undo the import', async () => {
    const food = yogurt()
    await repo.saveFood(food)
    await repo.logFood(food, { kind: 'portion', index: 0, count: 1 }, 'Lunch', '2026-11-05')
    const backup = await repo.exportBackup()
    expect(await repo.isEmpty()).toBe(false)

    await repo.importBackup({ ...backup, foods: [], entries: [] })
    expect(await repo.isEmpty()).toBe(true)
    expect(await repo.canUndoImport()).toBe(true)

    expect(await repo.undoImport()).toBe(true)
    expect(await db.entries.count()).toBe(1)
    expect(await repo.canUndoImport()).toBe(false)
    expect(await repo.undoImport()).toBe(false)
  })

  it('imports the first app data', async () => {
    const result = await repo.importBackup({
      goals: { cal: 2100, p: 175, c: 200, f: 60 },
      pantry: [{ id: 1, name: 'Egg', serving: '1 egg (50g)', cal: 70, p: 6, c: 0, f: 5, stock: true }],
      days: { '2026-11-02': { Breakfast: [{ name: 'Egg', cal: 70, p: 6, c: 0, f: 5, qty: 3 }] } },
    })
    expect(result).toEqual({ foods: 1, entries: 1, skipped: 0 })
    expect((await repo.getGoals()).protein).toBe(175)
    expect((await repo.entriesFor('2026-11-02'))[0]!.nutrients.protein).toBe(18)
    expect(await repo.isEmpty()).toBe(false)
  })

  it('refuses a file that is not a backup and changes nothing', async () => {
    await repo.saveFood(yogurt())
    await expect(repo.importBackup({ hello: 1 })).rejects.toThrow("isn't a Macro Calc backup")
    expect(await db.foods.count()).toBe(1)
  })

  it('records when legacy data was imported', async () => {
    expect(await repo.legacyImportedAt()).toBeNull()
    await repo.markLegacyImported()
    expect(await repo.legacyImportedAt()).toEqual(expect.any(Number))
  })
})

describe('readLegacy', () => {
  it('reads valid JSON and ignores missing or broken data', () => {
    expect(readLegacy({ getItem: () => '{"goals":{}}' })).toEqual({ goals: {} })
    expect(readLegacy({ getItem: () => null })).toBeNull()
    expect(readLegacy({ getItem: () => '{broken' })).toBeNull()
    expect(readLegacy({ getItem: () => '42' })).toBeNull()
    expect(readLegacy(undefined)).toBeNull()
  })
})
