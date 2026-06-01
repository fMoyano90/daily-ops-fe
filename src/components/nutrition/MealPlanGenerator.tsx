'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Sparkles, X, ChevronDown, ChevronUp, ShoppingBasket } from 'lucide-react'
import { api } from '@/lib/api'
import { MealPlan, NutritionDay } from '@/lib/types'
import { cn } from '@/lib/utils'

type ContextType = 'budget' | 'products' | 'general'

const contextOptions: Array<{ value: ContextType; label: string; placeholder: string }> = [
  { value: 'budget', label: 'Presupuesto', placeholder: 'Ej: tengo $5.000 para el día' },
  { value: 'products', label: 'Mi despensa', placeholder: 'Nota adicional (opcional): prefiero sin gluten...' },
  { value: 'general', label: 'Solicitud libre', placeholder: 'Ej: quiero algo rápido y alto en proteínas' },
]

interface MealPlanGeneratorProps {
  date: string
  existingPlan?: MealPlan | null
  onGenerated: (day: NutritionDay) => void
}

export function MealPlanGenerator({ date, existingPlan, onGenerated }: MealPlanGeneratorProps) {
  const [open, setOpen] = useState(false)
  const [contextType, setContextType] = useState<ContextType>('general')
  const [contextText, setContextText] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [planExpanded, setPlanExpanded] = useState(true)
  const [pantryCount, setPantryCount] = useState<number | null>(null)

  useEffect(() => {
    if (contextType === 'products' && open) {
      api.nutrition.getPantry()
        .then((items) => setPantryCount(items.filter((i) => i.is_available).length))
        .catch(() => setPantryCount(0))
    }
  }, [contextType, open])

  const handleGenerate = async (event: FormEvent) => {
    event.preventDefault()
    setGenerating(true)
    setError(null)
    const effectiveText = contextText.trim() || 'Plan equilibrado según mi perfil y objetivos'
    try {
      const updated = await api.nutrition.generateMealPlan(date, {
        context_type: contextType,
        context_text: effectiveText,
      })
      onGenerated(updated)
      setOpen(false)
      setContextText('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar el plan')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-3">
      {existingPlan && (
        <div className="rounded-xl border border-accent/40 bg-accent-soft/30 overflow-hidden">
          <button
            type="button"
            onClick={() => setPlanExpanded((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-accent"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              Plan sugerido por IA
            </span>
            {planExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {planExpanded && (
            <div className="px-4 pb-4 space-y-3">
              {existingPlan.plan_summary && (
                <p className="text-sm text-text-muted italic">{existingPlan.plan_summary}</p>
              )}
              <div className="space-y-2">
                {existingPlan.meals.map((meal, i) => (
                  <div key={i} className="rounded-lg border border-border bg-bg p-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-text">{meal.meal_type}</span>
                      <span className="text-xs text-text-muted">{meal.time_suggestion}</span>
                    </div>
                    <p className="text-sm text-text-muted">{meal.description}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-text-subtle pt-1">
                      <span className="rounded-full bg-bg-muted px-2 py-0.5">{meal.estimated_calories} kcal</span>
                      <span className="rounded-full bg-bg-muted px-2 py-0.5">P: {meal.estimated_protein_g}g</span>
                      <span className="rounded-full bg-bg-muted px-2 py-0.5">C: {meal.estimated_carbs_g}g</span>
                      <span className="rounded-full bg-bg-muted px-2 py-0.5">G: {meal.estimated_fat_g}g</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {open ? (
        <div className="rounded-xl border border-border bg-bg-elevated p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" aria-hidden="true" />
              Generar plan con IA
            </h3>
            <button
              type="button"
              onClick={() => { setOpen(false); setError(null) }}
              className="rounded-lg p-1 text-text-muted hover:text-text hover:bg-bg-muted transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2">
            {contextOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => { setContextType(option.value); setContextText('') }}
                className={cn(
                  'flex-1 py-2 px-2 rounded-lg text-xs font-medium border transition-colors',
                  contextType === option.value
                    ? 'bg-accent text-accent-fg border-accent'
                    : 'bg-bg text-text-muted border-border hover:bg-bg-muted'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {contextType === 'products' && (
            <div className="rounded-lg border border-border bg-bg px-3 py-2.5 flex items-center gap-3">
              <ShoppingBasket className="w-4 h-4 text-accent flex-shrink-0" aria-hidden="true" />
              <p className="text-xs text-text-muted flex-1">
                {pantryCount === null
                  ? 'Cargando despensa...'
                  : pantryCount === 0
                  ? 'Tu despensa está vacía. Añade ingredientes en la sección Despensa.'
                  : <><span className="text-[var(--success)] font-semibold">{pantryCount} ingrediente{pantryCount !== 1 ? 's' : ''} disponible{pantryCount !== 1 ? 's' : ''}</span> en tu despensa serán usados automáticamente.</>
                }
              </p>
            </div>
          )}

          <form onSubmit={handleGenerate} className="space-y-3">
            <textarea
              value={contextText}
              onChange={(e) => setContextText(e.target.value)}
              placeholder={contextOptions.find((o) => o.value === contextType)?.placeholder ?? ''}
              rows={contextType === 'products' ? 2 : 3}
              maxLength={2000}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
            {error && <p role="alert" className="text-xs text-[var(--danger)]">{error}</p>}
            <button
              type="submit"
              disabled={generating}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-accent-fg text-sm font-semibold rounded-lg hover:bg-[var(--accent-hover)] disabled:opacity-60 transition-colors"
            >
              {generating
                ? <><span className="w-4 h-4 border-2 border-accent-fg/40 border-t-accent-fg rounded-full animate-spin" /> Generando plan...</>
                : <><Sparkles className="w-4 h-4" aria-hidden="true" /> Generar plan</>
              }
            </button>
          </form>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <span className="w-9 h-9 rounded-xl bg-accent-soft flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-accent" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-text">Planificador IA</p>
              <p className="text-xs text-text-muted mt-0.5">
                Genera un plan diario personalizado según tu perfil y condiciones de salud. Útil para comparar cómo comes hoy vs. lo que necesitarías para alcanzar tu objetivo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-accent/40 bg-accent-soft/20 text-accent text-sm font-semibold hover:bg-accent-soft/40 transition-colors"
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            {existingPlan ? 'Regenerar plan' : 'Generar plan'}
          </button>
        </div>
      )}
    </div>
  )
}
