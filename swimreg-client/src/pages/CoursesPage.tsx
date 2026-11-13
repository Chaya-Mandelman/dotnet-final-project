import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CalendarDays, ChevronDown, Clock3, MapPin, RefreshCw, Search, Users, Waves } from 'lucide-react'
import { Notice } from '../components/Notice'
import { Pagination } from '../components/Pagination'
import { EmptyState } from '../components/PageHeader'
import { coursesApi, errorBody, poolsApi } from '../lib/api'
import type { ApiErrorBody, Course, PagedResult, Pool } from '../lib/api'
import { dayLabel, formatTime, levelLabel, levels, sortOptions } from '../lib/format'
import { useQueryState } from '../lib/useQueryState'

// קטלוג הקורסים למתאמן: סינון, מיון ודפדוף נעשים בשרת (page/pageSize/level/poolId/sortBy)
export default function CoursesPage() {
  const q = useQueryState({ page: '1', pageSize: '6', level: '', poolId: '', sortBy: '' })
  const [data, setData] = useState<PagedResult<Course> | null>(null)
  const [pools, setPools] = useState<Pool[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiErrorBody | null>(null)
  const [refresh, setRefresh] = useState(0)
  const level = q.get('level'), poolId = q.get('poolId'), sortBy = q.get('sortBy')

  useEffect(() => { poolsApi.list().then(setPools).catch(() => setPools([])) }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    coursesApi.list({ page: q.page, pageSize: q.pageSize, level, poolId, sortBy })
      .then(result => { if (!cancelled) { setData(result); setError(null) } })
      .catch(err => { if (!cancelled) { setError(errorBody(err, 'לא ניתן לטעון את הקורסים.')); setData(null) } })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [q.page, q.pageSize, level, poolId, sortBy, refresh])

  return <main className="courses-main">
    <section className="welcome-hero">
      <div className="welcome-content">
        <span className="section-kicker"><span className="kicker-dot"/> מתחילים כאן</span>
        <h1>החוג הבא שלך<br/><em>מחכה לך במים.</em></h1>
        <p>מגלים את חוגי השחייה שלנו, בוחרים את הרמה המתאימה ונרשמים בכמה רגעים.</p>
        <div className="hero-mini-stat"><span className="stat-icon"><Waves size={19}/></span><span>מגוון חוגים לכל הרמות</span></div>
      </div>
      <div className="welcome-graphic" aria-hidden="true"><div className="graphic-orbit orbit-outer"/><div className="graphic-orbit orbit-inner"/><div className="graphic-center"><Waves size={96} strokeWidth={1.3}/></div><div className="graphic-bubble bubble-a"/><div className="graphic-bubble bubble-b"/></div>
    </section>

    <section className="catalog-section">
      <div className="catalog-heading">
        <div><div className="eyebrow">FIND YOUR FLOW</div><h2>מוצאים את החוג המתאים</h2><p>כל האפשרויות, בקצב שמתאים לך.</p></div>
        <div className="course-count"><span>{data?.totalCount ?? '—'}</span><small>חוגים תואמים</small></div>
      </div>

      <div className="toolbar">
        <div className="toolbar-label"><Search size={19}/><span>סינון ומיון</span></div>
        <FilterSelect label="רמה" value={level} onChange={v => q.set({ level: v })}
          options={[{ value: '', label: 'כל הרמות' }, ...levels]}/>
        <FilterSelect label="בריכה" value={poolId} onChange={v => q.set({ poolId: v })}
          options={[{ value: '', label: 'כל הבריכות' }, ...pools.map(p => ({ value: String(p.id), label: p.name }))]}/>
        <FilterSelect label="מיון" value={sortBy} onChange={v => q.set({ sortBy: v })} options={sortOptions}/>
        <button className="refresh-button" disabled={loading} onClick={() => setRefresh(v => v + 1)} title="רענון רשימה">
          <RefreshCw size={18} className={loading ? 'spinning' : ''}/> רענון
        </button>
      </div>

      {error && <Notice type="error" message={error.message || 'אירעה שגיאה'} details={error} onClose={() => setError(null)}/>}

      {loading
        ? <div className="course-grid" aria-busy="true">{Array.from({ length: q.pageSize }, (_, i) => <div className="course-card skeleton-card" key={i}><div className="skeleton skeleton-top"/><div className="skeleton skeleton-title"/><div className="skeleton skeleton-line"/><div className="skeleton skeleton-line"/><div className="skeleton skeleton-button"/></div>)}</div>
        : data?.items.length
          ? <div className="course-grid">{data.items.map((course, index) => <CourseCard key={course.id} course={course} index={index}/>)}</div>
          : !error && <EmptyState icon={<Waves size={34}/>} title="לא נמצאו חוגים" text="אפשר לשנות את הסינון או לרענן את הרשימה."
              action={<button className="secondary-button" onClick={() => q.set({ level: '', poolId: '', sortBy: '' })}>הצגת כל החוגים <ArrowLeft size={16}/></button>}/>}

      {!loading && !!data?.totalCount && <Pagination page={data.page} pageSize={data.pageSize} totalCount={data.totalCount} unit="חוגים"
        onPage={p => q.set({ page: p }, false)} onPageSize={s => q.set({ pageSize: s })}/>}
    </section>
  </main>
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  return <label className="filter-select"><span>{label}</span><div className="select-wrap">
    <select value={value} onChange={e => onChange(e.target.value)}>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
    <ChevronDown size={17}/>
  </div></label>
}

function CourseCard({ course, index }: { course: Course; index: number }) {
  const available = Math.max(0, course.maxParticipants - course.currentCount)
  const full = available === 0
  return <article className="course-card">
    <div className={`course-art art-${index % 3}`}><div className="art-lines"><Waves size={84} strokeWidth={1.1}/></div><span className="course-level">{levelLabel(course.level)}</span></div>
    <div className="course-card-body">
      <div className="course-topline"><span>חוג שחייה</span><span className={full ? 'status-full' : 'status-open'}><span className="status-dot"/>{full ? 'החוג מלא' : 'פתוח להרשמה'}</span></div>
      <h3>{course.name}</h3>
      <div className="course-meta">
        <span><CalendarDays size={17}/> יום {dayLabel(course.dayOfWeek)}</span>
        <span><Clock3 size={17}/> {formatTime(course.startTime)}</span>
        <span className="meta-full"><MapPin size={17}/> {course.poolName}</span>
      </div>
      <div className="capacity">
        <div className="capacity-label"><span><Users size={17}/> מקומות פנויים</span><strong>{available} מתוך {course.maxParticipants}</strong></div>
        <div className="capacity-track"><span style={{ width: `${Math.min(100, course.currentCount / Math.max(1, course.maxParticipants) * 100)}%` }}/></div>
      </div>
      <Link to={`/courses/${course.id}`} className={`course-register ${full ? 'course-register-full' : ''}`}>
        {full ? 'לפרטי החוג' : 'לפרטים והרשמה'} <ArrowLeft size={18}/>
      </Link>
    </div>
  </article>
}
