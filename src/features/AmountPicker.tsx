import { useState } from 'react'
import { type Amount, type Food, measure, type Meal, MEALS } from '../core/foods'
import { grams, kcal } from '../ui/format'
import ui from '../ui/ui.module.css'
import styles from './AmountPicker.module.css'

/** Choose how much of a food, see the exact macros, and log it. */
export function AmountPicker({
  food,
  meal: initialMeal,
  onLog,
  onBack,
}: {
  food: Food
  meal: Meal
  onLog: (amount: Amount, meal: Meal) => void
  onBack: () => void
}) {
  const canUseGrams = food.portions.some((p) => p.gramsKnown)
  const [mode, setMode] = useState<'portion' | 'grams'>('portion')
  const [index, setIndex] = useState(0)
  const [count, setCount] = useState(1)
  const [gramText, setGramText] = useState(String(food.portions.find((p) => p.gramsKnown)?.grams ?? 100))
  const [meal, setMeal] = useState<Meal>(initialMeal)

  const gramValue = Number(gramText)
  const amount: Amount | null =
    mode === 'portion'
      ? { kind: 'portion', index, count }
      : Number.isFinite(gramValue) && gramValue > 0
        ? { kind: 'grams', grams: gramValue }
        : null
  const m = amount ? measure(food, amount) : null

  return (
    <div className={ui.stack}>
      <div className={ui.row}>
        <span className={ui.emoji}>{food.emoji}</span>
        <div className={ui.rowMain}>
          <div className={ui.rowTitle}>{food.name}</div>
          <div className={ui.muted}>
            {food.brand}
            {!food.verified && ' (unverified values)'}
          </div>
        </div>
      </div>

      {canUseGrams && (
        <div role="radiogroup" aria-label="Measure by" className={styles.toggle}>
          {(['portion', 'grams'] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={mode === k}
              className={mode === k ? ui.chipOn : ui.chip}
              onClick={() => setMode(k)}
            >
              {k === 'portion' ? 'Servings' : 'Grams'}
            </button>
          ))}
        </div>
      )}

      {mode === 'portion' ? (
        <div className={styles.portionRow}>
          {food.portions.length > 1 ? (
            <label className={ui.field}>
              Serving
              <select className={ui.input} value={index} onChange={(e) => setIndex(Number(e.target.value))}>
                {food.portions.map((p, i) => (
                  <option key={p.label} value={i}>
                    {p.label}
                    {p.gramsKnown ? ` (${p.grams}g)` : ''}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className={styles.portionLabel}>{food.portions[0]?.label}</div>
          )}
          <div className={styles.stepper} role="group" aria-label="Number of servings">
            <button
              type="button"
              className={ui.button}
              aria-label="Fewer"
              onClick={() => setCount((c) => Math.max(0.5, c - 0.5))}
            >
              −
            </button>
            <output aria-live="polite" className={styles.count}>
              {count}
            </output>
            <button type="button" className={ui.button} aria-label="More" onClick={() => setCount((c) => c + 0.5)}>
              +
            </button>
          </div>
        </div>
      ) : (
        <label className={ui.field}>
          Grams
          <input
            className={ui.input}
            type="number"
            inputMode="decimal"
            min="1"
            value={gramText}
            onChange={(e) => setGramText(e.target.value)}
          />
        </label>
      )}

      <dl className={styles.facts}>
        <div>
          <dt>Calories</dt>
          <dd>{m ? kcal(m.nutrients.cal) : '–'}</dd>
        </div>
        <div className={styles.protein}>
          <dt>Protein</dt>
          <dd>{m ? grams(m.nutrients.protein) : '–'}</dd>
        </div>
        <div>
          <dt>Carbs</dt>
          <dd>{m ? grams(m.nutrients.carbs) : '–'}</dd>
        </div>
        <div>
          <dt>Fat</dt>
          <dd>{m ? grams(m.nutrients.fat) : '–'}</dd>
        </div>
      </dl>

      <label className={ui.field}>
        Meal
        <select className={ui.input} value={meal} onChange={(e) => setMeal(e.target.value as Meal)}>
          {MEALS.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </label>

      <button
        type="button"
        className={`${ui.primary} ${ui.block}`}
        disabled={!amount}
        onClick={() => amount && onLog(amount, meal)}
      >
        Log food
      </button>
      <button type="button" className={`${ui.quiet} ${ui.block}`} onClick={onBack}>
        Back to search
      </button>
    </div>
  )
}
