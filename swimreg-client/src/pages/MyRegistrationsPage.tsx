import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ClipboardList } from 'lucide-react'
import { ConflictCard } from '../components/ConflictCard'
import { ConfirmModal } from '../components/Modal'
import { Notice } from '../components/Notice'
import { EmptyState, Loading, PageHeader } from '../components/PageHeader'
import { Pagination } from '../components/Pagination'
import { errorBody, registrationsApi } from '../lib/api'
import type { ApiErrorBody, PagedResult, Registration } from '../lib/api'
import { formatDate } from '../lib/format'
import { useQueryState } from '../lib/useQueryState'

// ההרשמות שלי: השרת מסנן לפי ה-UserId שב-token, ולכן אין כאן שום סינון בצד הלקוח
export default function MyRegistrationsPage() {
  const q = useQueryState({ page: '1', pageSize: '10' })
  const [data, setData] = useState<PagedResult<Registration> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiErrorBody | null>(null)
  const [conflict, setConflict] = useState<ApiErrorBody | null>(null)
  const [success, setSuccess] = useState('')
  const [toCancel, setToCancel] = useState<Registration | null>(null)
  const [busy, setBusy] = useState(false)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    registrationsApi.list(q.page, q.pageSize)
      .then(r => { if (!cancelled) { setData(r); setError(null) } })
      .catch(err => { if (!cancelled) setError(errorBody(err, 'לא ניתן לטעון את ההרשמות.')) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [q.page, q.pageSize, refresh])

  async function cancelRegistration() {
    if (!toCancel) return
    setBusy(true); setError(null); setConflict(null); setSuccess('')
    try {
      await registrationsApi.cancel(toCancel.id)
      setSuccess(`ההרשמה לחוג ״${toCancel.courseName}״ בוטלה.`)
      // אם ביטלנו את הפריט האחרון בעמוד, חוזרים עמוד אחד אחורה
      if (data && data.items.length === 1 && q.page > 1) q.set({ page: q.page - 1 }, false)
      else setRefresh(v => v + 1)
    } catch (err) {
      const body = errorBody(err, 'לא ניתן לבטל את ההרשמה.')
      if (body.status === 409) setConflict(body); else setError(body)
    } finally { setBusy(false); setToCancel(null) }
  }

  return <main className="page-main">
    <PageHeader eyebrow="MY REGISTRATIONS" title="ההרשמות שלי" subtitle="כל החוגים שנרשמת אליהם. אפשר לבטל הרשמה בכל עת."
      actions={<Link to="/courses" className="secondary-button">לכל החוגים <ArrowLeft size={16}/></Link>}/>

    {success && <Notice type="success" message={success} onClose={() => setSuccess('')}/>}
    {error && <Notice type="error" message={error.message || 'אירעה שגיאה'} details={error} onClose={() => setError(null)}/>}
    {conflict && <ConflictCard details={conflict} title="הביטול התנגש בשינוי אחר" hint="החוג עודכן באותו רגע. נסו לבטל שוב."
      onRetry={() => { setConflict(null); setRefresh(v => v + 1) }} retryLabel="רענון הרשימה" onClose={() => setConflict(null)}/>}

    {loading ? <Loading/> : data && data.items.length > 0
      ? <div className="table-card">
          <table className="data-table">
            <thead><tr><th>חוג</th><th>בריכה</th><th>תאריך הרשמה</th><th aria-label="פעולות"/></tr></thead>
            <tbody>{data.items.map(r => <tr key={r.id}>
              <td data-label="חוג"><Link to={`/courses/${r.courseId}`} className="table-link">{r.courseName}</Link></td>
              <td data-label="בריכה">{r.poolName}</td>
              <td data-label="תאריך הרשמה">{formatDate(r.registeredAt)}</td>
              <td className="row-actions"><button className="ghost-button danger-text" onClick={() => setToCancel(r)}>ביטול הרשמה</button></td>
            </tr>)}</tbody>
          </table>
        </div>
      : !error && <EmptyState icon={<ClipboardList size={34}/>} title="עוד לא נרשמת לחוגים" text="בחרו חוג מהקטלוג והירשמו בכמה רגעים."
          action={<Link to="/courses" className="secondary-button">לקטלוג החוגים <ArrowLeft size={16}/></Link>}/>}

    {!loading && !!data?.totalCount && <Pagination page={data.page} pageSize={data.pageSize} totalCount={data.totalCount} unit="הרשמות"
      onPage={p => q.set({ page: p }, false)} onPageSize={s => q.set({ pageSize: s })}/>}

    {toCancel && <ConfirmModal title="ביטול הרשמה" text={`לבטל את ההרשמה לחוג ״${toCancel.courseName}״?`}
      confirmLabel="כן, לבטל" busy={busy} onConfirm={cancelRegistration} onClose={() => setToCancel(null)}/>}
  </main>
}
