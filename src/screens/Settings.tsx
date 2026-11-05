import { useLiveQuery } from 'dexie-react-hooks'
import { useRef, useState } from 'react'
import { dayKey } from '../core/dates'
import { readLegacy } from '../db/legacy-source'
import { repo } from '../db/repo'
import type { Goals } from '../core/types'
import { useGoals } from '../state/hooks'
import ui from '../ui/ui.module.css'

export function Settings() {
  const goals = useGoals()
  const [status, setStatus] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const canUndo = useLiveQuery(() => repo.canUndoImport(), [])
  const legacyAt = useLiveQuery(() => repo.legacyImportedAt(), [])
  const [legacy] = useState(() => readLegacy())

  async function runImport(raw: unknown, fromLegacy = false) {
    try {
      const r = await repo.importBackup(raw)
      if (fromLegacy) await repo.markLegacyImported()
      setStatus(
        `Imported ${r.foods} foods and ${r.entries} logged items.${r.skipped ? ` ${r.skipped} unreadable days or meals were skipped.` : ''}`,
      )
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Import failed')
    }
  }

  return (
    <>
      <h1 className={ui.heading}>Settings</h1>

      <h2 className={ui.section}>Daily goals</h2>
      <GoalsForm key={`${goals.cal}-${goals.protein}-${goals.carbs}-${goals.fat}`} goals={goals} onStatus={setStatus} />

      <p role="status" aria-live="polite" className={ui.muted} style={{ minHeight: '1.4em' }}>
        {status}
      </p>

      <h2 className={ui.section}>Your data</h2>
      <p>Everything stays on this phone. Export a backup now and then and keep it in Files or iCloud Drive.</p>
      <div className={ui.stack}>
        <button
          type="button"
          className={`${ui.button} ${ui.block}`}
          onClick={async () => {
            const blob = new Blob([JSON.stringify(await repo.exportBackup())], { type: 'application/json' })
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = `macro-calc-backup-${dayKey()}.json`
            a.click()
            URL.revokeObjectURL(a.href)
            setStatus('Backup exported')
          }}
        >
          Export backup
        </button>
        <button type="button" className={`${ui.button} ${ui.block}`} onClick={() => fileRef.current?.click()}>
          Restore from backup file
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          aria-label="Backup file"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (!file) return
            if (!confirm('Replace everything in this app with this backup? You can undo it afterwards.')) return
            try {
              await runImport(JSON.parse(await file.text()))
            } catch {
              setStatus("That file isn't a Macro Calc backup")
            }
          }}
        />
        {legacy !== null && (
          <button
            type="button"
            className={`${ui.button} ${ui.block}`}
            onClick={() => {
              if (
                confirm(
                  'Replace everything in this app with the data from the current app? You can undo it afterwards.',
                )
              )
                void runImport(legacy, true)
            }}
          >
            {legacyAt ? 'Import from current app again' : 'Import from current app'}
          </button>
        )}
        {canUndo && (
          <button
            type="button"
            className={`${ui.danger} ${ui.block}`}
            onClick={async () => setStatus((await repo.undoImport()) ? 'Import undone' : 'Nothing to undo')}
          >
            Undo last import
          </button>
        )}
      </div>
      <p className={ui.muted} style={{ marginTop: 24 }}>
        Build {__APP_VERSION__} ({__COMMIT__})
      </p>
    </>
  )
}

function GoalsForm({ goals, onStatus }: { goals: Goals; onStatus: (s: string) => void }) {
  const [form, setForm] = useState({
    cal: String(goals.cal),
    protein: String(goals.protein),
    carbs: String(goals.carbs),
    fat: String(goals.fat),
  })
  return (
    <form
      className={ui.stack}
      style={{ marginTop: 12 }}
      onSubmit={async (e) => {
        e.preventDefault()
        const n = (s: string) => Number(s)
        try {
          await repo.setGoals({ cal: n(form.cal), protein: n(form.protein), carbs: n(form.carbs), fat: n(form.fat) })
          onStatus('Goals saved')
        } catch {
          onStatus('Goals need a calorie target above 0 and macros of 0 or more.')
        }
      }}
    >
      <div className={ui.grid4}>
        {(
          [
            ['cal', 'Calories'],
            ['protein', 'Protein g'],
            ['carbs', 'Carbs g'],
            ['fat', 'Fat g'],
          ] as const
        ).map(([k, label]) => (
          <label key={k} className={ui.field}>
            {label}
            <input
              className={ui.input}
              type="number"
              inputMode="decimal"
              min="0"
              value={form[k]}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
            />
          </label>
        ))}
      </div>
      <button type="submit" className={`${ui.primary} ${ui.block}`}>
        Save goals
      </button>
    </form>
  )
}
