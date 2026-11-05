import { useEffect } from 'react'
import { HashRouter, NavLink, Route, Routes, useLocation } from 'react-router'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { History } from './screens/History'
import { Ideas } from './screens/Ideas'
import { Pantry } from './screens/Pantry'
import { Settings } from './screens/Settings'
import { Today } from './screens/Today'
import styles from './App.module.css'

const TABS = [
  { to: '/', label: 'Today', end: true },
  { to: '/ideas', label: 'Ideas', end: false },
  { to: '/pantry', label: 'Pantry', end: false },
  { to: '/history', label: 'History', end: false },
  { to: '/settings', label: 'Settings', end: false },
] as const

export default function App() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  return (
    <HashRouter>
      {needRefresh && (
        <div className={styles.update} role="status">
          <span>A new version is ready.</span>
          <button type="button" onClick={() => void updateServiceWorker(true)}>
            Update now
          </button>
        </div>
      )}
      <ScrollToTop />
      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/day/:date" element={<Today />} />
          <Route path="/ideas" element={<Ideas />} />
          <Route path="/pantry" element={<Pantry />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Today />} />
        </Routes>
      </main>
      <nav className={styles.tabs} aria-label="Main">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) => (isActive ? styles.active : styles.tab)}
          >
            {t.label}
          </NavLink>
        ))}
      </nav>
    </HashRouter>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo?.(0, 0)
  }, [pathname])
  return null
}
