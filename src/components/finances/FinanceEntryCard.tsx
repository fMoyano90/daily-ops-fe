import { Pencil, Trash2 } from 'lucide-react'
import { FinanceEntry } from '@/lib/types'

interface Props {
  entry: FinanceEntry
  onEdit: (entry: FinanceEntry) => void
  onDelete: (id: string) => void
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n)
}

export function FinanceEntryCard({ entry, onEdit, onDelete }: Props) {
  const isIncome = entry.type === 'income'

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-muted border border-border">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isIncome ? 'bg-[var(--success,#10b981)]' : 'bg-[var(--danger,#ef4444)]'}`} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text truncate">{entry.category}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${isIncome ? 'bg-[var(--success-soft,#d1fae5)] text-[var(--success,#10b981)]' : 'bg-[var(--danger-soft,#fee2e2)] text-[var(--danger,#ef4444)]'}`}>
            {isIncome ? 'Ingreso' : 'Gasto'}
          </span>
        </div>
        {entry.description && (
          <p className="text-xs text-text-muted mt-0.5 truncate">{entry.description}</p>
        )}
      </div>

      <span className={`text-sm font-bold flex-shrink-0 ${isIncome ? 'text-[var(--success,#10b981)]' : 'text-[var(--danger,#ef4444)]'}`}>
        {isIncome ? '+' : '-'}{fmt(entry.amount)}
      </span>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onEdit(entry)}
          className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent-soft transition-colors"
          title="Editar"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(entry.id)}
          className="p-1.5 rounded-lg text-text-muted hover:text-[var(--danger,#ef4444)] hover:bg-[var(--danger-soft,#fee2e2)] transition-colors"
          title="Eliminar"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
