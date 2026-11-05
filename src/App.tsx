import { useRegisterSW } from 'virtual:pwa-register/react'
import styles from './App.module.css'

const CURRENT_APP_URL = 'https://nkcodes77.github.io/macro-calc/'

export default function App() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  return (
    <main className={styles.shell}>
      <h1 className={styles.title}>Macro Calc</h1>
      <p className={styles.lead}>
        The rebuilt app is being set up. Keep logging in the <a href={CURRENT_APP_URL}>current app</a> until this one
        can import your data.
      </p>
      <div className={styles.row}>
        <span>Build</span>
        <span className={styles.muted}>
          {__APP_VERSION__} ({__COMMIT__})
        </span>
      </div>
      {needRefresh && (
        <button className={styles.update} type="button" onClick={() => void updateServiceWorker(true)}>
          Install update
        </button>
      )}
    </main>
  )
}
