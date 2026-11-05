import { useMemo, useState } from 'react'
import { foodFromRow, matchesQuery } from '../core/catalog'
import type { DayKey } from '../core/dates'
import { type Food, type Meal, perPortion } from '../core/foods'
import { TJ_CATALOG } from '../data/tj-catalog'
import { newId, repo } from '../db/repo'
import { useFoods } from '../state/hooks'
import { kcal } from '../ui/format'
import { Sheet } from '../ui/Sheet'
import ui from '../ui/ui.module.css'
import { AmountPicker } from './AmountPicker'

type Step = { kind: 'search' } | { kind: 'amount'; food: Food } | { kind: 'quick' }

export function LogSheet({ meal, date, onClose }: { meal: Meal; date: DayKey; onClose: () => void }) {
  const foods = useFoods()
  const [step, setStep] = useState<Step>({ kind: 'search' })
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')

  const pantryHits = useMemo(() => (foods ?? []).filter((f) => matchesQuery(f.name, query)), [foods, query])
  const catalogHits = useMemo(() => {
    if (!query.trim()) return []
    const have = new Set((foods ?? []).map((f) => f.name.toLowerCase()))
    return TJ_CATALOG.filter((row) => !have.has(row[0].toLowerCase()) && matchesQuery(row[0], query)).slice(0, 8)
  }, [foods, query])

  if (step.kind === 'amount') {
    return (
      <Sheet title={`Add to ${meal}`} onClose={onClose}>
        <AmountPicker
          food={step.food}
          meal={meal}
          onBack={() => setStep({ kind: 'search' })}
          onLog={async (amount, chosenMeal) => {
            await repo.logFood(step.food, amount, chosenMeal, date)
            setNotice(`Logged ${step.food.name}`)
            setQuery('')
            setStep({ kind: 'search' })
          }}
        />
      </Sheet>
    )
  }

  if (step.kind === 'quick') {
    return (
      <Sheet title={`Quick entry for ${meal}`} onClose={onClose}>
        <QuickEntry
          onLog={async (item) => {
            await repo.logQuick(item, meal, date)
            setNotice(`Logged ${item.name || 'food'}`)
            setStep({ kind: 'search' })
          }}
        />
      </Sheet>
    )
  }

  return (
    <Sheet title={`Add to ${meal}`} onClose={onClose}>
      <label className={ui.field}>
        <span className={ui.visuallyHidden}>Search foods</span>
        <input
          className={ui.input}
          type="search"
          placeholder="Search your pantry or Trader Joe's"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
      </label>
      <p className={ui.muted} role="status" aria-live="polite" style={{ minHeight: '1.4em', margin: '6px 0' }}>
        {notice}
      </p>

      {pantryHits.map((f) => (
        <FoodRow key={f.id} food={f} onPick={() => setStep({ kind: 'amount', food: f })} />
      ))}
      {foods && pantryHits.length === 0 && !query && (
        <p className={ui.empty}>Your pantry is empty. Search to add foods.</p>
      )}

      {catalogHits.length > 0 && (
        <>
          <h3 className={ui.section}>From Trader Joe's</h3>
          {catalogHits.map((row) => (
            <button
              key={row[0]}
              type="button"
              className={ui.rowButton}
              onClick={async () => {
                const food = foodFromRow(row, newId(), "Trader Joe's")
                await repo.saveFood(food)
                setStep({ kind: 'amount', food })
              }}
            >
              <span className={ui.emoji}>{row[1]}</span>
              <span className={ui.rowMain}>
                <span className={ui.rowTitle} style={{ display: 'block' }}>
                  {row[0]}
                </span>
                <span className={ui.muted}>
                  {row[2]}, {row[3]} cal, {row[4]}g protein
                </span>
              </span>
              <span className={ui.muted}>Add</span>
            </button>
          ))}
        </>
      )}

      <button
        type="button"
        className={`${ui.quiet} ${ui.block}`}
        style={{ marginTop: 12 }}
        onClick={() => setStep({ kind: 'quick' })}
      >
        Log something not in the pantry
      </button>
    </Sheet>
  )
}

function FoodRow({ food, onPick }: { food: Food; onPick: () => void }) {
  const n = perPortion(food)
  return (
    <button type="button" className={ui.rowButton} onClick={onPick}>
      <span className={ui.emoji}>{food.emoji}</span>
      <span className={ui.rowMain}>
        <span className={ui.rowTitle} style={{ display: 'block' }}>
          {food.name}
        </span>
        <span className={ui.muted}>
          {food.portions[0]?.label}, {kcal(n.cal)} cal, {Math.round(n.protein)}g protein
          {!food.inStock && ', out of stock'}
        </span>
      </span>
    </button>
  )
}

function QuickEntry({
  onLog,
}: {
  onLog: (item: {
    name: string
    emoji: string
    nutrients: { cal: number; protein: number; carbs: number; fat: number }
  }) => void
}) {
  const [name, setName] = useState('')
  const [vals, setVals] = useState({ cal: '', protein: '', carbs: '', fat: '' })
  const n = (s: string) => Math.max(0, Number(s) || 0)
  return (
    <form
      className={ui.stack}
      onSubmit={(e) => {
        e.preventDefault()
        onLog({
          name,
          emoji: '🍽️',
          nutrients: { cal: n(vals.cal), protein: n(vals.protein), carbs: n(vals.carbs), fat: n(vals.fat) },
        })
      }}
    >
      <label className={ui.field}>
        What you ate
        <input
          className={ui.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Dining hall pizza"
        />
      </label>
      <div className={ui.grid4}>
        {(['cal', 'protein', 'carbs', 'fat'] as const).map((k) => (
          <label key={k} className={ui.field}>
            {k === 'cal' ? 'Calories' : `${k[0]!.toUpperCase()}${k.slice(1)} g`}
            <input
              className={ui.input}
              type="number"
              inputMode="decimal"
              min="0"
              value={vals[k]}
              onChange={(e) => setVals({ ...vals, [k]: e.target.value })}
            />
          </label>
        ))}
      </div>
      <button type="submit" className={`${ui.primary} ${ui.block}`}>
        Log food
      </button>
    </form>
  )
}
