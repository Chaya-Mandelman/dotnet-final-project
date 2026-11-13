// שכבת התקשורת עם השרת: כל בקשה עוברת דרך api(), שמוסיפה את ה-JWT ומתרגמת שגיאות למבנה אחד.

// מבנה השגיאה האחיד של השרת: { statusCode, message, correlationId, errors? }
export type ApiErrorBody = { statusCode?: number; message?: string; correlationId?: string; errors?: Record<string, string[] | string> }

export class ApiError extends Error {
  constructor(public status: number, public details: ApiErrorBody) {
    super(details.message || 'אירעה שגיאה. נסו שוב.')
    this.name = 'ApiError'
  }
}

export type Role = 'Admin' | 'Instructor' | 'Student'
export type Level = 'Beginner' | 'Intermediate' | 'Advanced'
export type Day = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'

export type User = { id: number; fullName: string; email: string; role: Role }
export type AuthResponse = { token: string; expiresAt: string; user: User }
export type PagedResult<T> = { items: T[]; totalCount: number; page: number; pageSize: number }

export type Course = {
  id: number; name: string; level: Level; dayOfWeek: Day; startTime: string
  maxParticipants: number; currentCount: number
  poolId: number; poolName: string; instructorId: number; instructorName: string
}
export type CourseRequest = {
  name: string; level: Level; dayOfWeek: Day; startTime: string
  maxParticipants: number; poolId: number; instructorId: number
}
export type CourseQuery = { page: number; pageSize: number; level?: string; poolId?: string; sortBy?: string }

export type Pool = { id: number; name: string; address: string }
export type PoolRequest = { name: string; address: string }

export type Registration = {
  id: number; userId: number; userFullName: string
  courseId: number; courseName: string; poolName: string; registeredAt: string
}
export type InstructorStudent = {
  registrationId: number; courseId: number; courseName: string
  studentId: number; studentName: string; studentEmail: string; registeredAt: string
}
export type Instructor = { id: number; fullName: string; email: string }

// ---------- שמירת ההתחברות ----------
const TOKEN_KEY = 'swimreg_token'
const USER_KEY = 'swimreg_user'
const EXPIRES_KEY = 'swimreg_expires'
export const AUTH_EVENT = 'swimreg-auth'

function safeGet(key: string) { try { return localStorage.getItem(key) } catch { return null } }

export function getToken() {
  const token = safeGet(TOKEN_KEY)
  const expires = safeGet(EXPIRES_KEY)
  // token שפג תוקפו לא נשלח בכלל: עדיף להתחבר מחדש מאשר לקבל 401 באמצע פעולה
  if (token && expires && new Date(expires).getTime() <= Date.now()) { clearSession(); return null }
  return token
}

export function getUser(): User | null {
  if (!getToken()) return null
  try { return JSON.parse(safeGet(USER_KEY) || 'null') as User | null } catch { return null }
}

export function saveSession(auth: AuthResponse) {
  try {
    localStorage.setItem(TOKEN_KEY, auth.token)
    localStorage.setItem(EXPIRES_KEY, auth.expiresAt)
    localStorage.setItem(USER_KEY, JSON.stringify(auth.user))
  } catch { /* מצב גלישה פרטית: ההתחברות תחזיק רק עד רענון */ }
  window.dispatchEvent(new Event(AUTH_EVENT))
}

export function clearSession() {
  try { [TOKEN_KEY, EXPIRES_KEY, USER_KEY].forEach(k => localStorage.removeItem(k)) } catch { /* ignore */ }
  window.dispatchEvent(new Event(AUTH_EVENT))
}

// ---------- הבקשה עצמה ----------
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  const token = getToken()
  // ה-JWT נשלח בכל בקשה ב-header
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers })
  } catch {
    throw new ApiError(0, { message: 'לא ניתן להתחבר לשרת. בדקו שהשרת פועל ונסו שוב.' })
  }

  const raw = await response.text()
  let data: unknown = null
  if (raw) { try { data = JSON.parse(raw) } catch { data = null } }

  if (response.status === 401 && token) {
    // ה-token לא תקף יותר: מתנתקים וחוזרים להתחברות עם הסבר
    clearSession()
    window.location.replace('/login?expired=1')
  }
  if (!response.ok) {
    const body = (data && typeof data === 'object' ? data : {}) as ApiErrorBody
    throw new ApiError(response.status, { ...body, message: body.message || defaultMessage(response.status) })
  }
  return data as T
}

function defaultMessage(status: number) {
  if (status === 401) return 'פרטי ההתחברות אינם תקינים.'
  if (status === 403) return 'אין לך הרשאה לפעולה הזו.'
  if (status === 404) return 'הפריט המבוקש לא נמצא.'
  if (status === 409) return 'הפעולה התנגשה בשינוי אחר. נסו שוב.'
  return `שגיאת שרת (${status})`
}

// מחזיר את גוף השגיאה מכל חריגה, כדי שכל מסך יציג אותה באותה צורה
export function errorBody(err: unknown, fallback = 'אירעה שגיאה לא צפויה.'): ApiErrorBody & { status: number } {
  if (err instanceof ApiError) return { ...err.details, status: err.status }
  return { message: fallback, status: 0 }
}

const json = (body: unknown) => JSON.stringify(body)
const query = (params: Record<string, string | number | undefined>) => {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') q.set(k, String(v)) })
  return q.toString()
}

// ---------- Endpoints ----------
export const authApi = {
  login: (email: string, password: string) => api<AuthResponse>('/api/auth/login', { method: 'POST', body: json({ email, password }) }),
  register: (fullName: string, email: string, password: string) => api<User>('/api/auth/register', { method: 'POST', body: json({ fullName, email, password }) })
}

export const coursesApi = {
  list: (q: CourseQuery) => api<PagedResult<Course>>(`/api/courses?${query(q)}`),
  get: (id: number) => api<Course>(`/api/courses/${id}`),
  create: (body: CourseRequest) => api<Course>('/api/courses', { method: 'POST', body: json(body) }),
  update: (id: number, body: CourseRequest) => api<void>(`/api/courses/${id}`, { method: 'PUT', body: json(body) }),
  remove: (id: number) => api<void>(`/api/courses/${id}`, { method: 'DELETE' })
}

export const poolsApi = {
  list: () => api<Pool[]>('/api/pools'),
  get: (id: number) => api<Pool>(`/api/pools/${id}`),
  create: (body: PoolRequest) => api<Pool>('/api/pools', { method: 'POST', body: json(body) }),
  update: (id: number, body: PoolRequest) => api<void>(`/api/pools/${id}`, { method: 'PUT', body: json(body) }),
  remove: (id: number) => api<void>(`/api/pools/${id}`, { method: 'DELETE' })
}

export const registrationsApi = {
  // Student מקבל מהשרת רק את ההרשמות שלו, Admin את כולן
  list: (page: number, pageSize: number, courseId?: number) => api<PagedResult<Registration>>(`/api/registrations?${query({ page, pageSize, courseId })}`),
  get: (id: number) => api<Registration>(`/api/registrations/${id}`),
  create: (courseId: number) => api<Registration>('/api/registrations', { method: 'POST', body: json({ courseId }) }),
  cancel: (id: number) => api<void>(`/api/registrations/${id}`, { method: 'DELETE' })
}

export const instructorsApi = {
  list: () => api<Instructor[]>('/api/instructors'),
  students: (instructorId: number) => api<InstructorStudent[]>(`/api/instructors/${instructorId}/students`)
}
