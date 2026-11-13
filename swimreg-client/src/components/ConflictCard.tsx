import { RefreshCw, ShieldAlert, X } from 'lucide-react'
import type { ApiErrorBody } from '../lib/api'

// הצגת תשובת 409 מהשרת. ההודעה מוצגת כמו שהשרת שלח אותה ("הקורס מלא", "המקום נתפס בינתיים, נסה שוב"...),
// כך שהלקוח והשרת מדברים באותה שפה על השגיאה
export function ConflictCard({ details, title = 'המקום נתפס', hint, onRetry, retryLabel = 'נסו שוב', onClose }: {
  details: ApiErrorBody
  title?: string
  hint?: string
  onRetry?: () => void
  retryLabel?: string
  onClose?: () => void
}) {
  return <div role="alert" aria-live="assertive" className="conflict-card">
    <div className="conflict-icon"><ShieldAlert size={26}/></div>
    <div className="conflict-body">
      <div className="conflict-status">409 · Conflict</div>
      <h3>{title}</h3>
      <p className="conflict-message">{details.message}</p>
      {hint && <p className="conflict-hint">{hint}</p>}
      <div className="conflict-footer">
        {onRetry && <button type="button" className="conflict-retry" onClick={onRetry}><RefreshCw size={16}/> {retryLabel}</button>}
        {details.correlationId && <small dir="ltr">Correlation ID: {details.correlationId}</small>}
      </div>
    </div>
    {onClose && <button type="button" className="icon-button" aria-label="סגירה" onClick={onClose}><X size={18}/></button>}
  </div>
}
