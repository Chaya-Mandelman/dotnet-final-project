import type { ReactNode } from 'react'

export function PageHeader({ eyebrow, title, subtitle, actions }: { eyebrow: string; title: string; subtitle?: string; actions?: ReactNode }) {
  return <div className="page-header">
    <div>
      <div className="eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
    {actions && <div className="page-header-actions">{actions}</div>}
  </div>
}

export function Loading({ text = 'טוענים...' }: { text?: string }) {
  return <div className="loading-row" aria-busy="true"><span className="loading-spinner"/>{text}</div>
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon">{icon}</div><h3>{title}</h3><p>{text}</p>{action}</div>
}
