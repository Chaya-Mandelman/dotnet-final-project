import { ArrowLeft, ArrowRight } from 'lucide-react'

// דפדוף מול השרת: מציג את מה שהשרת החזיר (totalCount, page, pageSize) ומבקש עמוד אחר
export function Pagination({ page, pageSize, totalCount, onPage, onPageSize, unit = 'פריטים' }: {
  page: number; pageSize: number; totalCount: number
  onPage: (page: number) => void
  onPageSize?: (size: number) => void
  unit?: string
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalCount)
  return <div className="pagination">
    <span className="pagination-info">מציגים {from}–{to} מתוך {totalCount} {unit}</span>
    <div className="pagination-controls">
      {onPageSize && <label className="page-size">
        <span>בעמוד</span>
        <select value={pageSize} onChange={e => onPageSize(Number(e.target.value))}>
          {[6, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>}
      <button disabled={page <= 1} onClick={() => onPage(page - 1)}><ArrowRight size={17}/> הקודם</button>
      <span className="page-number">עמוד {page} מתוך {totalPages}</span>
      <button disabled={page >= totalPages} onClick={() => onPage(page + 1)}>הבא <ArrowLeft size={17}/></button>
    </div>
  </div>
}
