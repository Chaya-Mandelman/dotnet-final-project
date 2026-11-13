import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { ConflictCard } from './ConflictCard'
import { Modal } from './Modal'
import { Notice } from './Notice'
import { Loading } from './PageHeader'
import { coursesApi, errorBody, instructorsApi, poolsApi } from '../lib/api'
import type { ApiErrorBody, Course, CourseRequest, Day, Instructor, Level, Pool } from '../lib/api'
import { days, fieldError, levels } from '../lib/format'

type Form = { name: string; level: Level; dayOfWeek: Day; startTime: string; maxParticipants: string; poolId: string; instructorId: string }

const toForm = (c?: Course | null, instructorId?: number): Form => ({
  name: c?.name ?? '',
  level: c?.level ?? 'Beginner',
  dayOfWeek: c?.dayOfWeek ?? 'Sunday',
  startTime: c ? c.startTime.slice(0, 5) : '17:00',
  maxParticipants: String(c?.maxParticipants ?? 10),
  poolId: c ? String(c.poolId) : '',
  instructorId: c ? String(c.instructorId) : instructorId ? String(instructorId) : ''
})

// טופס יצירה/עריכה של קורס. הולידציה האמיתית בשרת: 400 מוצג ליד השדות, 409 (עריכה במקביל) בכרטיס ייעודי
export function CourseFormModal({ course, presetInstructorId, onSaved, onClose }: {
  course?: Course | null
  presetInstructorId?: number
  onSaved: (message: string) => void
  onClose: () => void
}) {
  const editing = !!course
  const [form, setForm] = useState<Form>(() => toForm(course, presetInstructorId))
  const [current, setCurrent] = useState<Course | null>(course ?? null)
  const [pools, setPools] = useState<Pool[] | null>(null)
  const [instructors, setInstructors] = useState<Instructor[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<ApiErrorBody | null>(null)
  const [conflict, setConflict] = useState<ApiErrorBody | null>(null)

  useEffect(() => {
    Promise.all([poolsApi.list(), instructorsApi.list()])
      .then(([p, i]) => { setPools(p); setInstructors(i) })
      .catch(err => { setError(errorBody(err, 'לא ניתן לטעון בריכות ומדריכים.')); setPools([]); setInstructors([]) })
  }, [])

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm(f => ({ ...f, [key]: value }))

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null); setConflict(null)
    const body: CourseRequest = {
      name: form.name.trim(), level: form.level, dayOfWeek: form.dayOfWeek,
      startTime: `${form.startTime}:00`,
      maxParticipants: Number(form.maxParticipants), poolId: Number(form.poolId), instructorId: Number(form.instructorId)
    }
    try {
      if (editing && course) { await coursesApi.update(course.id, body); onSaved(`הקורס ״${body.name}״ עודכן.`) }
      else { const created = await coursesApi.create(body); onSaved(`הקורס ״${created.name}״ נוסף.`) }
    } catch (err) {
      const b = errorBody(err, 'לא ניתן לשמור את הקורס.')
      if (b.status === 409) setConflict(b); else setError(b)
    } finally { setBusy(false) }
  }

  // אחרי 409 בעריכה: טוענים את הקורס כפי שהוא עכשיו בשרת, ומעדכנים רק את מספר הנרשמים
  async function reloadCurrent() {
    if (!course) return
    try { const fresh = await coursesApi.get(course.id); setCurrent(fresh); setConflict(null) }
    catch (err) { setError(errorBody(err)) }
  }

  const err = (field: string) => fieldError(error, field)

  return <Modal title={editing ? 'עריכת קורס' : 'קורס חדש'} onClose={onClose} width={640}>
    {!pools || !instructors ? <Loading/> : <form className="form-grid" onSubmit={submit} noValidate>
      {error && <div className="span-2"><Notice type="error" message={error.message || 'הבקשה נכשלה'} details={error} onClose={() => setError(null)}/></div>}
      {conflict && <div className="span-2"><ConflictCard details={conflict} title="הקורס השתנה בזמן העריכה"
        hint="מישהו נרשם או עדכן את הקורס בזמן שערכת אותו. טענו את המצב העדכני ונסו לשמור שוב."
        onRetry={reloadCurrent} retryLabel="טעינת המצב העדכני" onClose={() => setConflict(null)}/></div>}

      <Field label="שם הקורס" error={err('Name')} className="span-2">
        <input value={form.name} onChange={e => set('name', e.target.value)} required minLength={2} maxLength={100}/>
      </Field>
      <Field label="רמה" error={err('Level')}>
        <select value={form.level} onChange={e => set('level', e.target.value as Level)}>{levels.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}</select>
      </Field>
      <Field label="יום" error={err('DayOfWeek')}>
        <select value={form.dayOfWeek} onChange={e => set('dayOfWeek', e.target.value as Day)}>{days.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}</select>
      </Field>
      <Field label="שעת התחלה" error={err('StartTime')}>
        <input type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} required dir="ltr"/>
      </Field>
      <Field label="מספר מקומות (1–30)" error={err('MaxParticipants')}
        hint={editing && current ? `רשומים כרגע: ${current.currentCount}. אי אפשר לרדת מתחת למספר הזה.` : undefined}>
        <input type="number" min={1} max={30} value={form.maxParticipants} onChange={e => set('maxParticipants', e.target.value)} required dir="ltr"/>
      </Field>
      <Field label="בריכה" error={err('PoolId')}>
        <select value={form.poolId} onChange={e => set('poolId', e.target.value)} required>
          <option value="">בחרו בריכה</option>{pools.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>
      <Field label="מדריך/ה" error={err('InstructorId')}>
        <select value={form.instructorId} onChange={e => set('instructorId', e.target.value)} required>
          <option value="">בחרו מדריך</option>{instructors.map(i => <option key={i.id} value={i.id}>{i.fullName}</option>)}
        </select>
      </Field>

      <div className="modal-actions span-2">
        <button type="button" className="ghost-button" onClick={onClose} disabled={busy}>ביטול</button>
        <button type="submit" className="primary-button compact" disabled={busy}>{busy ? 'שומרים...' : editing ? 'שמירת שינויים' : 'הוספת הקורס'}</button>
      </div>
    </form>}
  </Modal>
}

export function Field({ label, error, hint, className = '', children }: { label: string; error?: string; hint?: string; className?: string; children: ReactNode }) {
  return <label className={`form-field ${error ? 'has-error' : ''} ${className}`}>
    <span>{label}</span>
    {children}
    {error ? <small className="field-error">{error}</small> : hint && <small className="field-hint">{hint}</small>}
  </label>
}
