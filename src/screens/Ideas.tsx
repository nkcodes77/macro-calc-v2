import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { dayKey } from '../core/dates'
import { MEALS, type Meal } from '../core/foods'
import { suggestMeals } from '../core/ideas'
import { remaining, sum } from '../core/nutrients'
import { repo } from '../db/repo'
import { useEntries, useFoods, useGoals } from '../state/hooks'
import { grams, kcal } from '../ui/format'
import ui from '../ui/ui.module.css'

function mealForNow(hour = new Date().getHours()): Meal {
  return hour < 11 ? 'Breakfast' : hour < 15 ? 'Lunch' : hour < 21 ? 'Dinner' : 'Snacks'
}

export function Ideas() {
  const today = dayKey()
  const foods = useFoods()
  const entries = useEntries(today)
  const goals = useGoals()
  const navigate = useNavigate()
  const left = remaining(goals, sum((entries ?? []).map((e) => e.nutrients)))
  const [hour] = useState(() => new Date().getHours())
  const [mealsLeft, setMealsLeft] = useState(hour < 11 ? 3 : hour < 16 ? 2 : 1)
  const [meal, setMeal] = useState<Meal>(mealForNow(hour))

  const targetCal = Math.max(0, left.cal) / mealsLeft
  const targetProtein = Math.max(0, left.protein) / mealsLeft
  const target = { cal: targetCal, protein: targetProtein }
  const ideas = useMemo(
    () => (foods ? suggestMeals(foods, { cal: targetCal, protein: targetProtein }) : []),
    [foods, targetCal, targetProtein],
  )
  const inStock = (foods ?? []).filter((f) => f.inStock).length

  return (
    <>
      <h1 className={ui.heading}>Meal ideas</h1>
      <p style={{ margin: '4px 0 12px' }}>
        Built from your in-stock pantry to fit what is left today, {kcal(Math.max(0, left.cal))} calories and{' '}
        {grams(Math.max(0, left.protein))} protein.
      </p>
      <div className={ui.grid2}>
        <label className={ui.field}>
          Meals left today
          <select className={ui.input} value={mealsLeft} onChange={(e) => setMealsLeft(Number(e.target.value))}>
            {[1, 2, 3, 4].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <label className={ui.field}>
          Log ideas to
          <select className={ui.input} value={meal} onChange={(e) => setMeal(e.target.value as Meal)}>
            {MEALS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
      </div>
      <p className={ui.muted}>
        Aiming for about {kcal(target.cal)} calories and {grams(target.protein)} protein per meal.
      </p>

      {foods && target.cal < 50 && <p className={ui.empty}>You have used today's calories. Nothing to suggest.</p>}
      {foods && target.cal >= 50 && inStock === 0 && (
        <p className={ui.empty}>Mark foods as in stock in Pantry to get ideas.</p>
      )}
      {foods && target.cal >= 50 && inStock > 0 && ideas.length === 0 && (
        <p className={ui.empty}>No combination fits. Add more foods to your pantry.</p>
      )}

      {ideas.map((idea, i) => (
        <section key={idea.items.map((it) => it.food.id).join()} aria-label={`Option ${i + 1}`}>
          <h2 className={ui.section} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <span>Option {i + 1}</span>
            <span style={{ fontSize: 'var(--step-0)' }}>
              {kcal(idea.total.cal)} cal,{' '}
              <span style={{ color: 'var(--protein)' }}>{grams(idea.total.protein)} protein</span>
            </span>
          </h2>
          {idea.items.map((it) => (
            <div key={it.food.id} className={ui.row}>
              <span className={ui.emoji}>{it.food.emoji}</span>
              <div className={ui.rowMain}>
                <div className={ui.rowTitle}>
                  {it.count} × {it.food.name}
                </div>
                <div className={ui.muted}>{it.food.portions[0]?.label}</div>
              </div>
            </div>
          ))}
          <button
            type="button"
            className={`${ui.button} ${ui.block}`}
            style={{ marginTop: 8 }}
            onClick={async () => {
              for (const it of idea.items)
                await repo.logFood(it.food, { kind: 'portion', index: 0, count: it.count }, meal, today)
              navigate('/')
            }}
          >
            Log this meal to {meal}
          </button>
        </section>
      ))}
    </>
  )
}
