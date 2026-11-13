import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, GraduationCap, Lock, MapPin, UserRound, Users, Waves } from 'lucide-react'
import { ConflictCard } from '../components/ConflictCard'
import { ConfirmModal } from '../components/Modal'
import { Notice } from '../components/Notice'
import { EmptyState, Loading } from '../components/PageHeader'
import { coursesApi, errorBody, registrationsApi } from '../lib/api'
import type { ApiErrorBody, Course, Registration } from '../lib/api'
import { dayLabel, formatDate, formatTime, levelLabel } from '../lib/format'

// מסך הפעולה על המשאב המוגבל: הרשמה לקורס.
// 201 → ההרשמה נשמרה. 409 → השרת אומר שהמקום נתפס / הקורס מלא / כבר רשום,
// והמסך מציג את ההודעה שלו, טוען מחדש את המצב העדכני ומסביר מה אפשר לעשות.
export default function CourseDetailsPage() {
  const courseId = Number(useParams().id)
  const [course, setCourse] = useState<Course | null>(null)
  const [mine, setMine] = useState<Registration | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<(ApiErrorBody & { status: number }) | null>(null)
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState<ApiErrorBody | null>(null)
  const [conflict, setConflict] = useState<ApiErrorBody | null>(null)
  const [confirmCancel, setConfirmCancel] = useState(false)

  // טוען את הקורס ואת ההרשמה שלי אליו (השרת מחזיר ל-Student רק את ההרשמות שלו)
  const reload = useCallback(async () => {
    const [c, regs] = await Promise.all([coursesApi.get(courseId), registrationsApi.list(1, 1, courseId)])
    setCourse(c)
    setMine(regs.items[0] ?? null)
    return { course: c, mine: regs.items[0] ?? null }
  }, [courseId])

  useEffect(() => {
    setLoading(true)
    reload().then(() => setLoadError(null)).catch(err => setLoadError(errorBody(err))).finally(() => setLoading(false))
  }, [reload])

  async function register() {
    setBusy(true); setSuccess(''); setError(null); setConflict(null)
    try {
      const created = await registrationsApi.create(courseId)
      setMine(created)
      setSuccess(`נרשמת בהצלחה לחוג ״${created.courseName}״!`)
      await reload()
    } catch (err) {
      const body = errorBody(err, 'לא ניתן להשלים את ההרשמה.')
      if (body.status === 409) {
        setConflict(body)
        // אחרי 409 מציגים את המצב האמיתי מהשרת: כמה מקומות נשארו, והאם כבר רשום
        await reload().catch(() => undefined)
      } else {
        setError(body)
      }
    } finally { setBusy(false) }
  }

  async function cancel() {
    if (!mine) return
    setBusy(true); setSuccess(''); setError(null); setConflict(null)
    try {
      await registrationsApi.cancel(mine.id)
      setConfirmCancel(false)
      setSuccess('ההרשמה בוטלה. המקום שלך התפנה למתאמנים אחרים.')
      await reload()
    } catch (err) {
      const body = errorBody(err, 'לא ניתן לבטל את ההרשמה.')
      setConfirmCancel(false)
      if (body.status === 409) { setConflict(body); await reload().catch(() => undefined) } else setError(body)
    } finally { setBusy(false) }
  }

  if (loading) return <main className="page-main"><Loading text="טוענים את פרטי החוג..."/></main>
  if (loadError || !course) return <main className="page-main">
    <BackLink/>
    <EmptyState icon={<Waves size={34}/>} title={loadError?.status === 404 ? 'החוג לא נמצא' : 'לא ניתן לטעון את החוג'}
      text={loadError?.message || 'נסו שוב מאוחר יותר.'}/>
  </main>

  const available = Math.max(0, course.maxParticipants - course.currentCount)
  const full = available === 0
  const percent = Math.min(100, course.currentCount / Math.max(1, course.maxParticipants) * 100)

  // ההסבר מתחת ל-409 נקבע לפי המצב שנטען מחדש מהשרת אחרי ההתנגשות
  const conflictHint = mine
    ? 'את/ה כבר רשום/ה לחוג הזה, ולכן אין צורך להירשם שוב.'
    : full
      ? 'המצב עודכן: החוג התמלא ואין בו מקומות פנויים.'
      : 'מישהו אחר עדכן את החוג באותו רגע. עדיין יש מקום פנוי, אפשר לנסות שוב.'
  const canRetry = !mine && !full

  return <main className="page-main">
    <BackLink/>
    <div className="details-layout">
      <section className="details-card">
        <div className={`course-art art-${course.id % 3} details-art`}><div className="art-lines"><Waves size={110} strokeWidth={1.1}/></div><span className="course-level">{levelLabel(course.level)}</span></div>
        <div className="details-body">
          <div className="eyebrow">חוג שחייה</div>
          <h1>{course.name}</h1>
          <ul className="details-facts">
            <li><CalendarDays size={19}/><span>יום</span><strong>{dayLabel(course.dayOfWeek)}</strong></li>
            <li><Clock3 size={19}/><span>שעה</span><strong>{formatTime(course.startTime)}</strong></li>
            <li><GraduationCap size={19}/><span>רמה</span><strong>{levelLabel(course.level)}</strong></li>
            <li><MapPin size={19}/><span>בריכה</span><strong>{course.poolName}</strong></li>
            <li><UserRound size={19}/><span>מדריך/ה</span><strong>{course.instructorName}</strong></li>
          </ul>
        </div>
      </section>

      <aside className="action-panel" aria-live="polite">
        <div className="action-capacity">
          <span className="action-label"><Users size={18}/> מקומות פנויים</span>
          <div className="action-numbers"><strong className={full ? 'is-full' : ''}>{available}</strong><span>מתוך {course.maxParticipants}</span></div>
          <div className="capacity-track"><span style={{ width: `${percent}%` }}/></div>
          <small>{course.currentCount} רשומים כרגע</small>
        </div>

        {success && <Notice type="success" message={success} onClose={() => setSuccess('')}/>}
        {error && <Notice type="error" message={error.message || 'הפעולה נכשלה'} details={error} onClose={() => setError(null)}/>}
        {conflict && <ConflictCard details={conflict} hint={conflictHint} onClose={() => setConflict(null)}
          onRetry={canRetry ? register : undefined} retryLabel="ניסיון הרשמה נוסף"/>}

        {mine
          ? <div className="registered-box">
              <div className="registered-title"><CheckCircle2 size={22}/> את/ה רשום/ה לחוג</div>
              <small>נרשמת ב-{formatDate(mine.registeredAt)}</small>
              <button type="button" className="ghost-button danger-text" disabled={busy} onClick={() => setConfirmCancel(true)}>ביטול ההרשמה</button>
            </div>
          : <button type="button" className={`action-button ${full ? 'is-full' : ''}`} disabled={busy || full} onClick={register}>
              {busy ? 'שולחים הרשמה...' : full ? <><Lock size={18}/> החוג מלא</> : 'הרשמה לחוג'}
            </button>}
        <p className="action-note">המקומות מתעדכנים בזמן אמת מול השרת. אם מישהו תפס את המקום האחרון לפניך, תוצג הודעה מתאימה.</p>
      </aside>
    </div>

    {confirmCancel && <ConfirmModal title="ביטול הרשמה" text={`לבטל את ההרשמה לחוג ״${course.name}״? המקום יתפנה למתאמנים אחרים.`}
      confirmLabel="כן, לבטל" busy={busy} onConfirm={cancel} onClose={() => setConfirmCancel(false)}/>}
  </main>
}

function BackLink() {
  return <Link to="/courses" className="back-link"><ArrowRight size={17}/> חזרה לכל החוגים</Link>
}
