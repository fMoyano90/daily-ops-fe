'use client'

import { Flame, Sparkles } from 'lucide-react'
import { NutritionDay } from '@/lib/types'
import { cn } from '@/lib/utils'

export function DaySummary({ day, analyzing = false, canAnalyze, onAnalyze }: { day: NutritionDay; analyzing?: boolean; canAnalyze: boolean; onAnalyze: () => Promise<void> }) {
  const balance = day.balance_calories
  const balanceLabel = balance == null ? 'Pendiente' : balance < 0 ? `${Math.abs(balance)} kcal déficit` : `${balance} kcal superávit`
  const totalMacros = (day.total_protein_g ?? 0) + (day.total_carbs_g ?? 0) + (day.total_fat_g ?? 0)

  return (
    <section aria-labelledby="nutrition-summary-title" className="bg-bg-elevated border border-border rounded-2xl p-4 md:p-5 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="nutrition-summary-title" className="text-base font-semibold text-text">Resumen del día</h2>
          <p className="text-sm text-text-muted mt-1">Estimaciones IA + fórmulas deterministas del perfil.</p>
        </div>
        <button type="button" onClick={onAnalyze} disabled={!canAnalyze || analyzing} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-accent text-accent-fg text-sm font-semibold rounded-lg hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors">
          {analyzing ? <span className="w-4 h-4 border-2 border-accent-fg/40 border-t-accent-fg rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" aria-hidden="true" />}
          {analyzing ? 'Analizando...' : 'Analizar mi día'}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Metric label="Recomendadas" value={formatKcal(day.recommended_calories)} />
        <Metric label="Consumidas" value={formatKcal(day.consumed_calories)} />
        <Metric label="Quemadas" value={formatKcal(day.burned_calories)} />
        <Metric label="Balance" value={balanceLabel} tone={balance != null && balance <= 0 ? 'text-[var(--success)]' : 'text-[var(--warning)]'} />
      </div>

      <div className="space-y-3">
        <MacroBar label="Proteínas" value={day.total_protein_g} total={totalMacros} className="bg-[var(--success)]" />
        <MacroBar label="Carbohidratos" value={day.total_carbs_g} total={totalMacros} className="bg-accent" />
        <MacroBar label="Azúcares" value={day.total_sugar_g} total={day.total_carbs_g ?? 0} className="bg-[var(--warning)]" />
        <MacroBar label="Grasas" value={day.total_fat_g} total={totalMacros} className="bg-[var(--info)]" />
      </div>

      {day.ai_summary ? (
        <div className="rounded-xl border border-accent/20 bg-accent-soft/40 p-3 text-sm text-text-muted">
          <div className="flex items-center gap-2 font-semibold text-accent mb-1"><Sparkles className="w-4 h-4" aria-hidden="true" /> Análisis IA</div>
          <p>{day.ai_summary}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-bg p-3 text-sm text-text-muted">
          <Flame className="w-4 h-4 inline mr-1" aria-hidden="true" /> Añade comidas o ejercicios y analiza el día para ver kcal y macros.
        </div>
      )}
    </section>
  )
}

function formatKcal(value?: number | null) {
  return value == null ? '--' : `${value} kcal`
}

function Metric({ label, value, tone = 'text-text' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-border bg-bg p-3">
      <p className="text-xs text-text-subtle">{label}</p>
      <p className={cn('text-lg font-bold mt-1', tone)}>{value}</p>
    </div>
  )
}

function MacroBar({ label, value, total, className }: { label: string; value?: number | null; total: number; className: string }) {
  const safeValue = value ?? 0
  const percent = total > 0 ? Math.min((safeValue / total) * 100, 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-text-muted">{label}</span>
        <span className="font-mono text-text">{safeValue.toFixed(1)}g</span>
      </div>
      <div className="h-2 rounded-full bg-bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full', className)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
