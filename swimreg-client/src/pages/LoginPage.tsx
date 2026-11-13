import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, UserRound, Waves, ShieldCheck, Sparkles } from 'lucide-react'
import { authApi, errorBody } from '../lib/api'
import type { ApiErrorBody } from '../lib/api'
import { homePath, useAuth } from '../lib/auth'
import { fieldError } from '../lib/format'
import { Brand } from '../components/Brand'
import { Notice } from '../components/Notice'
export default function LoginPage({ mode }: { mode: 'login' | 'register' }) {
  const { login } = useAuth()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const expired = searchParams.get('expired') === '1'
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiErrorBody | null>(null)
  const [success, setSuccess] = useState(() => (location.state as { registered?: boolean } | null)?.registered ? 'החשבון נוצר בהצלחה! אפשר להתחבר עכשיו.' : '')
  const navigate = useNavigate()
  const changeMode = (next: 'login'|'register') => { setError(null); setSuccess(''); setPassword(''); navigate(next === 'login' ? '/login' : '/register') }
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(null); setSuccess(''); setLoading(true)
    try {
      if (mode === 'register') {
        await authApi.register(fullName.trim(), email.trim(), password)
        setPassword('')
        navigate('/login', { state: { registered: true } })
      } else {
        // השרת מחזיר { token, expiresAt, user }. השמירה ב-AuthContext, וה-token יישלח מעכשיו בכל בקשה
        const result = await authApi.login(email.trim(), password)
        login(result)
        const from = (location.state as { from?: string } | null)?.from
        navigate(from || homePath(result.user.role), { replace: true })
      }
    } catch (err) { setError(errorBody(err)) }
    finally { setLoading(false) }
  }
  return <div className="auth-layout">
    <section className="auth-panel"><div className="auth-panel-glow"/><div className="auth-panel-inner"><Brand light/><div className="hero-copy"><div className="hero-eyebrow"><Sparkles size={15}/> המקום שבו מתחילים לשחות</div><h1>הצעד הבא שלך<br/>מתחיל <em>במים.</em></h1><p>מוצאים את החוג שמתאים לך, נרשמים בקלות ויוצאים לדרך. חוויית שחייה טובה מתחילה כאן.</p><div className="hero-divider"/><div className="hero-proof"><span className="proof-icon"><ShieldCheck size={23}/></span><span><strong>הרשמה פשוטה ובטוחה</strong><small>כל החוגים, במקום אחד</small></span></div></div><div className="auth-panel-bottom"><span>SWIMREG EXPERIENCE</span><Waves size={18}/></div></div><div className="water-ring ring-one"/><div className="water-ring ring-two"/><div className="water-ring ring-three"/></section>
    <main className="auth-form-side"><div className="mobile-brand"><Brand/></div><div className="auth-card"><div className="eyebrow">ברוכים הבאים ל-SwimReg</div><h2>{mode === 'login' ? 'טוב לראות אותך שוב' : 'מתחילים לשחות יחד'}</h2><p className="form-subtitle">{mode === 'login' ? 'התחברו לחשבון כדי לגלות את החוג הבא שלכם.' : 'כמה פרטים קטנים ואתם בדרך לחוג הראשון שלכם.'}</p><div className="auth-tabs" role="tablist" aria-label="בחירת פעולה"><button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'active' : ''} onClick={() => changeMode('login')}>התחברות</button><button type="button" role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'active' : ''} onClick={() => changeMode('register')}>יצירת חשבון</button></div>
    {expired && !error && !success && <Notice type="error" message="תוקף ההתחברות פג. התחברו שוב כדי להמשיך."/>}
    {error && <Notice type="error" message={error.message || 'הבקשה נכשלה'} details={error} onClose={() => setError(null)}/ >}{success && <Notice type="success" message={success} onClose={() => setSuccess('')}/>}
    <form onSubmit={submit} className="auth-form">{mode === 'register' && <label className="field"><span>שם מלא</span><div className="input-wrap"><UserRound size={19}/><input value={fullName} onChange={e => setFullName(e.target.value)} required minLength={2} maxLength={100} autoComplete="name" placeholder="איך קוראים לך?"/></div></label>}<label className="field"><span>כתובת אימייל</span><div className="input-wrap"><Mail size={19}/><input type="email" dir="ltr" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" placeholder="name@example.com"/></div></label><label className="field"><span>סיסמה</span><div className="input-wrap"><LockKeyhole size={19}/><input type={showPassword ? 'text' : 'password'} dir="ltr" value={password} onChange={e => setPassword(e.target.value)} required minLength={mode === 'register' ? 6 : undefined} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="••••••••"/><button type="button" className="password-toggle" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}>{showPassword ? <EyeOff size={19}/> : <Eye size={19}/>}</button></div>{mode === 'register' && <small>לפחות 6 תווים</small>}{fieldError(error, 'Password') && <small className="field-error">{fieldError(error, 'Password')}</small>}</label><button className="primary-button auth-submit" disabled={loading} type="submit">{loading ? 'רק רגע...' : mode === 'login' ? 'כניסה לחשבון' : 'יצירת חשבון'} {!loading && <ArrowLeft size={19}/>}</button></form><p className="auth-switch">{mode === 'login' ? 'עוד אין לך חשבון?' : 'כבר יש לך חשבון?'} <button type="button" onClick={() => changeMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'הרשמה בחינם' : 'להתחברות'}</button></p></div><footer className="auth-footer"><span>© {new Date().getFullYear()} SwimReg</span><span>נבנה כדי להפוך כל התחלה לקלה יותר</span><Link to="/login">SwimReg</Link></footer></main>
  </div>
}
