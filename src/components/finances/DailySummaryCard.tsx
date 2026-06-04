import { CreditCard, HandCoins, Scale, TrendingDown, TrendingUp } from 'lucide-react'
import { FinanceSummary } from '@/lib/types'
import { formatFinanceAmount } from '@/lib/finance'

interface Props {
  summary: FinanceSummary | null
  showDecimals: boolean
}

export function DailySummaryCard({ summary, showDecimals }: Props) {
  const income = summary?.total_income ?? 0
  const expense = summary?.total_expense ?? 0
  const balance = summary?.balance ?? 0
  const creditPending = summary?.credit_pending ?? 0
  const loansPending = summary?.loans_pending ?? 0

  return (
    <div className="grid grid-cols-2 gap-3 mb-5 sm:grid-cols-6">
      <div className="rounded-xl p-3 bg-[var(--success-soft,#d1fae5)] flex flex-col gap-1 sm:col-span-2">
        <div className="flex items-center gap-1.5 text-[var(--success,#10b981)]">
          <TrendingUp className="w-4 h-4" />
          <span className="text-xs font-medium">Ingresos</span>
        </div>
        <span className="text-base font-bold text-text truncate">{formatFinanceAmount(income, showDecimals)}</span>
      </div>

      <div className="rounded-xl p-3 bg-[var(--danger-soft,#fee2e2)] flex flex-col gap-1 sm:col-span-2">
        <div className="flex items-center gap-1.5 text-[var(--danger,#ef4444)]">
          <TrendingDown className="w-4 h-4" />
          <span className="text-xs font-medium">Gastos</span>
        </div>
        <span className="text-base font-bold text-text truncate">{formatFinanceAmount(expense, showDecimals)}</span>
      </div>

      <div className={`rounded-xl p-3 flex flex-col gap-1 sm:col-span-2 ${balance >= 0 ? 'bg-accent-soft' : 'bg-[var(--warning-soft,#fef9c3)]'}`}>
        <div className={`flex items-center gap-1.5 ${balance >= 0 ? 'text-accent' : 'text-[var(--warning,#ca8a04)]'}`}>
          <Scale className="w-4 h-4" />
          <span className="text-xs font-medium">Saldo</span>
        </div>
        <span className="text-base font-bold text-text truncate">{formatFinanceAmount(balance, showDecimals)}</span>
      </div>

      <div className="rounded-xl p-3 bg-bg-muted flex flex-col gap-1 sm:col-span-3">
        <div className="flex items-center gap-1.5 text-text-muted">
          <CreditCard className="w-4 h-4" />
          <span className="text-xs font-medium">Crédito</span>
        </div>
        <span className="text-base font-bold text-text truncate">{formatFinanceAmount(creditPending, showDecimals)}</span>
      </div>

      <div className="rounded-xl p-3 bg-bg-muted flex flex-col gap-1 sm:col-span-3">
        <div className="flex items-center gap-1.5 text-text-muted">
          <HandCoins className="w-4 h-4" />
          <span className="text-xs font-medium">Prestado</span>
        </div>
        <span className="text-base font-bold text-text truncate">{formatFinanceAmount(loansPending, showDecimals)}</span>
      </div>
    </div>
  )
}
