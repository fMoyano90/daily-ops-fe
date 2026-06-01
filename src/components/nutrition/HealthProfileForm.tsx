'use client'

import { FormEvent, useState } from 'react'
import { Save, User } from 'lucide-react'
import { ActivityLevel, HealthProfile, HealthProfileInput, NutritionGoal, Sex } from '@/lib/types'

interface HealthProfileFormProps {
  profile: HealthProfile | null
  saving?: boolean
  onSubmit: (data: HealthProfileInput) => Promise<void>
}

const activityOptions: Array<{ value: ActivityLevel; label: string }> = [
  { value: 'sedentary', label: 'Sedentario' },
  { value: 'light', label: 'Ligero' },
  { value: 'moderate', label: 'Moderado' },
  { value: 'active', label: 'Activo' },
  { value: 'very_active', label: 'Muy activo' },
]

const goalOptions: Array<{ value: NutritionGoal; label: string }> = [
  { value: 'lose', label: 'Bajar' },
  { value: 'maintain', label: 'Mantener' },
  { value: 'gain', label: 'Subir' },
]

function ageToBirthDate(age: number) {
  const today = new Date()
  const date = new Date(today.getFullYear() - age, today.getMonth(), today.getDate())
  return date.toISOString().slice(0, 10)
}

export function HealthProfileForm({ profile, saving = false, onSubmit }: HealthProfileFormProps) {
  const [sex, setSex] = useState<Sex>(profile?.sex ?? 'male')
  const [age, setAge] = useState(profile?.age ?? 35)
  const [heightCm, setHeightCm] = useState(profile?.height_cm ?? 178)
  const [weightKg, setWeightKg] = useState(profile?.weight_kg ?? 80)
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(profile?.activity_level ?? 'moderate')
  const [goal, setGoal] = useState<NutritionGoal>(profile?.goal ?? 'lose')
  const [targetOverride, setTargetOverride] = useState(profile?.target_calories_override?.toString() ?? '')
  const [glassMl, setGlassMl] = useState(profile?.glass_ml ?? 200)
  const [country, setCountry] = useState(profile?.country ?? '')
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const targetCaloriesOverride = parseOptionalNumber(targetOverride)
    if (targetOverride.trim() && targetCaloriesOverride == null) {
      setFormError('Ingresa un objetivo calórico válido o deja el campo vacío.')
      return
    }
    setFormError(null)
    await onSubmit({
      sex,
      birth_date: ageToBirthDate(age),
      height_cm: heightCm,
      weight_kg: weightKg,
      activity_level: activityLevel,
      goal,
      target_calories_override: targetCaloriesOverride,
      glass_ml: glassMl,
      country: country.trim() || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-base font-semibold text-text">Perfil de salud</h3>
          <p className="text-sm text-text-muted mt-1">Necesario para calcular BMR, TDEE y objetivo diario.</p>
        </div>
      </div>

      <fieldset className="grid grid-cols-2 gap-2">
        <legend className="text-sm font-medium text-text mb-2">Sexo</legend>
        {(['male', 'female'] as Sex[]).map((value) => (
          <label key={value} className="flex items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text">
            <input type="radio" name="sex" value={value} checked={sex === value} onChange={() => setSex(value)} className="accent-[var(--accent)]" />
            {value === 'male' ? 'Hombre' : 'Mujer'}
          </label>
        ))}
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <NumberField id="nutrition-age" label="Edad" value={age} min={10} max={120} onChange={setAge} />
        <NumberField id="nutrition-height" label="Estatura (cm)" value={heightCm} min={100} max={260} onChange={setHeightCm} />
        <NumberField id="nutrition-weight" label="Peso (kg)" value={weightKg} min={30} max={500} step={0.1} onChange={setWeightKg} />
        <NumberField id="nutrition-glass" label="Vaso (ml)" value={glassMl} min={50} max={1000} onChange={setGlassMl} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="nutrition-activity" className="block text-sm font-medium text-text mb-1">Actividad</label>
          <select id="nutrition-activity" value={activityLevel} onChange={(event) => setActivityLevel(event.target.value as ActivityLevel)} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg-elevated text-text focus:outline-none focus:ring-2 focus:ring-accent">
            {activityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="nutrition-goal" className="block text-sm font-medium text-text mb-1">Objetivo</label>
          <select id="nutrition-goal" value={goal} onChange={(event) => setGoal(event.target.value as NutritionGoal)} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg-elevated text-text focus:outline-none focus:ring-2 focus:ring-accent">
            {goalOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="nutrition-target" className="block text-sm font-medium text-text mb-1">Calorías objetivo manuales</label>
          <input id="nutrition-target" type="number" inputMode="numeric" min={800} max={10000} value={targetOverride} onChange={(event) => { setFormError(null); setTargetOverride(event.target.value) }} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg-elevated text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent" placeholder="Opcional" />
        </div>
        <div>
          <label htmlFor="nutrition-country" className="block text-sm font-medium text-text mb-1">País</label>
          <input id="nutrition-country" type="text" maxLength={100} value={country} onChange={(event) => setCountry(event.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg-elevated text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent" placeholder="Ej: Chile" />
        </div>
      </div>

      {formError && <p role="alert" className="text-sm text-[var(--danger)]">{formError}</p>}

      {profile && (
        <div className="grid grid-cols-3 gap-2 rounded-xl bg-bg p-3 text-center text-xs text-text-muted border border-border">
          <span><strong className="block text-text text-sm">{profile.bmr}</strong>BMR</span>
          <span><strong className="block text-text text-sm">{profile.tdee}</strong>TDEE</span>
          <span><strong className="block text-accent text-sm">{profile.recommended_calories}</strong>Objetivo</span>
        </div>
      )}

      <button type="submit" disabled={saving} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-accent-fg text-sm font-semibold rounded-lg hover:bg-[var(--accent-hover)] disabled:opacity-60 transition-colors">
        {saving ? <span className="w-4 h-4 border-2 border-accent-fg/40 border-t-accent-fg rounded-full animate-spin" /> : <Save className="w-4 h-4" aria-hidden="true" />}
        {saving ? 'Guardando...' : profile ? 'Actualizar perfil' : 'Guardar perfil'}
      </button>
    </form>
  )
}

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function NumberField({ id, label, value, min, max, step = 1, onChange }: { id: string; label: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-text mb-1">{label}</label>
      <input id={id} type="number" inputMode="decimal" min={min} max={max} step={step} value={value} onChange={(event) => {
        const nextValue = event.currentTarget.valueAsNumber
        if (Number.isFinite(nextValue)) onChange(nextValue)
      }} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg-elevated text-text focus:outline-none focus:ring-2 focus:ring-accent" required />
    </div>
  )
}
