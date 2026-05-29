'use client'

import { Activity, Trash2 } from 'lucide-react'
import { ExerciseEntry } from '@/lib/types'

export function ExerciseList({ exercises, onDelete }: { exercises: ExerciseEntry[]; onDelete: (exercise: ExerciseEntry) => void }) {
  if (exercises.length === 0) {
    return <p className="rounded-xl border border-dashed border-border bg-bg p-4 text-sm text-text-muted">Aún no registras ejercicios para este día.</p>
  }

  return (
    <ul className="space-y-3">
      {exercises.map((exercise) => (
        <li key={exercise.id} className="rounded-xl border border-border bg-bg p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Activity className="w-4 h-4 text-[var(--success)]" aria-hidden="true" />
                <h3 className="font-semibold text-text">{exercise.label}</h3>
                {exercise.calories_burned != null && <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-success-soft text-[var(--success)]">-{exercise.calories_burned} kcal</span>}
              </div>
              <p className="mt-1 text-sm text-text-muted whitespace-pre-wrap">{exercise.description}</p>
            </div>
            <button type="button" onClick={() => onDelete(exercise)} className="touch-target -m-2 text-text-subtle hover:text-[var(--danger)] transition-colors" aria-label={`Eliminar ${exercise.label}`}>
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
          {(exercise.duration_min != null || exercise.intensity) && (
            <p className="mt-2 text-xs text-text-subtle">
              {exercise.duration_min != null ? `${exercise.duration_min} min` : 'Duración no detectada'} · Intensidad {exercise.intensity ?? 'desconocida'}
            </p>
          )}
          {exercise.ai_notes && <p className="mt-2 text-xs text-text-subtle">{exercise.ai_notes}</p>}
        </li>
      ))}
    </ul>
  )
}
