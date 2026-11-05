import styles from './Bar.module.css'

/** Plain progress bar. Phase 3 replaces the calorie one with the day bar. */
export function Bar({ value, goal, tone }: { value: number; goal: number; tone: 'ink' | 'protein' }) {
  const pct = goal > 0 ? Math.min(value / goal, 1) * 100 : 0
  const over = value > goal
  return (
    <div className={styles.track} aria-hidden="true">
      <div className={`${styles.fill} ${over ? styles.over : styles[tone]}`} style={{ width: `${pct}%` }} />
    </div>
  )
}
