'use client'

import { FormEvent, useState } from 'react'
import { Plus } from 'lucide-react'
import { ExerciseType, WorkoutExerciseCreate } from '@/lib/types'

const EXERCISE_TYPES: Array<{ value: ExerciseType; label: string }> = [
  { value: 'strength', label: 'Fuerza' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'mobility', label: 'Movilidad' },
  { value: 'recovery', label: 'Recuperación' },
]

interface WorkoutExerciseFormProps {
  saving?: boolean
  onSubmit: (data: WorkoutExerciseCreate) => Promise<void>
}

export function WorkoutExerciseForm({ saving = false, onSubmit }: WorkoutExerciseFormProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<ExerciseType>('strength')
  const [muscleGroup, setMuscleGroup] = useState('')
  const [sets, setSets] = useState('')
  const [reps, setReps] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [durationMin, setDurationMin] = useState('')
  const [showExtra, setShowExtra] = useState(false)

  const isCardioLike = type === 'cardio' || type === 'mobility' || type === 'recovery'

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    const data: WorkoutExerciseCreate = {
      name: trimmed,
      exercise_type: type,
      muscle_group: muscleGroup.trim() || null,
      sets: sets ? parseInt(sets, 10) : null,
      reps: reps ? parseInt(reps, 10) : null,
      weight_kg: weightKg ? parseFloat(weightKg) : null,
      duration_min: durationMin ? parseInt(durationMin, 10) : null,
    }
    await onSubmit(data)
    setName('')
    setMuscleGroup('')
    setSets('')
    setReps('')
    setWeightKg('')
    setDurationMin('')
    setShowExtra(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <label htmlFor="ex-name" className="block text-sm font-medium text-text mb-1">Ejercicio</label>
          <input
            id="ex-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            required
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg-elevated text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Ej: Sentadilla, Trote, Estiramiento"
          />
        </div>
        <div>
          <label htmlFor="ex-type" className="block text-sm font-medium text-text mb-1">Tipo</label>
          <select
            id="ex-type"
            value={type}
            onChange={(e) => setType(e.target.value as ExerciseType)}
            className="px-3 py-2 border border-border rounded-lg text-sm bg-bg-elevated text-text focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {EXERCISE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {showExtra && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="ex-muscle" className="block text-xs font-medium text-text mb-1">Grupo muscular</label>
            <input
              id="ex-muscle"
              type="text"
              value={muscleGroup}
              onChange={(e) => setMuscleGroup(e.target.value)}
              maxLength={80}
              className="w-full px-2 py-1.5 border border-border rounded-lg text-sm bg-bg-elevated text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Ej: Piernas, Espalda"
            />
          </div>
          <div>
            <label htmlFor="ex-duration" className="block text-xs font-medium text-text mb-1">Duración (min)</label>
            <input
              id="ex-duration"
              type="number"
              inputMode="numeric"
              min={1}
              max={600}
              value={durationMin}
              onChange={(e) => setDurationMin(e.target.value)}
              className="w-full px-2 py-1.5 border border-border rounded-lg text-sm bg-bg-elevated text-text focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          {!isCardioLike && (
            <>
              <div>
                <label htmlFor="ex-sets" className="block text-xs font-medium text-text mb-1">Series</label>
                <input
                  id="ex-sets"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={100}
                  value={sets}
                  onChange={(e) => setSets(e.target.value)}
                  className="w-full px-2 py-1.5 border border-border rounded-lg text-sm bg-bg-elevated text-text focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label htmlFor="ex-reps" className="block text-xs font-medium text-text mb-1">Reps</label>
                <input
                  id="ex-reps"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={1000}
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  className="w-full px-2 py-1.5 border border-border rounded-lg text-sm bg-bg-elevated text-text focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label htmlFor="ex-weight" className="block text-xs font-medium text-text mb-1">Peso (kg)</label>
                <input
                  id="ex-weight"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={1000}
                  step={0.5}
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full px-2 py-1.5 border border-border rounded-lg text-sm bg-bg-elevated text-text focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-bg-muted text-text text-sm font-semibold rounded-lg hover:bg-border disabled:opacity-60 transition-colors"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          {saving ? 'Añadiendo...' : 'Añadir'}
        </button>
        <button
          type="button"
          onClick={() => setShowExtra((v) => !v)}
          className="text-xs text-text-muted hover:text-text transition-colors"
        >
          {showExtra ? 'Menos opciones' : 'Más detalles'}
        </button>
      </div>
    </form>
  )
}
