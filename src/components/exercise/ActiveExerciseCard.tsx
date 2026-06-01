'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle, SkipForward, X } from 'lucide-react'
import { ExerciseSet, WorkoutExercise } from '@/lib/types'
import { RestTimerBar } from './RestTimerBar'

interface ActiveExerciseCardProps {
  exercise: WorkoutExercise
  onSetComplete: (setData: ExerciseSet) => void
  onComplete: (timerSeconds: number) => void
  onSkip: () => void
}

export function ActiveExerciseCard({ exercise, onSetComplete, onComplete, onSkip }: ActiveExerciseCardProps) {
  const totalSets = exercise.sets ?? 1
  const completedSets = exercise.sets_data?.filter((s) => s.completed).length ?? 0
  const currentSetIndex = completedSets
  const isLastSet = currentSetIndex >= totalSets

  const [reps, setReps] = useState(exercise.reps ?? 0)
  const [weight, setWeight] = useState(exercise.weight_kg ?? 0)
  const [elapsed, setElapsed] = useState(0)
  const [showRest, setShowRest] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(Date.now())

  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (!showRest) setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [showRest])

  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60
  const timerLabel = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  const handleCompleteSet = () => {
    const setData: ExerciseSet = {
      set_number: currentSetIndex + 1,
      reps_done: exercise.exercise_type === 'strength' ? reps : null,
      weight_kg: exercise.exercise_type === 'strength' ? weight : null,
      completed: true,
    }
    onSetComplete(setData)
    if (currentSetIndex + 1 >= totalSets) {
      // Last set done
      clearInterval(timerRef.current!)
      onComplete(elapsed)
    } else {
      setShowRest(true)
    }
  }

  const handleRestComplete = () => {
    setShowRest(false)
  }

  const restSeconds = exercise.rest_seconds_recommended ?? 90

  return (
    <div className="rounded-2xl border-2 border-accent bg-bg-elevated p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-accent uppercase tracking-wide">En ejecución</p>
          <h2 className="text-lg font-bold text-text">{exercise.name}</h2>
          {exercise.muscle_group && (
            <p className="text-xs text-text-muted">{exercise.muscle_group}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onSkip}
          className="touch-target text-text-subtle hover:text-[var(--danger)] transition-colors"
          aria-label="Saltar ejercicio"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Timer + series */}
      <div className="flex items-center justify-between">
        <div className="text-3xl font-bold tabular-nums text-text">{timerLabel}</div>
        {totalSets > 1 && !isLastSet && (
          <div className="text-right">
            <p className="text-sm font-semibold text-text">Serie {currentSetIndex + 1} / {totalSets}</p>
          </div>
        )}
      </div>

      {/* Rest timer */}
      {showRest && (
        <RestTimerBar
          seconds={restSeconds}
          onComplete={handleRestComplete}
          onSkip={handleRestComplete}
        />
      )}

      {/* Set inputs (strength only) */}
      {!showRest && exercise.exercise_type === 'strength' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Repeticiones</label>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setReps((v) => Math.max(0, v - 1))} className="w-8 h-8 rounded-lg bg-bg-muted text-text font-bold hover:bg-border transition-colors">−</button>
              <span className="w-10 text-center font-bold text-text tabular-nums">{reps}</span>
              <button type="button" onClick={() => setReps((v) => v + 1)} className="w-8 h-8 rounded-lg bg-bg-muted text-text font-bold hover:bg-border transition-colors">+</button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Peso (kg)</label>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setWeight((v) => Math.max(0, parseFloat((v - 2.5).toFixed(1))))} className="w-8 h-8 rounded-lg bg-bg-muted text-text font-bold hover:bg-border transition-colors">−</button>
              <span className="w-12 text-center font-bold text-text tabular-nums">{weight}</span>
              <button type="button" onClick={() => setWeight((v) => parseFloat((v + 2.5).toFixed(1)))} className="w-8 h-8 rounded-lg bg-bg-muted text-text font-bold hover:bg-border transition-colors">+</button>
            </div>
          </div>
        </div>
      )}

      {/* Action button */}
      {!showRest && (
        <button
          type="button"
          onClick={handleCompleteSet}
          className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-accent-fg font-semibold hover:bg-[var(--accent-hover)] transition-colors"
        >
          <CheckCircle className="w-5 h-5" />
          {isLastSet ? 'Completar ejercicio' : `Completar serie ${currentSetIndex + 1}`}
        </button>
      )}

      {/* Skip exercise */}
      {!showRest && (
        <button
          type="button"
          onClick={onSkip}
          className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-xl bg-bg-muted text-text-muted text-sm hover:bg-border transition-colors"
        >
          <SkipForward className="w-4 h-4" />
          Saltar ejercicio
        </button>
      )}
    </div>
  )
}
