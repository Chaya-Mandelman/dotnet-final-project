import { useEffect, useState } from 'react'
import { ChevronDown, Pencil, Plus, Trash2, Waves } from 'lucide-react'
import { ConflictCard } from '../../components/ConflictCard'
import { CourseFormModal } from '../../components/CourseFormModal'
import { ConfirmModal } from '../../components/Modal'
import { Notice } from '../../components/Notice'
import { EmptyState, Loading, PageHeader } from '../../components/PageHeader'
import { Pagination } from '../../components/Pagination'
import { coursesApi, errorBody, poolsApi } from '../../lib/api'
import type { ApiErrorBody, Course, PagedResult, Pool } from '../../lib/api'
import { dayLabel, formatTime, levelLabel, levels, sortOptions } from '../../lib/format'
import { useQueryState } from '../../lib/useQueryState'

// ניהול קורסים: טבלה עם דפדוף וסינון בשרת, הוספה/עריכה בחלון, ומחיקה (409 אם יש הרשמות)
export default function AdminCoursesPage() {
  const q = useQueryState({ page: '1', pageSize: '10', level: '', poolId: '', sortBy: '' })
  const [data, setData] = useState<PagedResult<Course> | null>(null)
  const [pools, setPools] = useState<Pool[]>([])
  const [loading, setLoading] = useState(true)
  const [refresh, setRefresh] = useState(0)
  const [error, setError] = useState<ApiErrorBody | null>(null)
  const [conflict, setConflict] = useState<ApiErrorBody | null>(null)
  const [success, setSuccess] = useState('')
  const [editing, setEditing] = useState<Course | null | 'new'>(null)
  const [toDelete, setToDelete] = useState<Course | null>(null)
  const [busy, setBusy] = useState(false)
  const level = q.get('level'), poolId = q.get('poolId'), sortBy = q.get('sortBy')

  useEffect(() => { poolsApi.list().then(setPools).catch(() => setPools([])) }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    coursesApi.list({ page: q.page, pageSize: q.pageSize, level, poolId, sortBy })
      .then(r => { if (!cancelled) { setData(r); setError(null) } })
      .catch(err => { if (!cancelled) setError(errorBody(err, 'לא ניתן לטעון את הקורסים.')) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [q.page, q.pageSize, level, poolId, sortBy, refresh])

  function saved(message: string) {
    setEditing(null); setSuccess(message); setConflict(null); setError(null); setRefresh(v => v + 1)
  }

  async function remove() {
    if (!toDelete) return
    setBusy(true); setError(null); setConflict(null); setSuccess('')
    try {
      await coursesApi.remove(toDelete.id)
      setSuccess(`הקורס ״${toDelete.name}״ נמחק.`)
      setRefresh(v => v + 1)
    } catch (err) {
      const b = errorBody(err, 'לא ניתן למחוק את הקורס.')
      if (b.status === 409) setConflict(b); else setError(b)
    } finally { setBusy(false); setToDelete(null) }
  }

  return <main className="page-main">
    <PageHeader eyebrow="ADMIN · COURSES" title="ניהול קורסים" subtitle="הוספה, עריכה ומחיקה של קורסים, ושיוך מדריך לכל קורס."
      actions={<button className="primary-button compact" onClick={() => setEditing('new')}><Plus size={18}/> קורס חדש</button>}/>

    <div className="toolbar">
      <Select label="רמה" value={level} onChange={v => q.set({ level: v })} options={[{ value: '', label: 'כל הרמות' }, ...levels]}/>
      <Select label="בריכה" value={poolId} onChange={v => q.set({ poolId: v })} options={[{ value: '', label: 'כל הבריכות' }, ...pools.map(p => ({ value: String(p.id), label: p.name }))]}/>
      <Select label="מיון" value={sortBy} onChange={v => q.set({ sortBy: v })} options={sortOptions}/>
    </div>

    {success && <Notice type="success" message={success} onClose={() => setSuccess('')}/>}
    {error && <Notice type="error" message={error.message || 'אירעה שגיאה'} details={error} onClose={() => setError(null)}/>}
    {conflict && <ConflictCard details={conflict} title="לא ניתן למחוק את הקורס"
      hint="השרת חוסם מחיקה של קורס שיש בו הרשמות. אפשר לבטל קודם את ההרשמות במסך ״הרשמות״." onClose={() => setConflict(null)}/>}

    {loading ? <Loading/> : data && data.items.length > 0
      ? <div className="table-card">
          <table className="data-table">
            <thead><tr><th>קורס</th><th>רמה</th><th>מועד</th><th>בריכה</th><th>מדריך/ה</th><th>תפוסה</th><th aria-label="פעולות"/></tr></thead>
            <tbody>{data.items.map(c => <tr key={c.id}>
              <td data-label="קורס"><strong>{c.name}</strong></td>
              <td data-label="רמה"><span className="level-pill">{levelLabel(c.level)}</span></td>
              <td data-label="מועד">יום {dayLabel(c.dayOfWeek)}, {formatTime(c.startTime)}</td>
              <td data-label="בריכה">{c.poolName}</td>
              <td data-label="מדריך/ה">{c.instructorName}</td>
              <td data-label="תפוסה"><Occupancy current={c.currentCount} max={c.maxParticipants}/></td>
              <td className="row-actions">
                <button className="icon-action" title="עריכה" aria-label={`עריכת ${c.name}`} onClick={() => setEditing(c)}><Pencil size={17}/></button>
                <button className="icon-action danger" title="מחיקה" aria-label={`מחיקת ${c.name}`} onClick={() => setToDelete(c)}><Trash2 size={17}/></button>
              </td>
            </tr>)}</tbody>
          </table>
        </div>
      : !error && <EmptyState icon={<Waves size={34}/>} title="אין קורסים" text="אין קורסים שתואמים לסינון."/>}

    {!loading && !!data?.totalCount && <Pagination page={data.page} pageSize={data.pageSize} totalCount={data.totalCount} unit="קורסים"
      onPage={p => q.set({ page: p }, false)} onPageSize={s => q.set({ pageSize: s })}/>}

    {editing && <CourseFormModal course={editing === 'new' ? null : editing} onSaved={saved} onClose={() => setEditing(null)}/>}
    {toDelete && <ConfirmModal title="מחיקת קורס" text={`למחוק את הקורס ״${toDelete.name}״? הפעולה אינה הפיכה.`}
      confirmLabel="מחיקה" busy={busy} onConfirm={remove} onClose={() => setToDelete(null)}/>}
  </main>
}

export function Occupancy({ current, max }: { current: number; max: number }) {
  const full = current >= max
  return <div className="occupancy">
    <span className={full ? 'is-full' : ''}>{current}/{max}</span>
    <div className="capacity-track mini"><span style={{ width: `${Math.min(100, current / Math.max(1, max) * 100)}%` }}/></div>
  </div>
}

export function Select({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  return <label className="filter-select"><span>{label}</span><div className="select-wrap">
    <select value={value} onChange={e => onChange(e.target.value)}>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
    <ChevronDown size={17}/>
  </div></label>
}
