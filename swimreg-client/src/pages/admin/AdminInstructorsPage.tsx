import { useEffect, useState } from 'react'
import { Plus, UserRound } from 'lucide-react'
import { CourseFormModal } from '../../components/CourseFormModal'
import { Notice } from '../../components/Notice'
import { EmptyState, Loading, PageHeader } from '../../components/PageHeader'
import { StudentsByCourse } from '../../components/StudentsByCourse'
import { errorBody, instructorsApi } from '../../lib/api'
import type { ApiErrorBody, Instructor } from '../../lib/api'
import { useQueryState } from '../../lib/useQueryState'

// המנהל בוחר מדריך, רואה את התלמידים שלו לפי קורס, ויכול להוסיף לו קורס חדש
export default function AdminInstructorsPage() {
  const q = useQueryState({ id: '' })
  const [instructors, setInstructors] = useState<Instructor[] | null>(null)
  const [error, setError] = useState<ApiErrorBody | null>(null)
  const [success, setSuccess] = useState('')
  const [adding, setAdding] = useState(false)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    instructorsApi.list().then(setInstructors).catch(err => { setError(errorBody(err, 'לא ניתן לטעון את המדריכים.')); setInstructors([]) })
  }, [])

  const selectedId = Number(q.get('id')) || instructors?.[0]?.id
  const selected = instructors?.find(i => i.id === selectedId)

  return <main className="page-main">
    <PageHeader eyebrow="ADMIN · INSTRUCTORS" title="מדריכים" subtitle="בחרו מדריך כדי לראות את התלמידים שלו ולהוסיף לו קורס."/>
    {error && <Notice type="error" message={error.message || 'אירעה שגיאה'} details={error}/>}
    {success && <Notice type="success" message={success} onClose={() => setSuccess('')}/>}

    {!instructors ? <Loading/> : instructors.length === 0
      ? !error && <EmptyState icon={<UserRound size={34}/>} title="אין מדריכים" text="אין במערכת משתמשים עם תפקיד מדריך."/>
      : <div className="split-layout">
          <aside className="side-list" aria-label="רשימת מדריכים">
            {instructors.map(i => <button key={i.id} className={`side-item ${i.id === selectedId ? 'active' : ''}`} onClick={() => q.set({ id: i.id })}>
              <span className="avatar">{i.fullName.charAt(0)}</span>
              <span><strong>{i.fullName}</strong><small dir="ltr">{i.email}</small></span>
            </button>)}
          </aside>
          {selected && <section>
            <div className="section-head">
              <h2>{selected.fullName}</h2>
              <button className="primary-button compact" onClick={() => setAdding(true)}><Plus size={18}/> קורס חדש למדריך</button>
            </div>
            <StudentsByCourse key={`${selected.id}-${refresh}`} instructorId={selected.id}/>
          </section>}
        </div>}

    {adding && selected && <CourseFormModal presetInstructorId={selected.id}
      onSaved={m => { setAdding(false); setSuccess(m); setRefresh(v => v + 1) }} onClose={() => setAdding(false)}/>}
  </main>
}
