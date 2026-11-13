import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { homePath, useAuth } from '../lib/auth'
import type { Role } from '../lib/api'

// מסך שדורש התחברות, ואופציונלית תפקיד מסוים. השרת בודק הרשאות בכל מקרה; כאן זה רק לניווט נוח
export function ProtectedRoute({ roles, children }: { roles?: Role[]; children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }}/>
  if (roles && !roles.includes(user.role)) return <Navigate to={homePath(user.role)} replace/>
  return <>{children}</>
}
