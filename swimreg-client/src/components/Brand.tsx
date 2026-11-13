import { Waves } from 'lucide-react'
export function Brand({ light = false }: { light?: boolean }) {
  return <div className={`brand ${light ? 'brand-light' : ''}`}><span className="brand-symbol"><Waves size={24} strokeWidth={2.6}/></span><span className="brand-word">swim<span>reg</span><small>לומדים לשחות. גדלים בביטחון.</small></span></div>
}
