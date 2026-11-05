import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { addDays, dayKey, isDayKey } from '../core/dates'
import { MEALS, type Meal } from '../core/foods'
import { remaining, sum } from '../core/nutrients'
import { LogSheet } from '../features/LogSheet'
import { Welcome } from '../features/Welcome'
import { repo } from '../db/repo'
import { useEntries, useGoals } from '../state/hooks'
import { Bar } from '../ui/Bar'
import { dayLabel, grams, kcal, longDate } from '../ui/format'
import ui from '../ui/ui.module.css'
import styles from './Today.module.css'

export function Today() {
  const params = useParams()
  const navigate = useNavigate()
  const today = dayKey()
  const date = params.date && isDayKey(params.date) ? params.date : today
  const entries = useEntries(date)
  const goals = useGoals()
  const [logMeal, setLogMeal] = useState<Meal | null>(null)

  const eaten = sum((entries ?? []).map((e) => e.nutrients))
  const left = remaining(goals, eaten)
  const go = (d: string) => navigate(d === today ? '/' : `/day/${d}`)

  return (
    <>
      <nav className={styles.dayNav} aria-label="Change day">
        <button type="button" className={ui.quiet} onClick={() => go(addDays(date, -1))}>
          Previous day
        </button>
        {date !== today && (
          <button type="button" className={ui.quiet} onClick={() => go(addDays(date, 1))}>
            Next day
          </button>
        )}
      </nav>
      <h1 className={ui.heading}>{dayLabel(date, today)}</h1>
      <p className={ui.muted} style={{ margin: 0 }}>
        {longDate(date)}
      </p>

      <Welcome />

      <section className={styles.summary} aria-label="Daily totals">
        <div className={styles.line}>
          <span>Calories</span>
          <span>
            <strong className={styles.big}>{kcal(eaten.cal)}</strong> of {kcal(goals.cal)}
          </span>
        </div>
        <Bar value={eaten.cal} goal={goals.cal} tone="ink" />
        <div className={styles.line}>
          <span>Protein</span>
          <span>
            <strong className={`${styles.big} ${styles.protein}`}>{grams(eaten.protein)}</strong> of{' '}
            {grams(goals.protein)}
          </span>
        </div>
        <Bar value={eaten.protein} goal={goals.protein} tone="protein" />
        <div className={styles.left}>
          <div>
            <div className={ui.muted}>Calories left</div>
            <div className={`${styles.leftNum} ${left.cal < 0 ? styles.over : ''}`}>
              {left.cal < 0 ? `${kcal(-left.cal)} over` : kcal(left.cal)}
            </div>
          </div>
          <div>
            <div className={ui.muted}>Protein left</div>
            <div className={`${styles.leftNum} ${styles.protein}`}>
              {left.protein > 0 ? grams(left.protein) : 'Goal hit'}
            </div>
          </div>
          <div>
            <div className={ui.muted}>Carbs and fat</div>
            <div className={styles.small}>
              {Math.round(eaten.carbs)} of {grams(goals.carbs)}
              <br />
              {Math.round(eaten.fat)} of {grams(goals.fat)}
            </div>
          </div>
        </div>
      </section>

      {MEALS.map((meal) => {
        const items = (entries ?? []).filter((e) => e.meal === meal)
        const mealCal = sum(items.map((e) => e.nutrients)).cal
        return (
          <section key={meal} aria-label={meal}>
            <div className={styles.mealHead}>
              <h2 className={styles.mealTitle}>{meal}</h2>
              <span className={ui.muted}>{items.length > 0 && `${kcal(mealCal)} cal`}</span>
              <button type="button" className={ui.button} onClick={() => setLogMeal(meal)}>
                Add food
              </button>
            </div>
            {items.map((e) => (
              <div key={e.id} className={ui.row}>
                <span className={ui.emoji}>{e.emoji}</span>
                <div className={ui.rowMain}>
                  <div className={ui.rowTitle}>{e.name}</div>
                  <div className={ui.muted}>
                    {e.amount}, {kcal(e.nutrients.cal)} cal, {grams(e.nutrients.protein)} protein
                  </div>
                </div>
                <button
                  type="button"
                  className={ui.quiet}
                  aria-label={`Remove ${e.name}`}
                  onClick={() => repo.deleteEntry(e.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </section>
        )
      })}

      {date === today && left.cal >= 50 && (
        <Link to="/ideas" className={`${ui.primary} ${ui.block} ${styles.ideas}`}>
          Find a meal for the {kcal(left.cal)} calories left
        </Link>
      )}

      {logMeal && <LogSheet meal={logMeal} date={date} onClose={() => setLogMeal(null)} />}
    </>
  )
}
