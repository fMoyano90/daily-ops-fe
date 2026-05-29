'use client'

import { Trash2, UtensilsCrossed } from 'lucide-react'
import { MealEntry } from '@/lib/types'

export function MealList({ meals, onDelete }: { meals: MealEntry[]; onDelete: (meal: MealEntry) => void }) {
  if (meals.length === 0) {
    return <p className="rounded-xl border border-dashed border-border bg-bg p-4 text-sm text-text-muted">Aún no registras comidas para este día.</p>
  }

  return (
    <ul className="space-y-3">
      {meals.map((meal) => (
        <li key={meal.id} className="rounded-xl border border-border bg-bg p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-accent" aria-hidden="true" />
                <h3 className="font-semibold text-text">{meal.label}</h3>
                {meal.calories != null && <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-accent-soft text-accent">{meal.calories} kcal</span>}
              </div>
              <p className="mt-1 text-sm text-text-muted whitespace-pre-wrap">{meal.description}</p>
            </div>
            <button type="button" onClick={() => onDelete(meal)} className="touch-target -m-2 text-text-subtle hover:text-[var(--danger)] transition-colors" aria-label={`Eliminar ${meal.label}`}>
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
          {meal.calories != null && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3 text-xs text-text-muted">
              <Macro label="Prote" value={meal.protein_g} />
              <Macro label="Carbs" value={meal.carbs_g} />
              <Macro label="Azúcar" value={meal.sugar_g} />
              <Macro label="Grasa" value={meal.fat_g} />
              <Macro label="Fibra" value={meal.fiber_g} />
            </div>
          )}
          {meal.ai_notes && <p className="mt-2 text-xs text-text-subtle">{meal.ai_notes}</p>}
        </li>
      ))}
    </ul>
  )
}

function Macro({ label, value }: { label: string; value?: number | null }) {
  return <span><strong className="font-mono text-text">{value != null ? `${value}g` : '--'}</strong> {label}</span>
}
