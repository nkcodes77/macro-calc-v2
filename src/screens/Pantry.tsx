import { useMemo, useState } from 'react'
import { foodFromRow, matchesQuery } from '../core/catalog'
import { type Food, perPortion } from '../core/foods'
import { TJ_CATALOG } from '../data/tj-catalog'
import { FoodForm } from '../features/FoodForm'
import { newId, repo } from '../db/repo'
import { useFoods } from '../state/hooks'
import { kcal } from '../ui/format'
import { Sheet } from '../ui/Sheet'
import ui from '../ui/ui.module.css'
import styles from './Pantry.module.css'

export function Pantry() {
  const foods = useFoods()
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Food | 'new' | null>(null)
  const [notice, setNotice] = useState('')

  const shown = useMemo(() => (foods ?? []).filter((f) => matchesQuery(f.name, query)), [foods, query])
  const catalogHits = useMemo(() => {
    if (!query.trim()) return []
    const have = new Set((foods ?? []).map((f) => f.name.toLowerCase()))
    return TJ_CATALOG.filter((r) => !have.has(r[0].toLowerCase()) && matchesQuery(r[0], query)).slice(0, 8)
  }, [foods, query])
  const unverified = (foods ?? []).filter((f) => !f.verified).length

  return (
    <>
      <h1 className={ui.heading}>Pantry</h1>
      <p style={{ margin: '4px 0 12px' }}>
        Search to add Trader Joe's items. Tap a food to edit it, and tap its stock status to change it.
        {unverified > 0 &&
          ` ${unverified} ${unverified === 1 ? 'food has' : 'foods have'} values not yet checked against the package.`}
      </p>
      <label className={ui.field}>
        <span className={ui.visuallyHidden}>Search pantry</span>
        <input
          className={ui.input}
          type="search"
          placeholder="Search or add Trader Joe's items"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
      </label>
      <p className={ui.muted} role="status" aria-live="polite" style={{ minHeight: '1.4em', margin: '6px 0' }}>
        {notice}
      </p>

      {catalogHits.length > 0 && (
        <>
          <h2 className={ui.section}>From Trader Joe's</h2>
          {catalogHits.map((row) => (
            <div key={row[0]} className={ui.row}>
              <span className={ui.emoji}>{row[1]}</span>
              <div className={ui.rowMain}>
                <div className={ui.rowTitle}>{row[0]}</div>
                <div className={ui.muted}>
                  {row[2]}, {row[3]} cal, {row[4]}g protein
                </div>
              </div>
              <button
                type="button"
                className={ui.button}
                onClick={async () => {
                  await repo.saveFood(foodFromRow(row, newId(), "Trader Joe's"))
                  setNotice(`Added ${row[0]}`)
                  setQuery('')
                }}
              >
                Add
              </button>
            </div>
          ))}
          <h2 className={ui.section}>Your pantry</h2>
        </>
      )}

      {shown.map((f) => {
        const n = perPortion(f)
        return (
          <div key={f.id} className={ui.row}>
            <button type="button" className={styles.foodButton} onClick={() => setEditing(f)}>
              <span className={ui.emoji}>{f.emoji}</span>
              <span className={ui.rowMain}>
                <span className={ui.rowTitle} style={{ display: 'block' }}>
                  {f.name}
                </span>
                <span className={ui.muted}>
                  {f.portions[0]?.label}, {kcal(n.cal)} cal, {Math.round(n.protein)}g protein
                  {!f.verified && ', unverified'}
                </span>
              </span>
            </button>
            <button
              type="button"
              className={f.inStock ? ui.chipOn : ui.chip}
              aria-pressed={f.inStock}
              aria-label={`${f.name} in stock`}
              onClick={() => repo.setInStock(f.id, !f.inStock)}
            >
              {f.inStock ? 'In stock' : 'Out'}
            </button>
          </div>
        )
      })}
      {foods && shown.length === 0 && !catalogHits.length && <p className={ui.empty}>No foods match that search.</p>}

      <button
        type="button"
        className={`${ui.button} ${ui.block}`}
        style={{ marginTop: 16 }}
        onClick={() => setEditing('new')}
      >
        Add a food by hand
      </button>

      {editing && (
        <Sheet title={editing === 'new' ? 'New food' : 'Edit food'} onClose={() => setEditing(null)}>
          <FoodForm
            {...(editing !== 'new' ? { food: editing } : {})}
            onSave={async (food) => {
              await repo.saveFood(food)
              setNotice(`Saved ${food.name}`)
              setEditing(null)
            }}
            {...(editing !== 'new'
              ? {
                  onDelete: async () => {
                    await repo.deleteFood(editing.id)
                    setNotice(`Deleted ${editing.name}`)
                    setEditing(null)
                  },
                }
              : {})}
          />
        </Sheet>
      )}
    </>
  )
}
