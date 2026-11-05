import { type ReactNode, useEffect, useRef } from 'react'
import styles from './Sheet.module.css'

/** Bottom sheet built on <dialog>, so focus trapping, Escape and screen readers work natively. */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal?.()
    return () => dialog?.close?.()
  }, [])

  return (
    <dialog
      ref={ref}
      className={styles.sheet}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
    >
      <div className={styles.inner}>
        <header className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button type="button" className={styles.close} onClick={onClose}>
            Close
          </button>
        </header>
        {children}
      </div>
    </dialog>
  )
}
