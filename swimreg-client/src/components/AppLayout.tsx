import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Check, LogOut } from 'lucide-react'
import { Brand } from './Brand'
import { roleLabel, useAuth } from '../lib/auth'
import type { Role } from '../lib/api'

const navByRole: Record<Role, { to: string; label: string }[]> = {
  Student: [
    { to: '/courses', label: 'חוגים' },
    { to: '/my-registrations', label: 'ההרשמות שלי' }
  ],
  Instructor: [
    { to: '/instructor/students', label: 'התלמידים שלי' }
  ],
  Admin: [
    { to: '/admin/courses', label: 'קורסים' },
    { to: '/admin/registrations', label: 'הרשמות' },
    { to: '/admin/instructors', label: 'מדריכים' },
    { to: '/admin/pools', label: 'בריכות' }
  ]
}

export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  if (!user) return null

  function signOut() { logout(); navigate('/login', { replace: true }) }

  return <div className="app-shell">
    <header className="site-header">
      <div className="header-inner">
        <Brand/>
        <nav className="main-nav" aria-label="ניווט ראשי">
          {navByRole[user.role].map(item =>
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `main-nav-link ${isActive ? 'active' : ''}`}>{item.label}</NavLink>)}
        </nav>
        <div className="user-box">
          <span className="user-meta"><strong>{user.fullName}</strong><small>{roleLabel[user.role]}</small></span>
          <button className="logout-button" onClick={signOut}><LogOut size={18}/><span>התנתקות</span></button>
        </div>
      </div>
    </header>
    <Outlet/>
    <footer className="site-footer">
      <span>© {new Date().getFullYear()} SwimReg. כל הזכויות שמורות.</span>
      <span><Check size={15}/> כאן מתחילה חוויית השחייה שלך</span>
    </footer>
  </div>
}
