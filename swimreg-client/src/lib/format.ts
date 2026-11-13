import type { ApiErrorBody, Day, Level } from './api'

export const levels: { value: Level; label: string }[] = [
  { value: 'Beginner', label: 'מתחילים' },
  { value: 'Intermediate', label: 'בינוניים' },
  { value: 'Advanced', label: 'מתקדמים' }
]
export const days: { value: Day; label: string }[] = [
  { value: 'Sunday', label: 'ראשון' }, { value: 'Monday', label: 'שני' }, { value: 'Tuesday', label: 'שלישי' },
  { value: 'Wednesday', label: 'רביעי' }, { value: 'Thursday', label: 'חמישי' }, { value: 'Friday', label: 'שישי' },
  { value: 'Saturday', label: 'שבת' }
]
export const sortOptions = [
  { value: '', label: 'ברירת מחדל' },
  { value: 'name', label: 'שם' },
  { value: 'level', label: 'רמה' },
  { value: 'day', label: 'יום' },
  { value: 'startTime', label: 'שעה' }
]

export const levelLabel = (v: string) => levels.find(l => l.value === v)?.label || v
export const dayLabel = (v: string) => days.find(d => d.value === v)?.label || v
export const formatTime = (t: string) => t?.slice(0, 5) || '—'
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

// שגיאת שדה מתוך errors של השרת. המפתחות מגיעים כשם המאפיין ב-C# (MaxParticipants) או כנתיב JSON ($.maxParticipants)
export function fieldError(details: ApiErrorBody | null, field: string): string | undefined {
  if (!details?.errors) return undefined
  const entry = Object.entries(details.errors).find(([key]) => key.replace(/^\$\./, '').split('.').pop()?.toLowerCase() === field.toLowerCase())
  if (!entry) return undefined
  return Array.isArray(entry[1]) ? entry[1].join(' ') : entry[1]
}
