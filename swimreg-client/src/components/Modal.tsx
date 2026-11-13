import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

export function Modal({ title, onClose, children, width = 560 }: { title: string; onClose: () => void; children: ReactNode; width?: number }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
    <div className="modal" role="dialog" aria-modal="true" aria-label={title} style={{ maxWidth: width }}>
      <div className="modal-head">
        <h2>{title}</h2>
        <button type="button" className="icon-button" aria-label="סגירה" onClick={onClose}><X size={20}/></button>
      </div>
      {children}
    </div>
  </div>
}

// חלון אישור לפעולה בלתי הפיכה (מחיקה, ביטול הרשמה)
export function ConfirmModal({ title, text, confirmLabel, busy, onConfirm, onClose }: {
  title: string; text: string; confirmLabel: string; busy?: boolean
  onConfirm: () => void; onClose: () => void
}) {
  return <Modal title={title} onClose={onClose} width={440}>
    <p className="modal-text">{text}</p>
    <div className="modal-actions">
      <button type="button" className="ghost-button" onClick={onClose} disabled={busy}>חזרה</button>
      <button type="button" className="danger-button" onClick={onConfirm} disabled={busy}>{busy ? 'רק רגע...' : confirmLabel}</button>
    </div>
  </Modal>
}
