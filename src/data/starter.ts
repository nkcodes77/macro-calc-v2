import type { CatalogRow } from './tj-catalog'

/** Neil's original pantry from the first app (per-serving label values), used to seed a fresh install. */
export const STARTER_PANTRY: readonly (CatalogRow | readonly [...CatalogRow, string])[] = [
  ["TJ's Low Fat Greek Yogurt", '🫙', '1 cup (227g)', 130, 22, 9, 2, "Trader Joe's"],
  ['Banana', '🍌', '1 medium (118g)', 105, 1, 27, 0, 'Fresh'],
  ['Honey', '🍯', '1 tbsp (21g)', 60, 0, 17, 0, "Trader Joe's"],
  ['Raspberry Jam', '🍓', '1 tbsp (20g)', 50, 0, 13, 0, "Trader Joe's"],
  ['Chicken Teriyaki Bowl', '🍱', '1 bowl (319g)', 370, 18, 67, 4, "Trader Joe's"],
  ['Frozen Jasmine Rice', '🍚', '1 cup cooked (140g)', 210, 4, 45, 1, "Trader Joe's"],
  ['Chicken Breakfast Sausage', '🌭', '2 links (72g)', 140, 13, 1, 9, "Trader Joe's"],
  ['Large Cage-Free Egg', '🥚', '1 egg (50g)', 70, 6, 0, 5, "Trader Joe's"],
  ['Jalapeño Beef Stick', '🌶️', '1 stick (28g)', 100, 9, 1, 6, "Member's Mark"],
  ['Original Beef Stick', '🥩', '1 stick (28g)', 100, 9, 1, 6, "Member's Mark"],
  ['Honey Jalapeño Chicken Stick', '🍗', '1 stick (28g)', 60, 6, 4, 2, 'Mighty Spark'],
  ['Original Chicken Snack Stick', '🍗', '1 stick (28g)', 60, 7, 2, 2, 'Mighty Spark'],
]
