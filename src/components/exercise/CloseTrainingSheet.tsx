'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { WorkoutDay } from '@/lib/types'

const POST_WORKOUT_OPTIONS = [
  { value: 'felt_good', label: '💪 Me sentí bien' },
  { value: 'felt_tired', label: '😮‍💨 Cansado/a' },
  { value: 'had_discomfort', label: '😬 Molestias' },
  { value: 'felt_pain', label: '🤕 Dolor' },
  { value: 'could_do_more', label: '⚡ Pude hacer más' },
  { value: 'too_intense', label: '🔥 Muy intenso' },
]

interface CloseTrainingSheetProps {
  day: WorkoutDay
  saving?: boolean
  onConfirm: (rpe: number, postWorkoutState: string) => Promise<void>
  onCancel: () => void
}

export function CloseTrainingSheet({ day, saving = false, onConfirm, onCancel }: CloseTrainingSheetProps) {
  const [rpe, setRpe] = useState(day.rpe ?? 5)
  const [state, setState] = useState(day.post_workout_state ?? '')

  const completedExercises = day.exercises.filter((e) => e.status === 'completed')
  const totalCalories = day.total_calories_burned
  const totalDuration = day.total_duration_min

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onCancel}>
      <div
        className="w-full max-w-lg bg-bg-elevated rounded-t-2xl border border-border p-5 space-y-5 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-border mx-auto" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-text">¿Cómo fue el entrenamiento?</h2>
            <p className="text-sm text-text-muted mt-0.5">Esto alimentará las recomendaciones futuras.</p>
          </div>
          <button type="button" onClick={onCancel} className="text-text-subtle hover:text-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary */}
        {(totalCalories != null || totalDuration != null) && (
          <div className="grid grid-cols-2 gap-3">
            {totalCalories != null && (
              <div className="rounded-xl border border-border bg-bg p-3 text-center">
                <p className="text-2xl font-bold text-text">{totalCalories}</p>
                <p className="text-xs text-text-muted">kcal quemadas</p>
              </div>
            )}
            {totalDuration != null && (
              <div className="rounded-xl border border-border bg-bg p-3 text-center">
                <p className="text-2xl font-bold text-text">{totalDuration}</p>
                <p className="text-xs text-text-muted">minutos</p>
              </div>
            )}
          </div>
        )}

        {completedExercises.length > 0 && (
          <p className="text-sm text-text-muted">
            {completedExercises.length} de {day.exercises.length} ejercicio{day.exercises.length !== 1 ? 's' : ''} completado{completedExercises.length !== 1 ? 's' : ''}
          </p>
        )}

        {/* RPE */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text">Esfuerzo percibido (RPE)</span>
            <span className="text-sm font-bold text-accent">{rpe} / 10</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={rpe}
            onChange={(e) => setRpe(parseInt(e.currentTarget.value, 10))}
            className="w-full accent-[var(--accent)]"
          />
          <div className="flex justify-between text-[10px] text-text-subtle">
            <span>Muy fácil</span>
            <span>Máximo esfuerzo</span>
          </div>
        </div>

        {/* Post-workout state */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-text">¿Cómo te sentiste?</span>
          <div className="flex flex-wrap gap-2">
            {POST_WORKOUT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setState(opt.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  state === opt.value
                    ? 'bg-accent text-accent-fg'
                    : 'bg-bg-muted text-text-muted hover:bg-border'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Confirm */}
        <button
          type="button"
          onClick={() => onConfirm(rpe, state)}
          disabled={saving || !state}
          className="w-full py-3 rounded-xl bg-accent text-accent-fg font-semibold hover:bg-[var(--accent-hover)] disabled:opacity-60 transition-colors"
        >
          {saving ? 'Cerrando...' : 'Confirmar y cerrar ciclo'}
        </button>
      </div>
    </div>
  )
}
