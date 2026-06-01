'use client'

import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { CalendarDays, ChevronLeft, ChevronRight, Droplets, Flame, Pencil, RefreshCw, Sparkles, UtensilsCrossed } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { PullToRefreshIndicator } from '@/components/shared/PullToRefreshIndicator'
import { SkeletonCard, SkeletonStats } from '@/components/shared/Skeleton'
import { DaySummary } from '@/components/nutrition/DaySummary'
import { ExerciseEntryForm } from '@/components/nutrition/ExerciseEntryForm'
import { ExerciseList } from '@/components/nutrition/ExerciseList'
import { HealthProfileForm } from '@/components/nutrition/HealthProfileForm'
import { MealEntryForm } from '@/components/nutrition/MealEntryForm'
import { MealList } from '@/components/nutrition/MealList'
import { WaterTracker } from '@/components/nutrition/WaterTracker'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { ExerciseEntry, HealthProfile, HealthProfileInput, MealEntry, NutritionDay, NutritionDaySummary } from '@/lib/types'

const defaultSummary: NutritionDaySummary = {
  period_start: '',
  period_end: '',
  total_days: 0,
  analyzed_days: 0,
  avg_recommended_calories: null,
  avg_consumed_calories: null,
  avg_burned_calories: null,
  avg_balance_calories: null,
  total_water_ml: 0,
  avg_protein_g: null,
  avg_carbs_g: null,
  avg_sugar_g: null,
  avg_fat_g: null,
}

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 28 } },
}

function getLocalDateValue(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDateValue(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function addDaysToDateValue(value: string, days: number) {
  const date = parseDateValue(value)
  date.setDate(date.getDate() + days)
  return getLocalDateValue(date)
}

function formatDateLabel(value: string) {
  return parseDateValue(value).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatKcal(value?: number | null) {
  return value == null ? 'Sin datos' : `${value} kcal`
}

const activityLabels: Record<HealthProfile['activity_level'], string> = {
  sedentary: 'Sedentario',
  light: 'Ligero',
  moderate: 'Moderado',
  active: 'Activo',
  very_active: 'Muy activo',
}

const nutritionGoalLabels: Record<HealthProfile['goal'], string> = {
  lose: 'Bajar',
  maintain: 'Mantener',
  gain: 'Subir',
}

export default function NutritionPage() {
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateValue())
  const [profile, setProfile] = useState<HealthProfile | null>(null)
  const [day, setDay] = useState<NutritionDay | null>(null)
  const [recentDays, setRecentDays] = useState<NutritionDay[]>([])
  const [summary, setSummary] = useState<NutritionDaySummary>(defaultSummary)
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingMeal, setSavingMeal] = useState(false)
  const [savingExercise, setSavingExercise] = useState(false)
  const [updatingWater, setUpdatingWater] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const loadRequestIdRef = useRef(0)

  const loadData = useCallback(async () => {
    const requestId = loadRequestIdRef.current + 1
    loadRequestIdRef.current = requestId
    setError(null)
    setTimelineLoading(true)
    try {
      const [loadedProfile, loadedDay, days, weeklySummary] = await Promise.all([
        api.nutrition.profile(),
        api.nutrition.getByDate(selectedDate),
        api.nutrition.list({ limit: '30' }),
        api.nutrition.weeklySummary().catch(() => defaultSummary),
      ])
      if (requestId !== loadRequestIdRef.current) return
      setProfile(loadedProfile)
      setDay(loadedDay)
      setRecentDays(days)
      setSummary(weeklySummary)
    } catch (err) {
      if (requestId !== loadRequestIdRef.current) return
      console.error('Failed to load nutrition data:', err)
      setError(err instanceof Error ? err.message : 'No se pudo cargar nutrition')
    } finally {
      if (requestId === loadRequestIdRef.current) {
        setLoading(false)
        setTimelineLoading(false)
      }
    }
  }, [selectedDate])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadData])

  const ptr = usePullToRefresh({ onRefresh: loadData })
  const todayValue = getLocalDateValue()
  const isSelectedToday = selectedDate === todayValue
  const glassMl = profile?.glass_ml ?? 200

  const saveProfile = async (data: HealthProfileInput) => {
    setSavingProfile(true)
    setError(null)
    try {
      const saved = await api.nutrition.saveProfile(data)
      setProfile(saved)
      setStatusMessage('Perfil de salud guardado')
      setEditingProfile(false)
      await loadData()
    } catch (err) {
      console.error('Failed to save health profile:', err)
      setError(err instanceof Error ? err.message : 'No se pudo guardar el perfil')
    } finally {
      setSavingProfile(false)
    }
  }

  const addMeal = async (description: string) => {
    setSavingMeal(true)
    setError(null)
    try {
      await api.nutrition.createMeal({ date: selectedDate, description })
      setStatusMessage('Comida añadida')
      await loadData()
    } catch (err) {
      console.error('Failed to add meal:', err)
      setError(err instanceof Error ? err.message : 'No se pudo añadir la comida')
    } finally {
      setSavingMeal(false)
    }
  }

  const addExercise = async (description: string) => {
    setSavingExercise(true)
    setError(null)
    try {
      await api.nutrition.createExercise({ date: selectedDate, description })
      setStatusMessage('Ejercicio añadido')
      await loadData()
    } catch (err) {
      console.error('Failed to add exercise:', err)
      setError(err instanceof Error ? err.message : 'No se pudo añadir el ejercicio')
    } finally {
      setSavingExercise(false)
    }
  }

  const deleteMeal = async (meal: MealEntry) => {
    if (!window.confirm('¿Eliminar esta comida?')) return
    try {
      await api.nutrition.deleteMeal(meal.id)
      setStatusMessage('Comida eliminada')
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la comida')
    }
  }

  const deleteExercise = async (exercise: ExerciseEntry) => {
    if (!window.confirm('¿Eliminar este ejercicio?')) return
    try {
      await api.nutrition.deleteExercise(exercise.id)
      setStatusMessage('Ejercicio eliminado')
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el ejercicio')
    }
  }

  const updateWater = async (delta: number) => {
    setUpdatingWater(true)
    setError(null)
    try {
      const updated = await api.nutrition.setWater(selectedDate, { delta })
      setDay(updated)
      setStatusMessage(delta > 0 ? 'Vaso de agua añadido' : 'Vaso de agua restado')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el agua')
    } finally {
      setUpdatingWater(false)
    }
  }

  const analyzeDay = async () => {
    setAnalyzing(true)
    setError(null)
    try {
      const analyzed = await api.nutrition.analyze(selectedDate)
      setDay(analyzed)
      setStatusMessage('Día analizado')
      await loadData()
    } catch (err) {
      console.error('Failed to analyze nutrition day:', err)
      setError(err instanceof Error ? err.message : 'No se pudo analizar el día')
    } finally {
      setAnalyzing(false)
    }
  }

  if (loading) {
    return (
      <div>
        <Header title="Nutrición" subtitle="Cargando alimentación diaria..." />
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
          <SkeletonStats />
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,430px)_1fr] gap-5">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    )
  }

  if (!day) {
    return (
      <div>
        <Header title="Nutrición" subtitle="Registra comidas, ejercicio, agua y balance calórico" />
        <main className="p-4 md:p-8 max-w-6xl mx-auto space-y-4">
          <div role="alert" className="p-4 rounded-xl border border-danger-soft bg-danger-soft/40 text-sm text-[var(--danger)]">
            {error ?? 'No se pudo cargar nutrition'}
          </div>
          <button type="button" onClick={loadData} className="px-4 py-2 bg-accent text-accent-fg text-sm font-semibold rounded-lg hover:bg-[var(--accent-hover)] transition-colors">
            Reintentar
          </button>
        </main>
      </div>
    )
  }

  return (
    <div>
      <PullToRefreshIndicator pull={ptr.pull} refreshing={ptr.refreshing} progress={ptr.progress} />
      <Header title="Nutrición" subtitle="Registra comidas, ejercicio, agua y balance calórico" />

      <main className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <InsightCard icon={<Flame className="w-4 h-4" />} label="Objetivo" value={formatKcal(day.recommended_calories ?? profile?.recommended_calories)} tone="text-accent bg-accent-soft" />
          <InsightCard icon={<UtensilsCrossed className="w-4 h-4" />} label="Consumidas" value={formatKcal(day.consumed_calories)} tone="text-[var(--warning)] bg-warning-soft" />
          <InsightCard icon={<Sparkles className="w-4 h-4" />} label="Días analizados" value={`${summary.analyzed_days}/${summary.total_days}`} tone="text-[var(--success)] bg-success-soft" />
          <InsightCard icon={<Droplets className="w-4 h-4" />} label="Agua semana" value={`${summary.total_water_ml} ml`} tone="text-[var(--info)] bg-info-soft" />
        </div>

        {error && <div role="alert" className="p-3 rounded-xl border border-danger-soft bg-danger-soft/40 text-sm text-[var(--danger)]">{error}</div>}
        <p className="sr-only" aria-live="polite" aria-atomic="true">{statusMessage}</p>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,430px)_1fr] gap-5 items-start">
          <section aria-labelledby="nutrition-profile-title" className={cn('bg-bg-elevated border rounded-2xl p-4 md:p-5 lg:sticky lg:top-28', profile ? 'border-border' : 'border-accent/50')}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 id="nutrition-profile-title" className="text-base font-semibold text-text">Perfil</h2>
                <p className="text-sm text-text-muted mt-1">{profile ? 'Datos base para calcular tu objetivo diario.' : 'Guarda tu perfil antes de analizar el día.'}</p>
              </div>
              {profile && (
                <button
                  type="button"
                  onClick={() => setEditingProfile((value) => !value)}
                  aria-expanded={editingProfile}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-bg-muted hover:text-text"
                >
                  <Pencil className="w-4 h-4" aria-hidden="true" />
                  {editingProfile ? 'Cerrar' : 'Editar'}
                </button>
              )}
            </div>

            {profile && !editingProfile ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-bg p-3 text-center text-xs text-text-muted">
                  <span><strong className="block text-sm text-text">{profile.bmr}</strong>BMR</span>
                  <span><strong className="block text-sm text-text">{profile.tdee}</strong>TDEE</span>
                  <span><strong className="block text-sm text-accent">{profile.recommended_calories}</strong>Objetivo</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-text-muted">
                  <span className="rounded-full bg-bg px-2.5 py-1 border border-border">{profile.weight_kg} kg</span>
                  <span className="rounded-full bg-bg px-2.5 py-1 border border-border">{profile.height_cm} cm</span>
                  <span className="rounded-full bg-bg px-2.5 py-1 border border-border">{activityLabels[profile.activity_level]}</span>
                  <span className="rounded-full bg-bg px-2.5 py-1 border border-border">{nutritionGoalLabels[profile.goal]}</span>
                </div>
              </div>
            ) : (
              <HealthProfileForm key={profile?.updated_at ?? profile?.id ?? 'new'} profile={profile} saving={savingProfile} onSubmit={saveProfile} />
            )}
          </section>

          <section aria-label="Registro diario de nutrition" className="space-y-5">
            <div className="bg-bg-elevated border border-border rounded-2xl p-4 md:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-text">{isSelectedToday ? 'Registro de hoy' : `Registro del ${formatDateLabel(selectedDate)}`}</h2>
                  <p className="text-sm text-text-muted mt-1">Estado: {day.status === 'analyzed' ? 'analizado' : 'borrador'}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => setSelectedDate((value) => addDaysToDateValue(value, -1))} className="touch-target inline-flex items-center justify-center rounded-lg border border-border text-text-muted hover:text-text hover:bg-bg-muted transition-colors" aria-label="Ver nutrition del día anterior">
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <label className="relative inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-bg text-sm text-text">
                    <CalendarDays className="w-4 h-4 text-text-subtle" aria-hidden="true" />
                    <span className="sr-only">Fecha del registro de nutrition</span>
                    <input type="date" value={selectedDate} max={todayValue} onChange={(event) => setSelectedDate(event.target.value || todayValue)} className="bg-transparent text-sm text-text focus:outline-none" aria-label="Fecha del registro de nutrition" />
                  </label>
                  <button type="button" onClick={() => setSelectedDate((value) => addDaysToDateValue(value, 1))} disabled={isSelectedToday} className="touch-target inline-flex items-center justify-center rounded-lg border border-border text-text-muted hover:text-text hover:bg-bg-muted disabled:opacity-40 transition-colors" aria-label="Ver nutrition del día siguiente">
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                  {!isSelectedToday && <button type="button" onClick={() => setSelectedDate(todayValue)} className="px-3 py-2 rounded-lg bg-accent-soft text-accent text-sm font-semibold hover:bg-accent-soft/80 transition-colors">Hoy</button>}
                  <button type="button" onClick={loadData} className="touch-target inline-flex items-center justify-center rounded-lg border border-border text-text-muted hover:text-text hover:bg-bg-muted transition-colors" aria-label="Recargar nutrition">
                    <RefreshCw className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {timelineLoading ? <div className="py-8 text-center text-sm text-text-muted">Actualizando...</div> : <NutritionHistory days={recentDays} selectedDate={selectedDate} onSelect={setSelectedDate} />}
            </div>

            <WaterTracker waterMl={day.water_ml} glassMl={glassMl} updating={updatingWater} onDelta={updateWater} />

            <DaySummary day={day} analyzing={analyzing} canAnalyze={Boolean(profile && (day.meals.length > 0 || day.exercises.length > 0))} onAnalyze={analyzeDay} />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <section aria-labelledby="meals-title" className="bg-bg-elevated border border-border rounded-2xl p-4 md:p-5 space-y-4">
                <div>
                  <h2 id="meals-title" className="text-base font-semibold text-text">Comidas</h2>
                  <p className="text-sm text-text-muted mt-1">Texto libre; la IA estima kcal y macros al analizar.</p>
                </div>
                <MealEntryForm saving={savingMeal} onSubmit={addMeal} />
                <MealList meals={day.meals} onDelete={deleteMeal} />
              </section>

              <section aria-labelledby="exercises-title" className="bg-bg-elevated border border-border rounded-2xl p-4 md:p-5 space-y-4">
                <div>
                  <h2 id="exercises-title" className="text-base font-semibold text-text">Ejercicios</h2>
                  <p className="text-sm text-text-muted mt-1">Describe duración, repeticiones o intensidad si la sabes.</p>
                </div>
                <ExerciseEntryForm saving={savingExercise} onSubmit={addExercise} />
                <ExerciseList exercises={day.exercises} onDelete={deleteExercise} />
              </section>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

function InsightCard({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: string }) {
  return (
    <div className="bg-bg-elevated p-4 rounded-xl border border-border">
      <div className="flex items-center gap-2 mb-2">
        <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center', tone)}>{icon}</span>
        <span className="text-xs font-medium text-text-subtle">{label}</span>
      </div>
      <p className="text-xl font-bold text-text truncate">{value}</p>
    </div>
  )
}

function NutritionHistory({ days, selectedDate, onSelect }: { days: NutritionDay[]; selectedDate: string; onSelect: (date: string) => void }) {
  if (days.length === 0) return <p className="py-6 text-center text-sm text-text-muted">Sin historial todavía.</p>
  return (
    <motion.ol className="space-y-3" variants={listVariants} initial="hidden" animate="show">
      {days.map((day) => (
        <motion.li key={day.id} variants={itemVariants}>
          <button type="button" onClick={() => onSelect(day.date)} className={cn('w-full text-left border rounded-xl p-3 transition-colors focus:outline-none focus:ring-2 focus:ring-accent', selectedDate === day.date ? 'bg-accent-soft border-accent/40' : 'bg-bg border-border')}>
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-text capitalize">{formatDateLabel(day.date)}</span>
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', day.status === 'analyzed' ? 'bg-success-soft text-[var(--success)]' : 'bg-bg-muted text-text-muted')}>{day.status === 'analyzed' ? 'Analizado' : 'Borrador'}</span>
            </div>
            <p className="mt-1 text-xs text-text-subtle">{day.meals.length} comidas · {day.exercises.length} ejercicios · {day.water_ml} ml agua</p>
          </button>
        </motion.li>
      ))}
    </motion.ol>
  )
}
