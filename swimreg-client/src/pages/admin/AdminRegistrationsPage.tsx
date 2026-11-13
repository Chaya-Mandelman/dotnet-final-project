import { useEffect, useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { ConflictCard } from '../../components/ConflictCard'
import { ConfirmModal } from '../../components/Modal'
import { Notice } from '../../components/Notice'
import { EmptyState, Loading, PageHeader } from '../../components/PageHeader'
import { Pagination } from '../../components/Pagination'
import { coursesApi, errorBody, registrationsApi } from '../../lib/api'
import type { ApiErrorBody, Course, PagedResult, Registration } from '../../lib/api'
import { formatDate } from '../../lib/format'
import { useQueryState } from '../../lib/useQueryState'
import { Select } from './AdminCoursesPage'

// כל ההרשמות במערכת (Admin בלבד), עם סינון לפי קורס ודפדוף בשרת
export default function AdminRegistrationsPage() {
  const q = useQueryState({ page: '1', pageSize: '10', courseId: '' })
  const [data, setData] = useState<PagedResult<Registration> | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [refresh, setRefresh] = useState(0)
  const [error, setError] = useState<ApiErrorBody | null>(null)
  const [conflict, setConflict] = useState<ApiErrorBody | null>(null)
  const [success, setSuccess] = useState('')
  const [toCancel, setToCancel] = useState<Registration | null>(null)
  const [busy, setBusy] = useState(false)
  const courseId = q.get('courseId')

  // רשימת קורסים לסינון (50 הוא הגודל המקסימלי שהשרת מאפשר לעמוד)
  useEffect(() => { coursesApi.list({ page: 1, pageSize: 50, sortBy: 'name' }).then(r => setCourses(r.items)).catch(() => setCourses([])) }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    registrationsApi.list(q.page, q.pageSize, courseId ? Number(courseId) : undefined)
      .then(r => { if (!cancelled) { setData(r); setError(null) } })
      .catch(err => { if (!cancelled) setError(errorBody(err, 'לא ניתן לטעון את ההרשמות.')) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [q.page, q.pageSize, courseId, refresh])

  async function cancel() {
    if (!toCancel) return
    setBusy(true); setError(null); setConflict(null); setSuccess('')
    try {
      await registrationsApi.cancel(toCancel.id)
      setSuccess(`ההרשמה של ${toCancel.userFullName} לחוג ״${toCancel.courseName}״ בוטלה.`)
      setRefresh(v => v + 1)
    } catch (err) {
      const b = errorBody(err, 'לא ניתן לבטל את ההרשמה.')
      if (b.status === 409) setConflict(b); else setError(b)
    } finally { setBusy(false); setToCancel(null) }
  }

  return <main className="page-main">
    <PageHeader eyebrow="ADMIN · REGISTRATIONS" title="כל ההרשמות" subtitle="צפייה בכל ההרשמות במערכת וביטול הרשמה."/>

    <div className="toolbar">
      <Select label="קורס" value={courseId} onChange={v => q.set({ courseId: v })}
        options={[{ value: '', label: 'כל הקורסים' }, ...courses.map(c => ({ value: String(c.id), label: c.name }))]}/>
      {data && <span className="toolbar-total">{data.totalCount} הרשמות</span>}
    </div>

    {success && <Notice type="success" message={success} onClose={() => setSuccess('')}/>}
    {error && <Notice type="error" message={error.message || 'אירעה שגיאה'} details={error} onClose={() => setError(null)}/>}
    {conflict && <ConflictCard details={conflict} title="הביטול התנגש בשינוי אחר" hint="הקורס עודכן באותו רגע. נסו לבטל שוב."
      onRetry={() => { setConflict(null); setRefresh(v => v + 1) }} retryLabel="רענון הרשימה" onClose={() => setConflict(null)}/>}

    {loading ? <Loading/> : data && data.items.length > 0
      ? <div className="table-card">
          <table className="data-table">
            <thead><tr><th>#</th><th>מתאמן/ת</th><th>קורס</th><th>בריכה</th><th>תאריך הרשמה</th><th aria-label="פעולות"/></tr></thead>
            <tbody>{data.items.map(r => <tr key={r.id}>
              <td data-label="#" className="muted">{r.id}</td>
              <td data-label="מתאמן/ת"><strong>{r.userFullName}</strong></td>
              <td data-label="קורס">{r.courseName}</td>
              <td data-label="בריכה">{r.poolName}</td>
              <td data-label="תאריך הרשמה">{formatDate(r.registeredAt)}</td>
              <td className="row-actions"><button className="ghost-button danger-text" onClick={() => setToCancel(r)}>ביטול</button></td>
            </tr>)}</tbody>
          </table>
        </div>
      : !error && <EmptyState icon={<ClipboardList size={34}/>} title="אין הרשמות" text="לא נמצאו הרשמות שתואמות לסינון."/>}

    {!loading && !!data?.totalCount && <Pagination page={data.page} pageSize={data.pageSize} totalCount={data.totalCount} unit="הרשמות"
      onPage={p => q.set({ page: p }, false)} onPageSize={s => q.set({ pageSize: s })}/>}

    {toCancel && <ConfirmModal title="ביטול הרשמה" text={`לבטל את ההרשמה של ${toCancel.userFullName} לחוג ״${toCancel.courseName}״?`}
      confirmLabel="כן, לבטל" busy={busy} onConfirm={cancel} onClose={() => setToCancel(null)}/>}
  </main>
}
