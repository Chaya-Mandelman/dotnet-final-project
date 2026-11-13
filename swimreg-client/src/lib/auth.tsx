import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { AUTH_EVENT, clearSession, getUser, saveSession, type AuthResponse, type Role, type User } from './api'

type AuthState = { user: User | null; login: (auth: AuthResponse) => void; logout: () => void }

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getUser())

  // מתעדכן גם כשה-api מנתק בגלל 401, וגם כשמתנתקים בלשונית אחרת
  useEffect(() => {
    const sync = () => setUser(getUser())
    window.addEventListener(AUTH_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => { window.removeEventListener(AUTH_EVENT, sync); window.removeEventListener('storage', sync) }
  }, [])

  const value: AuthState = {
    user,
    login: auth => saveSession(auth),
    logout: () => clearSession()
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

// דף הבית של כל תפקיד אחרי התחברות
export function homePath(role: Role | undefined) {
  if (role === 'Admin') return '/admin/courses'
  if (role === 'Instructor') return '/instructor/students'
  return '/courses'
}

export const roleLabel: Record<Role, string> = { Admin: 'מנהל', Instructor: 'מדריך', Student: 'מתאמן' }
