import { useEffect, useState, type FormEvent } from 'react'
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import { ConflictCard } from '../../components/ConflictCard'
import { Field } from '../../components/CourseFormModal'
import { ConfirmModal, Modal } from '../../components/Modal'
import { Notice } from '../../components/Notice'
import { EmptyState, Loading, PageHeader } from '../../components/PageHeader'
import { errorBody, poolsApi } from '../../lib/api'
import type { ApiErrorBody, Pool } from '../../lib/api'
import { fieldError } from '../../lib/format'

// ניהול בריכות (CRUD). מחיקת בריכה שיש בה קורסים מחזירה 409
export default function AdminPoolsPage() {
  const [pools, setPools] = useState<Pool[] | null>(null)
  const [refresh, setRefresh] = useState(0)
  const [error, setError] = useState<ApiErrorBody | null>(null)
  const [conflict, setConflict] = useState<ApiErrorBody | null>(null)
  const [success, setSuccess] = useState('')
  const [editing, setEditing] = useState<Pool | null | 'new'>(null)
  const [toDelete, setToDelete] = useState<Pool | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    poolsApi.list().then(p => { setPools(p); setError(null) }).catch(err => { setError(errorBody(err, 'לא ניתן לטעון את הבריכות.')); setPools([]) })
  }, [refresh])

  async function remove() {
    if (!toDelete) return
    setBusy(true); setError(null); setConflict(null); setSuccess('')
    try {
      await poolsApi.remove(toDelete.id)
      setSuccess(`הבריכה ״${toDelete.name}״ נמחקה.`)
      setRefresh(v => v + 1)
    } catch (err) {
      const b = errorBody(err, 'לא ניתן למחוק את הבריכה.')
      if (b.status === 409) setConflict(b); else setError(b)
    } finally { setBusy(false); setToDelete(null) }
  }

  return <main className="page-main">
    <PageHeader eyebrow="ADMIN · POOLS" title="בריכות" subtitle="הבריכות שבהן מתקיימים הקורסים."
      actions={<button className="primary-button compact" onClick={() => setEditing('new')}><Plus size={18}/> בריכה חדשה</button>}/>

    {success && <Notice type="success" message={success} onClose={() => setSuccess('')}/>}
    {error && <Notice type="error" message={error.message || 'אירעה שגיאה'} details={error} onClose={() => setError(null)}/>}
    {conflict && <ConflictCard details={conflict} title="לא ניתן למחוק את הבריכה"
      hint="השרת חוסם מחיקה של בריכה שיש בה קורסים. מחקו או העבירו קודם את הקורסים שלה." onClose={() => setConflict(null)}/>}

    {!pools ? <Loading/> : pools.length === 0
      ? !error && <EmptyState icon={<MapPin size={34}/>} title="אין בריכות" text="הוסיפו בריכה ראשונה כדי ליצור בה קורסים."/>
      : <div className="table-card">
          <table className="data-table">
            <thead><tr><th>#</th><th>שם</th><th>כתובת</th><th aria-label="פעולות"/></tr></thead>
            <tbody>{pools.map(p => <tr key={p.id}>
              <td data-label="#" className="muted">{p.id}</td>
              <td data-label="שם"><strong>{p.name}</strong></td>
              <td data-label="כתובת">{p.address}</td>
              <td className="row-actions">
                <button className="icon-action" title="עריכה" aria-label={`עריכת ${p.name}`} onClick={() => setEditing(p)}><Pencil size={17}/></button>
                <button className="icon-action danger" title="מחיקה" aria-label={`מחיקת ${p.name}`} onClick={() => setToDelete(p)}><Trash2 size={17}/></button>
              </td>
            </tr>)}</tbody>
          </table>
        </div>}

    {editing && <PoolFormModal pool={editing === 'new' ? null : editing} onClose={() => setEditing(null)}
      onSaved={m => { setEditing(null); setSuccess(m); setRefresh(v => v + 1) }}/>}
    {toDelete && <ConfirmModal title="מחיקת בריכה" text={`למחוק את הבריכה ״${toDelete.name}״?`}
      confirmLabel="מחיקה" busy={busy} onConfirm={remove} onClose={() => setToDelete(null)}/>}
  </main>
}

function PoolFormModal({ pool, onSaved, onClose }: { pool: Pool | null; onSaved: (m: string) => void; onClose: () => void }) {
  const [name, setName] = useState(pool?.name ?? '')
  const [address, setAddress] = useState(pool?.address ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<ApiErrorBody | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null)
    const body = { name: name.trim(), address: address.trim() }
    try {
      if (pool) { await poolsApi.update(pool.id, body); onSaved(`הבריכה ״${body.name}״ עודכנה.`) }
      else { const created = await poolsApi.create(body); onSaved(`הבריכה ״${created.name}״ נוספה.`) }
    } catch (err) { setError(errorBody(err, 'לא ניתן לשמור את הבריכה.')) }
    finally { setBusy(false) }
  }

  return <Modal title={pool ? 'עריכת בריכה' : 'בריכה חדשה'} onClose={onClose} width={480}>
    <form className="form-grid single" onSubmit={submit} noValidate>
      {error && <Notice type="error" message={error.message || 'הבקשה נכשלה'} details={error} onClose={() => setError(null)}/>}
      <Field label="שם הבריכה" error={fieldError(error, 'Name')}><input value={name} onChange={e => setName(e.target.value)} required minLength={2} maxLength={100}/></Field>
      <Field label="כתובת" error={fieldError(error, 'Address')}><input value={address} onChange={e => setAddress(e.target.value)} required minLength={2} maxLength={200}/></Field>
      <div className="modal-actions">
        <button type="button" className="ghost-button" onClick={onClose} disabled={busy}>ביטול</button>
        <button type="submit" className="primary-button compact" disabled={busy}>{busy ? 'שומרים...' : pool ? 'שמירה' : 'הוספה'}</button>
      </div>
    </form>
  </Modal>
}
