import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { foodFromRow } from '../core/catalog'
import { STARTER_PANTRY } from '../data/starter'
import { readLegacy } from '../db/legacy-source'
import { newId, repo } from '../db/repo'
import ui from '../ui/ui.module.css'

/** Shown only while the database is empty: bring data over from the first app, or start fresh. */
export function Welcome() {
  const empty = useLiveQuery(() => repo.isEmpty(), [])
  const [legacy] = useState(() => readLegacy())
  const [error, setError] = useState('')
  if (!empty) return null

  return (
    <section className={ui.stack} style={{ marginTop: 16, padding: 12, border: '2px solid var(--ink)' }}>
      <h2 style={{ margin: 0, fontSize: 'var(--step-1)' }}>Set up Macro Calc</h2>
      {legacy ? (
        <>
          <p style={{ margin: 0 }}>Your pantry, goals and history from the current app were found on this phone.</p>
          <button
            type="button"
            className={`${ui.primary} ${ui.block}`}
            onClick={async () => {
              try {
                await repo.importBackup(legacy)
                await repo.markLegacyImported()
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Import failed')
              }
            }}
          >
            Import from current app
          </button>
        </>
      ) : (
        <p style={{ margin: 0 }}>
          No data from the current app was found here. In the current app, tap Settings then Export backup, then restore
          that file in this app's Settings.
        </p>
      )}
      <button
        type="button"
        className={`${ui.button} ${ui.block}`}
        onClick={() => repo.addFoods(STARTER_PANTRY.map((row) => foodFromRow(row, newId(), '')))}
      >
        Start with the starter pantry
      </button>
      {error && (
        <p className={ui.warning} role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
