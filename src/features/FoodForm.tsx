import { useState } from 'react'
import { type Food, fromServing, perPortion, type Source } from '../core/foods'
import { isPlausible } from '../core/nutrients'
import { newId } from '../db/repo'
import ui from '../ui/ui.module.css'

const SOURCE_LABELS: Record<Source, string> = {
  label: 'Package label',
  usda: 'USDA',
  off: 'Open Food Facts',
  manual: 'Typed in',
  imported: 'Imported from first app',
}

/**
 * Create or edit a pantry food. Values are entered per serving, the way a label shows them,
 * and stored per 100 g using the serving's gram weight when it is given.
 */
export function FoodForm({
  food,
  onSave,
  onDelete,
}: {
  food?: Food
  onSave: (food: Food) => void
  onDelete?: () => void
}) {
  const portion = food?.portions[0]
  const serving = food ? perPortion(food) : null
  const r = (n: number | undefined) => (n === undefined ? '' : String(Math.round(n * 10) / 10))

  const [name, setName] = useState(food?.name ?? '')
  const [emoji, setEmoji] = useState(food?.emoji ?? '🍽️')
  const [brand, setBrand] = useState(food?.brand ?? '')
  const [servingLabel, setServingLabel] = useState(portion?.label ?? '1 serving')
  const [servingGrams, setServingGrams] = useState(portion?.gramsKnown ? r(portion.grams) : '')
  const [cal, setCal] = useState(r(serving?.cal))
  const [protein, setProtein] = useState(r(serving?.protein))
  const [carbs, setCarbs] = useState(r(serving?.carbs))
  const [fat, setFat] = useState(r(serving?.fat))
  const [source, setSource] = useState<Source>(food?.source ?? 'label')
  const [verified, setVerified] = useState(food?.verified ?? false)
  const [error, setError] = useState('')

  const num = (s: string) => (s.trim() === '' ? 0 : Number(s))
  const values = { cal: num(cal), protein: num(protein), carbs: num(carbs), fat: num(fat) }
  const valid = Object.values(values).every((v) => Number.isFinite(v) && v >= 0)
  const plausible = !valid || isPlausible(values)

  function save() {
    if (!name.trim()) return setError('Add a name for this food.')
    if (!valid) return setError('Calories and macros must be zero or more.')
    const g = Number(servingGrams)
    const hasGrams = servingGrams.trim() !== '' && Number.isFinite(g) && g > 0
    const built = fromServing(values, hasGrams ? `${servingLabel} (${g}g)` : servingLabel)
    const now = Date.now()
    onSave({
      id: food?.id ?? newId(),
      name: name.trim(),
      emoji: emoji.trim() || '🍽️',
      brand: brand.trim(),
      per100g: built.per100g,
      portions: [built.portion, ...(food?.portions.slice(1) ?? [])],
      source,
      verified,
      inStock: food?.inStock ?? true,
      createdAt: food?.createdAt ?? now,
      updatedAt: now,
    })
  }

  return (
    <form
      className={ui.stack}
      onSubmit={(e) => {
        e.preventDefault()
        save()
      }}
    >
      <div className={ui.grid2} style={{ gridTemplateColumns: '1fr 5rem' }}>
        <label className={ui.field}>
          Name
          <input className={ui.input} value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
        </label>
        <label className={ui.field}>
          Emoji
          <input className={ui.input} value={emoji} onChange={(e) => setEmoji(e.target.value)} />
        </label>
      </div>
      <label className={ui.field}>
        Brand or store
        <input className={ui.input} value={brand} onChange={(e) => setBrand(e.target.value)} />
      </label>
      <div className={ui.grid2}>
        <label className={ui.field}>
          Serving
          <input className={ui.input} value={servingLabel} onChange={(e) => setServingLabel(e.target.value)} />
        </label>
        <label className={ui.field}>
          Serving weight (g)
          <input
            className={ui.input}
            type="number"
            inputMode="decimal"
            placeholder="From the label"
            value={servingGrams}
            onChange={(e) => setServingGrams(e.target.value)}
          />
        </label>
      </div>
      <p className={ui.muted} style={{ margin: 0 }}>
        Per serving, as printed on the label.
      </p>
      <div className={ui.grid4}>
        {(
          [
            ['Calories', cal, setCal],
            ['Protein g', protein, setProtein],
            ['Carbs g', carbs, setCarbs],
            ['Fat g', fat, setFat],
          ] as const
        ).map(([label, value, set]) => (
          <label key={label} className={ui.field}>
            {label}
            <input
              className={ui.input}
              type="number"
              inputMode="decimal"
              min="0"
              value={value}
              onChange={(e) => set(e.target.value)}
            />
          </label>
        ))}
      </div>
      {!plausible && (
        <p className={ui.warning} role="status">
          These numbers don't add up. Protein, carbs and fat imply about{' '}
          {Math.round(values.protein * 4 + values.carbs * 4 + values.fat * 9)} calories. Check the label for a typo.
        </p>
      )}
      <div className={ui.grid2}>
        <label className={ui.field}>
          Source
          <select className={ui.input} value={source} onChange={(e) => setSource(e.target.value as Source)}>
            {(Object.keys(SOURCE_LABELS) as Source[]).map((s) => (
              <option key={s} value={s}>
                {SOURCE_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className={ui.field} style={{ justifyContent: 'end' }}>
          <span
            style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 'var(--touch)', color: 'var(--ink)' }}
          >
            <input
              type="checkbox"
              checked={verified}
              onChange={(e) => setVerified(e.target.checked)}
              style={{ width: 22, height: 22 }}
            />
            Checked against package
          </span>
        </label>
      </div>
      {error && (
        <p className={ui.warning} role="alert">
          {error}
        </p>
      )}
      <button type="submit" className={`${ui.primary} ${ui.block}`}>
        Save food
      </button>
      {onDelete && (
        <button type="button" className={`${ui.danger} ${ui.block}`} onClick={onDelete}>
          Delete food
        </button>
      )}
    </form>
  )
}
