import { z } from 'zod'
import { isDayKey } from './dates'
import { MEALS, SOURCES } from './foods'

const nonNeg = z.number().finite().nonnegative()

export const NutrientsSchema = z.object({ cal: nonNeg, protein: nonNeg, carbs: nonNeg, fat: nonNeg })

export const PortionSchema = z.object({
  label: z.string().trim().min(1),
  grams: z.number().finite().positive(),
  gramsKnown: z.boolean(),
})

export const FoodSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  brand: z.string(),
  emoji: z.string(),
  per100g: NutrientsSchema,
  portions: z.array(PortionSchema).min(1),
  source: z.enum(SOURCES),
  verified: z.boolean(),
  inStock: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export const EntrySchema = z.object({
  id: z.string().min(1),
  date: z.string().refine(isDayKey, 'date must be YYYY-MM-DD'),
  meal: z.enum(MEALS),
  foodId: z.string().optional(),
  name: z.string().trim().min(1),
  emoji: z.string(),
  amount: z.string(),
  nutrients: NutrientsSchema,
  createdAt: z.number(),
})

export const GoalsSchema = z.object({
  cal: z.number().finite().positive(),
  protein: z.number().finite().nonnegative(),
  carbs: z.number().finite().nonnegative(),
  fat: z.number().finite().nonnegative(),
})

export const BACKUP_FORMAT = 'macro-calc-backup'
export const BACKUP_VERSION = 2

export const BackupSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  version: z.literal(BACKUP_VERSION),
  exportedAt: z.string(),
  goals: GoalsSchema,
  foods: z.array(FoodSchema),
  entries: z.array(EntrySchema),
})
export type Backup = z.infer<typeof BackupSchema>

/** Shape saved by the first single-file app under localStorage key "macrocalc.v1" and in its backup files. */
const lenientNumber = z.number().catch(0)
const LegacyItem = z.object({
  name: z.string(),
  emoji: z.string().optional(),
  cal: lenientNumber,
  p: lenientNumber,
  c: lenientNumber,
  f: lenientNumber,
})
export const LegacySchema = z.object({
  goals: z.object({ cal: z.number(), p: z.number(), c: z.number(), f: z.number() }),
  pantry: z.array(
    LegacyItem.extend({
      id: z.union([z.number(), z.string()]),
      brand: z.string().optional(),
      serving: z.string().optional(),
      stock: z.boolean().optional(),
    }),
  ),
  days: z.record(z.string(), z.record(z.string(), z.array(LegacyItem.extend({ qty: z.number().catch(1) })))),
})
export type Legacy = z.infer<typeof LegacySchema>
