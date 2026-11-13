import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import { Notice } from './Notice'
import { EmptyState, Loading } from './PageHeader'
import { errorBody, instructorsApi } from '../lib/api'
import type { ApiErrorBody, InstructorStudent } from '../lib/api'
import { formatDate } from '../lib/format'

// התלמידים של מדריך, מקובצים לפי קורס. השרת מחזיר הכל בשאילתה אחת, והקיבוץ נעשה כאן לתצוגה בלבד
export function StudentsByCourse({ instructorId }: { instructorId: number }) {
  const [rows, setRows] = useState<InstructorStudent[] | null>(null)
  const [error, setError] = useState<ApiErrorBody | null>(null)

  useEffect(() => {
    let cancelled = false
    setRows(null); setError(null)
    instructorsApi.students(instructorId)
      .then(r => { if (!cancelled) setRows(r) })
      .catch(err => { if (!cancelled) { setError(errorBody(err, 'לא ניתן לטעון את התלמידים.')); setRows([]) } })
    return () => { cancelled = true }
  }, [instructorId])

  if (error) return <Notice type="error" message={error.message || 'אירעה שגיאה'} details={error}/>
  if (!rows) return <Loading text="טוענים תלמידים..."/>
  if (rows.length === 0) return <EmptyState icon={<Users size={34}/>} title="אין עדיין תלמידים רשומים" text="כשמתאמנים יירשמו לקורסים של המדריך, הם יופיעו כאן."/>

  const groups = new Map<number, { name: string; students: InstructorStudent[] }>()
  rows.forEach(r => {
    const g = groups.get(r.courseId) ?? { name: r.courseName, students: [] }
    g.students.push(r)
    groups.set(r.courseId, g)
  })

  return <div className="group-list">
    <div className="summary-chips"><span>{groups.size} קורסים</span><span>{rows.length} תלמידים</span></div>
    {[...groups.entries()].map(([courseId, g]) => <section key={courseId} className="table-card">
      <div className="table-card-head"><h3>{g.name}</h3><span className="count-badge">{g.students.length} רשומים</span></div>
      <table className="data-table">
        <thead><tr><th>שם התלמיד</th><th>אימייל</th><th>תאריך הרשמה</th></tr></thead>
        <tbody>{g.students.map(s => <tr key={s.registrationId}>
          <td data-label="שם"><strong>{s.studentName}</strong></td>
          <td data-label="אימייל" dir="ltr" className="ltr-cell">{s.studentEmail}</td>
          <td data-label="תאריך הרשמה">{formatDate(s.registeredAt)}</td>
        </tr>)}</tbody>
      </table>
    </section>)}
  </div>
}
