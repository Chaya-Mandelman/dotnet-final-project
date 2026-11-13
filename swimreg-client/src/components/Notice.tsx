import { AlertCircle, CheckCircle2, X } from 'lucide-react'
import type { ApiErrorBody } from '../lib/api'
export function Notice({ type, message, details, onClose }: { type: 'error' | 'success'; message: string; details?: ApiErrorBody; onClose?: () => void }) {
  return <div role="alert" className={`notice notice-${type}`}><div className="notice-icon">{type === 'success' ? <CheckCircle2 size={21}/> : <AlertCircle size={21}/>}</div><div className="notice-body"><strong>{type === 'success' ? 'הפעולה הושלמה' : 'לא ניתן להשלים את הפעולה'}</strong><p>{message}</p>{details?.errors && <ul>{Object.entries(details.errors).flatMap(([field, errors]) => (Array.isArray(errors) ? errors : [errors]).map((e, i) => <li key={`${field}-${i}`}>{e}</li>))}</ul>}{details?.correlationId && <small>מזהה פנייה: {details.correlationId}</small>}</div>{onClose && <button type="button" className="icon-button" aria-label="סגירת הודעה" onClick={onClose}><X size={18}/></button>}</div>
}
