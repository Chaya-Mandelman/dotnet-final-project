import { useSearchParams } from 'react-router-dom'

// מצב הדפדוף והסינון נשמר ב-URL: אפשר לרענן, לחזור אחורה או לשתף קישור לאותו עמוד
export function useQueryState(defaults: Record<string, string>) {
  const [params, setParams] = useSearchParams()
  const get = (key: string) => params.get(key) ?? defaults[key] ?? ''
  const set = (changes: Record<string, string | number>, resetPage = true) => {
    const next = new URLSearchParams(params)
    Object.entries(changes).forEach(([k, v]) => {
      const value = String(v)
      if (value === '' || value === defaults[k]) next.delete(k); else next.set(k, value)
    })
    if (resetPage && !('page' in changes)) next.delete('page')
    setParams(next, { replace: true })
  }
  const page = Math.max(1, Number(get('page')) || 1)
  const pageSize = Math.min(50, Math.max(1, Number(get('pageSize')) || Number(defaults.pageSize) || 10))
  return { get, set, page, pageSize }
}
