import type { Food } from './foods'
import { fromServing } from './foods'

/** Turns a per-serving catalog row into an unverified Food. */
export function foodFromRow(
  row: readonly [string, string, string, number, number, number, number, ...string[]],
  id: string,
  brand: string,
  now = Date.now(),
): Food {
  const [name, emoji, serving, cal, protein, carbs, fat, rowBrand] = row
  const { per100g, portion } = fromServing({ cal, protein, carbs, fat }, serving)
  return {
    id,
    name,
    brand: rowBrand ?? brand,
    emoji,
    per100g,
    portions: [portion],
    source: 'manual',
    verified: false,
    inStock: true,
    createdAt: now,
    updatedAt: now,
  }
}

/** Word-prefix search: every typed word must start a word in the name. "gr chi" matches "Grilled Chicken". */
export function matchesQuery(name: string, query: string): boolean {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return true
  const words = name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
  return terms.every((t) => words.some((w) => w.startsWith(t)))
}
