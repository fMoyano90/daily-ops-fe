'use client'

import { FormEvent, useState } from 'react'
import { Save, Dumbbell } from 'lucide-react'
import { ExerciseProfile, ExerciseProfileInput } from '@/lib/types'

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const LOCATION_OPTIONS = [
  { value: 'home', label: 'Casa' },
  { value: 'gym', label: 'Gimnasio' },
  { value: 'outdoor', label: 'Exterior' },
  { value: 'mixed', label: 'Mixto' },
]

const FITNESS_LEVELS = [
  { value: 'beginner', label: 'Principiante' },
  { value: 'intermediate', label: 'Intermedio' },
  { value: 'advanced', label: 'Avanzado' },
]

const EQUIPMENT_OPTIONS = [
  { value: 'none', label: 'Sin equipo' },
  { value: 'resistance_bands', label: 'Bandas elásticas' },
  { value: 'dumbbells', label: 'Mancuernas' },
  { value: 'barbell', label: 'Barra' },
  { value: 'bench', label: 'Banco' },
  { value: 'bike', label: 'Bicicleta' },
  { value: 'treadmill', label: 'Caminadora' },
  { value: 'elliptical', label: 'Elíptica' },
  { value: 'gym_machines', label: 'Máquinas de gimnasio' },
  { value: 'kettlebells', label: 'Kettlebells' },
]

const DURATION_OPTIONS = [15, 30, 45, 60, 90]

interface ExerciseProfileFormProps {
  profile: ExerciseProfile | null
  saving?: boolean
  onSubmit: (data: ExerciseProfileInput) => Promise<void>
}

export function ExerciseProfileForm({ profile, saving = false, onSubmit }: ExerciseProfileFormProps) {
  const [availableDays, setAvailableDays] = useState<number[]>(profile?.available_days ?? [0, 1, 2, 3, 4])
  const [location, setLocation] = useState(profile?.location ?? 'home')
  const [equipment, setEquipment] = useState<string[]>(profile?.equipment ?? ['none'])
  const [sessionDuration, setSessionDuration] = useState(profile?.session_duration_min ?? 45)
  const [fitnessLevel, setFitnessLevel] = useState(profile?.fitness_level ?? 'beginner')
  const [restrictions, setRestrictions] = useState(profile?.physical_restrictions ?? '')

  const toggleDay = (day: number) => {
    setAvailableDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
  }

  const toggleEquipment = (item: string) => {
    setEquipment((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]
    )
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onSubmit({
      available_days: availableDays,
      location,
      equipment,
      session_duration_min: sessionDuration,
      fitness_level: fitnessLevel,
      physical_restrictions: restrictions.trim() || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center flex-shrink-0">
          <Dumbbell className="w-5 h-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-base font-semibold text-text">Configuración de entrenamiento</h3>
          <p className="text-sm text-text-muted mt-0.5">La IA usará esto para generar rutinas personalizadas.</p>
        </div>
      </div>

      {/* Available days */}
      <div>
        <span className="block text-sm font-medium text-text mb-2">Días disponibles</span>
        <div className="flex gap-1.5 flex-wrap">
          {DAY_LABELS.map((label, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => toggleDay(idx)}
              className={`w-10 h-10 rounded-lg text-xs font-medium transition-colors ${
                availableDays.includes(idx)
                  ? 'bg-accent text-accent-fg'
                  : 'bg-bg-muted text-text-muted hover:bg-border'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Session duration */}
      <div>
        <span className="block text-sm font-medium text-text mb-2">
          Tiempo por sesión: <strong>{sessionDuration} min</strong>
        </span>
        <div className="flex gap-2 flex-wrap">
          {DURATION_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setSessionDuration(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                sessionDuration === d
                  ? 'bg-accent text-accent-fg'
                  : 'bg-bg-muted text-text-muted hover:bg-border'
              }`}
            >
              {d} min
            </button>
          ))}
        </div>
      </div>

      {/* Location & Level */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="ex-location" className="block text-sm font-medium text-text mb-1">Lugar</label>
          <select
            id="ex-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg-elevated text-text focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {LOCATION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="ex-level" className="block text-sm font-medium text-text mb-1">Nivel</label>
          <select
            id="ex-level"
            value={fitnessLevel}
            onChange={(e) => setFitnessLevel(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg-elevated text-text focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {FITNESS_LEVELS.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Equipment */}
      <div>
        <span className="block text-sm font-medium text-text mb-2">Equipamiento disponible</span>
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleEquipment(opt.value)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                equipment.includes(opt.value)
                  ? 'bg-accent text-accent-fg'
                  : 'bg-bg-muted text-text-muted hover:bg-border'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Restrictions */}
      <div>
        <label htmlFor="ex-restrictions" className="block text-sm font-medium text-text mb-1">
          Restricciones físicas o lesiones <span className="text-text-subtle">(opcional)</span>
        </label>
        <textarea
          id="ex-restrictions"
          value={restrictions}
          onChange={(e) => setRestrictions(e.target.value)}
          rows={2}
          maxLength={2000}
          className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg-elevated text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent resize-y"
          placeholder="Ej: Dolor rodilla derecha, no trotar"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-accent-fg text-sm font-semibold rounded-lg hover:bg-[var(--accent-hover)] disabled:opacity-60 transition-colors"
      >
        {saving ? (
          <span className="w-4 h-4 border-2 border-accent-fg/40 border-t-accent-fg rounded-full animate-spin" />
        ) : (
          <Save className="w-4 h-4" aria-hidden="true" />
        )}
        {saving ? 'Guardando...' : profile ? 'Actualizar perfil' : 'Guardar perfil'}
      </button>
    </form>
  )
}
