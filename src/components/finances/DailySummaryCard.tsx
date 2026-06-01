import { TrendingUp, TrendingDown, Scale } from 'lucide-react'
import { FinanceSummary } from '@/lib/types'

interface Props {
  summary: FinanceSummary | null
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n)
}

export function DailySummaryCard({ summary }: Props) {
  const income = summary?.total_income ?? 0
  const expense = summary?.total_expense ?? 0
  const balance = summary?.balance ?? 0

  return (
    <div className="grid grid-cols-3 gap-3 mb-5">
      <div className="rounded-xl p-3 bg-[var(--success-soft,#d1fae5)] flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-[var(--success,#10b981)]">
          <TrendingUp className="w-4 h-4" />
          <span className="text-xs font-medium">Ingresos</span>
        </div>
        <span className="text-base font-bold text-text truncate">{fmt(income)}</span>
      </div>

      <div className="rounded-xl p-3 bg-[var(--danger-soft,#fee2e2)] flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-[var(--danger,#ef4444)]">
          <TrendingDown className="w-4 h-4" />
          <span className="text-xs font-medium">Gastos</span>
        </div>
        <span className="text-base font-bold text-text truncate">{fmt(expense)}</span>
      </div>

      <div className={`rounded-xl p-3 flex flex-col gap-1 ${balance >= 0 ? 'bg-accent-soft' : 'bg-[var(--warning-soft,#fef9c3)]'}`}>
        <div className={`flex items-center gap-1.5 ${balance >= 0 ? 'text-accent' : 'text-[var(--warning,#ca8a04)]'}`}>
          <Scale className="w-4 h-4" />
          <span className="text-xs font-medium">Saldo</span>
        </div>
        <span className="text-base font-bold text-text truncate">{fmt(balance)}</span>
      </div>
    </div>
  )
}
