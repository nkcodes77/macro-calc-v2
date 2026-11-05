import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router'
import { dayKey } from '../core/dates'
import { repo } from '../db/repo'
import { useGoals } from '../state/hooks'
import { dayLabel, grams, kcal } from '../ui/format'
import ui from '../ui/ui.module.css'

export function History() {
  const days = useLiveQuery(() => repo.history(60), [])
  const goals = useGoals()
  const today = dayKey()

  return (
    <>
      <h1 className={ui.heading}>History</h1>
      <p style={{ margin: '4px 0 12px' }}>The last 60 days you logged. Tap a day to see or edit it.</p>
      {days && days.length === 0 && <p className={ui.empty}>Nothing logged yet.</p>}
      {days?.map((d) => (
        <Link
          key={d.date}
          to={d.date === today ? '/' : `/day/${d.date}`}
          className={ui.row}
          style={{ color: 'inherit', textDecoration: 'none' }}
        >
          <div className={ui.rowMain}>
            <div>{dayLabel(d.date, today)}</div>
            <div className={ui.muted}>
              {d.count} {d.count === 1 ? 'item' : 'items'}, {grams(d.total.carbs)} carbs, {grams(d.total.fat)} fat
            </div>
          </div>
          <div className={ui.num}>
            <div style={{ color: d.total.cal > goals.cal ? 'var(--over)' : undefined }}>{kcal(d.total.cal)} cal</div>
            <div style={{ color: 'var(--protein)', fontWeight: d.total.protein >= goals.protein ? 800 : 400 }}>
              {grams(d.total.protein)} protein
            </div>
          </div>
        </Link>
      ))}
    </>
  )
}
