'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, ExternalLink, Play, Trash2 } from 'lucide-react'
import { WorkoutExercise } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ExerciseSetDots } from './ExerciseSetDots'

const TYPE_LABELS: Record<string, string> = {
  strength: 'Fuerza',
  cardio: 'Cardio',
  mobility: 'Movilidad',
  recovery: 'Recuperación',
}

const STATUS_CLASSES: Record<string, string> = {
  completed: 'bg-success-soft text-[var(--success)]',
  partial: 'bg-warning-soft text-[var(--warning)]',
  skipped: 'bg-bg text-text-subtle line-through',
  pending: '',
}

interface WorkoutExerciseCardProps {
  exercise: WorkoutExercise
  isActive?: boolean
  onStart: (exercise: WorkoutExercise) => void
  onDelete: (exercise: WorkoutExercise) => Promise<void>
}

export function WorkoutExerciseCard({ exercise, isActive = false, onStart, onDelete }: WorkoutExerciseCardProps) {
  const [showDescription, setShowDescription] = useState(false)

  const isDone = exercise.status === 'completed' || exercise.status === 'skipped'
  const hasStrengthData = exercise.sets || exercise.reps || exercise.weight_kg
  const hasCardioData = exercise.duration_min || exercise.distance_km
  const description = exercise.ai_notes
  const restLabel = exercise.rest_seconds_recommended
    ? exercise.rest_seconds_recommended >= 60
      ? `${Math.floor(exercise.rest_seconds_recommended / 60)} min descanso entre series`
      : `${exercise.rest_seconds_recommended} seg descanso entre series`
    : null

  const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.name + ' ejercicio tutorial cómo hacer')}`

  const completedSets = exercise.sets_data?.filter((s) => s.completed).length ?? 0

  return (
    <li className={cn(
      'rounded-xl border bg-bg transition-all',
      isActive ? 'border-accent/50 opacity-60' : 'border-border',
      exercise.status === 'skipped' && 'opacity-50',
    )}>
      <div className="p-3">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className={cn('font-semibold text-text', isDone && exercise.status === 'skipped' && 'line-through text-text-muted')}>
                {exercise.name}
              </h3>
              {exercise.ai_suggested && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent-soft text-accent">IA</span>
              )}
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-bg-muted text-text-muted">
                {TYPE_LABELS[exercise.exercise_type] ?? exercise.exercise_type}
              </span>
              {exercise.muscle_group && (
                <span className="text-xs text-text-subtle">{exercise.muscle_group}</span>
              )}
              {exercise.status !== 'pending' && (
                <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', STATUS_CLASSES[exercise.status])}>
                  {exercise.status === 'completed' ? 'Completado' : exercise.status === 'partial' ? 'Parcial' : 'Omitido'}
                </span>
              )}
            </div>

            {/* Metrics */}
            <div className="mt-1 flex flex-wrap gap-2 text-xs text-text-muted">
              {hasStrengthData && (
                <span>
                  {[
                    exercise.sets ? `${exercise.sets} series` : null,
                    exercise.reps ? `× ${exercise.reps} reps` : null,
                    exercise.weight_kg ? `· ${exercise.weight_kg} kg` : null,
                  ].filter(Boolean).join(' ')}
                </span>
              )}
              {hasCardioData && (
                <span>
                  {[
                    exercise.duration_min ? `${exercise.duration_min} min` : null,
                    exercise.distance_km ? `${exercise.distance_km} km` : null,
                  ].filter(Boolean).join(' · ')}
                </span>
              )}
              {exercise.intensity && <span>Intensidad: {exercise.intensity}</span>}
            </div>

            {/* Rest recommendation */}
            {restLabel && (
              <p className="mt-1 text-xs text-text-subtle">⏱ {restLabel}</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => onDelete(exercise)}
            className="touch-target -m-1 text-text-subtle hover:text-[var(--danger)] transition-colors flex-shrink-0"
            aria-label={`Eliminar ${exercise.name}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Set dots (strength exercises with sets) */}
        {exercise.exercise_type === 'strength' && exercise.sets && exercise.sets > 1 && (
          <div className="mt-2 flex items-center justify-between">
            <ExerciseSetDots
              totalSets={exercise.sets}
              setsData={exercise.sets_data}
            />
            {completedSets > 0 && !isDone && (
              <span className="text-xs text-text-muted">{completedSets}/{exercise.sets} series</span>
            )}
          </div>
        )}

        {/* Description (collapsible) */}
        {description && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setShowDescription((v) => !v)}
              className="flex items-center gap-1 text-xs text-text-subtle hover:text-text transition-colors"
            >
              {showDescription ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showDescription ? 'Ocultar descripción' : 'Ver descripción'}
            </button>
            {showDescription && (
              <p className="mt-1.5 text-xs text-text-muted leading-relaxed">{description}</p>
            )}
          </div>
        )}
      </div>

      {/* Action row */}
      {!isDone && !isActive && (
        <div className="flex items-center gap-2 px-3 pb-3 pt-1 border-t border-border/50">
          <button
            type="button"
            onClick={() => onStart(exercise)}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-lg bg-accent text-accent-fg text-sm font-semibold hover:bg-[var(--accent-hover)] transition-colors"
          >
            <Play className="w-4 h-4 fill-current" />
            Iniciar
          </button>
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-bg-muted text-text-muted text-sm hover:bg-border transition-colors"
            title="Ver referencia en YouTube"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}

      {/* Completed - show YouTube only */}
      {isDone && exercise.status === 'completed' && (
        <div className="px-3 pb-3 pt-1 border-t border-border/50">
          <p className="text-xs text-[var(--success)]">
            ✓ {exercise.timer_seconds ? `Completado en ${Math.floor(exercise.timer_seconds / 60)}:${String(exercise.timer_seconds % 60).padStart(2, '0')}` : 'Completado'}
            {exercise.calories_burned ? ` · ${exercise.calories_burned} kcal` : ''}
          </p>
        </div>
      )}
    </li>
  )
}
