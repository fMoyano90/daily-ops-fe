'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Sparkles, Trash2, X } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { PullToRefreshIndicator } from '@/components/shared/PullToRefreshIndicator'
import { SkeletonCard } from '@/components/shared/Skeleton'
import { ActiveExerciseCard } from '@/components/exercise/ActiveExerciseCard'
import { CloseTrainingSheet } from '@/components/exercise/CloseTrainingSheet'
import { ExerciseProfileForm } from '@/components/exercise/ExerciseProfileForm'
import { WorkoutDaySummary } from '@/components/exercise/WorkoutDaySummary'
import { WorkoutExerciseForm } from '@/components/exercise/WorkoutExerciseForm'
import { WorkoutExerciseList } from '@/components/exercise/WorkoutExerciseList'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  ExerciseProfile,
  ExerciseProfileInput,
  ExerciseSet,
  WorkoutDay,
  WorkoutExercise,
  WorkoutExerciseCreate,
} from '@/lib/types'

type Tab = 'today' | 'history' | 'profile'

function getLocalDateValue(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseDateValue(value: string) {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function addDaysToDateValue(value: string, days: number) {
  const date = parseDateValue(value)
  date.setDate(date.getDate() + days)
  return getLocalDateValue(date)
}

function formatDateLabel(value: string) {
  return parseDateValue(value).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ExercisePage() {
  const [tab, setTab] = useState<Tab>('today')
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateValue())
  const [profile, setProfile] = useState<ExerciseProfile | null>(null)
  const [day, setDay] = useState<WorkoutDay | null>(null)
  const [recentDays, setRecentDays] = useState<WorkoutDay[]>([])
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [addingExercise, setAddingExercise] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [generatingCoach, setGeneratingCoach] = useState(false)
  const [closingTraining, setClosingTraining] = useState(false)
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showCloseSheet, setShowCloseSheet] = useState(false)
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const loadRequestIdRef = useRef(0)

  const loadData = useCallback(async () => {
    const requestId = loadRequestIdRef.current + 1
    loadRequestIdRef.current = requestId
    setError(null)
    setTimelineLoading(true)
    try {
      const [loadedProfile, loadedDay, days] = await Promise.all([
        api.exercise.getProfile().catch(() => null),
        api.exercise.getByDate(selectedDate),
        api.exercise.list({ limit: '30' }),
      ])
      if (requestId !== loadRequestIdRef.current) return
      setProfile(loadedProfile)
      setDay(loadedDay)
      setRecentDays(days)
    } catch (err) {
      if (requestId !== loadRequestIdRef.current) return
      console.error('Failed to load exercise data:', err)
      setError(err instanceof Error ? err.message : 'No se pudo cargar el módulo de ejercicio')
    } finally {
      if (requestId === loadRequestIdRef.current) {
        setLoading(false)
        setTimelineLoading(false)
      }
    }
  }, [selectedDate])

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadData() }, 0)
    return () => window.clearTimeout(timer)
  }, [loadData])

  const ptr = usePullToRefresh({ onRefresh: loadData })
  const todayValue = getLocalDateValue()
  const isSelectedToday = selectedDate === todayValue
  const activeExercise = day?.exercises.find((e) => e.id === activeExerciseId) ?? null

  // Derived state
  const completedCount = day?.exercises.filter((e) => e.status === 'completed').length ?? 0
  const totalCount = day?.exercises.length ?? 0
  const canCloseTraining = totalCount > 0 && day?.status !== 'completed'

  const saveProfile = async (data: ExerciseProfileInput) => {
    setSavingProfile(true)
    setError(null)
    try {
      const saved = await api.exercise.saveProfile(data)
      setProfile(saved)
      setStatusMessage('Perfil de entrenamiento guardado')
      setTab('today')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el perfil')
    } finally {
      setSavingProfile(false)
    }
  }

  const addExercise = async (data: WorkoutExerciseCreate) => {
    setAddingExercise(true)
    setError(null)
    try {
      await api.exercise.createExercise({ ...data, date: selectedDate })
      setStatusMessage('Ejercicio añadido')
      setShowAddForm(false)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo añadir el ejercicio')
    } finally {
      setAddingExercise(false)
    }
  }

  const deleteExercise = async (exercise: WorkoutExercise) => {
    if (!window.confirm(`¿Eliminar "${exercise.name}"?`)) return
    setError(null)
    try {
      await api.exercise.deleteExercise(exercise.id)
      if (activeExerciseId === exercise.id) setActiveExerciseId(null)
      setStatusMessage('Ejercicio eliminado')
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el ejercicio')
    }
  }

  const suggestRoutine = async () => {
    setSuggesting(true)
    setError(null)
    try {
      const updated = await api.exercise.suggest(selectedDate)
      setDay(updated)
      setStatusMessage('Rutina generada')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar la rutina')
    } finally {
      setSuggesting(false)
    }
  }

  const handleStartExercise = (exercise: WorkoutExercise) => {
    setActiveExerciseId(exercise.id)
  }

  const handleSetComplete = async (setData: ExerciseSet) => {
    if (!activeExerciseId) return
    const ex = day?.exercises.find((e) => e.id === activeExerciseId)
    if (!ex) return
    const currentSetsData = ex.sets_data ?? []
    const newSetsData = [...currentSetsData, setData]
    try {
      const updated = await api.exercise.updateExercise(activeExerciseId, { sets_data: newSetsData })
      setDay((prev) => prev ? {
        ...prev,
        exercises: prev.exercises.map((e) => e.id === activeExerciseId ? updated : e),
      } : prev)
    } catch (err) {
      console.error('Failed to save set data:', err)
    }
  }

  const handleExerciseComplete = async (timerSeconds: number) => {
    if (!activeExerciseId) return
    setError(null)
    try {
      const updated = await api.exercise.updateExercise(activeExerciseId, {
        status: 'completed',
        timer_seconds: timerSeconds,
      })
      setDay((prev) => prev ? {
        ...prev,
        exercises: prev.exercises.map((e) => e.id === activeExerciseId ? updated : e),
      } : prev)
      setActiveExerciseId(null)
      setStatusMessage('Ejercicio completado')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el ejercicio')
    }
  }

  const handleSkipExercise = async () => {
    if (!activeExerciseId) return
    try {
      const updated = await api.exercise.updateExercise(activeExerciseId, { status: 'skipped' })
      setDay((prev) => prev ? {
        ...prev,
        exercises: prev.exercises.map((e) => e.id === activeExerciseId ? updated : e),
      } : prev)
      setActiveExerciseId(null)
    } catch (err) {
      console.error('Failed to skip exercise:', err)
    }
  }

  const handleCloseTraining = async (rpe: number, postWorkoutState: string) => {
    setClosingTraining(true)
    setError(null)
    try {
      // First calculate calories
      let updated: WorkoutDay
      try {
        updated = await api.exercise.calculateCalories(selectedDate)
      } catch {
        // If calorie calc fails (e.g. no ANTHROPIC key), just close without it
        updated = day!
      }
      // Then save RPE + state + mark completed
      const closed = await api.exercise.updateDay(selectedDate, {
        rpe,
        post_workout_state: postWorkoutState,
        status: 'completed',
      })
      setDay({ ...closed, total_calories_burned: updated.total_calories_burned, total_duration_min: updated.total_duration_min })
      setShowCloseSheet(false)
      setStatusMessage('Ciclo de entrenamiento cerrado')
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cerrar el entrenamiento')
    } finally {
      setClosingTraining(false)
    }
  }

  const generateCoachMessage = async () => {
    setGeneratingCoach(true)
    setError(null)
    try {
      const updated = await api.exercise.coachMessage(selectedDate)
      setDay(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar el mensaje')
    } finally {
      setGeneratingCoach(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-elevated">
      <Header title="Ejercicio" />
      <PullToRefreshIndicator {...ptr} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pb-20 pt-4 space-y-4">
        {/* Tab selector */}
        <div className="flex gap-1 p-1 bg-bg rounded-xl border border-border">
          {(['today', 'history', 'profile'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors',
                tab === t ? 'bg-bg-elevated text-text shadow-sm' : 'text-text-muted hover:text-text',
              )}
            >
              {t === 'today' ? 'Entrenamiento' : t === 'history' ? 'Historial' : 'Perfil'}
            </button>
          ))}
        </div>

        {statusMessage && (
          <p className="text-sm text-[var(--success)] font-medium">{statusMessage}</p>
        )}
        {error && (
          <p role="alert" className="text-sm text-[var(--danger)]">{error}</p>
        )}

        {/* TRAINING TAB */}
        {tab === 'today' && (
          <div className="space-y-4">
            {/* Date navigation — only between dates that have data (plus today) */}
            {(() => {
              const existingDates = new Set([todayValue, ...recentDays.map((d) => d.date)])
              const sortedDates = Array.from(existingDates).sort()
              const currentIdx = sortedDates.indexOf(selectedDate)
              const prevDate = currentIdx > 0 ? sortedDates[currentIdx - 1] : null
              const nextDate = currentIdx < sortedDates.length - 1 ? sortedDates[currentIdx + 1] : null

              return (
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => prevDate && setSelectedDate(prevDate)}
                    disabled={!prevDate}
                    className="touch-target -m-2 text-text-subtle hover:text-text disabled:opacity-20 transition-colors"
                    aria-label="Día anterior con entrenamiento"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="text-center">
                    <p className="text-sm font-medium text-text">{formatDateLabel(selectedDate)}</p>
                    {isSelectedToday
                      ? <p className="text-xs text-accent font-semibold">Hoy</p>
                      : day?.status === 'completed'
                        ? <p className="text-xs text-[var(--success)] font-semibold">Completado</p>
                        : day
                          ? <p className="text-xs text-text-subtle">Borrador</p>
                          : null
                    }
                  </div>
                  <button
                    type="button"
                    onClick={() => nextDate && !isSelectedToday && setSelectedDate(nextDate)}
                    disabled={!nextDate || selectedDate === sortedDates[sortedDates.length - 1]}
                    className="touch-target -m-2 text-text-subtle hover:text-text disabled:opacity-20 transition-colors"
                    aria-label="Día siguiente con entrenamiento"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )
            })()}

            {loading ? (
              <SkeletonCard />
            ) : !day && !isSelectedToday ? (
              <div className="rounded-xl border border-dashed border-border bg-bg p-6 text-center text-sm text-text-muted">
                Sin entrenamiento registrado para este día.
              </div>
            ) : day ? (
              <>
                {/* Completed day stats */}
                <WorkoutDaySummary
                  day={day}
                  generatingCoach={generatingCoach}
                  onCoachMessage={generateCoachMessage}
                />

                {/* Active exercise */}
                {activeExercise && (
                  <ActiveExerciseCard
                    exercise={activeExercise}
                    onSetComplete={handleSetComplete}
                    onComplete={handleExerciseComplete}
                    onSkip={handleSkipExercise}
                  />
                )}

                {/* Progress bar (draft only) */}
                {day.status !== 'completed' && totalCount > 0 && (
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span>{completedCount} / {totalCount} ejercicios completados</span>
                    <div className="w-32 h-1.5 rounded-full bg-bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--success)] transition-all"
                        style={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                )}

                {/* Exercise list */}
                <div className="rounded-2xl border border-border bg-bg-elevated p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-text">
                      Tu entrenamiento {totalCount > 0 ? `(${totalCount})` : ''}
                    </h2>
                    {totalCount > 0 && day.status !== 'completed' && (
                      <button
                        type="button"
                        onClick={suggestRoutine}
                        disabled={suggesting}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-accent-soft text-accent text-xs font-medium hover:opacity-80 disabled:opacity-60 transition-opacity"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {suggesting ? 'Generando...' : 'Regenerar rutina'}
                      </button>
                    )}
                  </div>

                  <WorkoutExerciseList
                    exercises={day.exercises}
                    activeExerciseId={activeExerciseId}
                    suggesting={suggesting}
                    onStart={handleStartExercise}
                    onDelete={deleteExercise}
                    onSuggest={suggestRoutine}
                  />

                  {/* Add exercise toggle */}
                  {day.status !== 'completed' && (
                    <div>
                      {showAddForm ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-text">Añadir ejercicio</span>
                            <button type="button" onClick={() => setShowAddForm(false)} className="text-text-subtle hover:text-text">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <WorkoutExerciseForm saving={addingExercise} onSubmit={addExercise} />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowAddForm(true)}
                          className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-border text-text-muted text-sm hover:border-border hover:bg-bg transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Añadir ejercicio manualmente
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Close training button */}
                {canCloseTraining && !activeExercise && (
                  <button
                    type="button"
                    onClick={() => setShowCloseSheet(true)}
                    className="w-full py-3.5 rounded-xl bg-bg-elevated border border-border text-text font-semibold hover:bg-bg transition-colors"
                  >
                    Cerrar ciclo de entrenamiento
                  </button>
                )}
              </>
            ) : null}
          </div>
        )}

        {/* HISTORY TAB */}
        {tab === 'history' && (
          <div className="space-y-3">
            {timelineLoading ? (
              <SkeletonCard />
            ) : recentDays.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-bg p-6 text-center text-sm text-text-muted">
                No hay entrenamientos registrados aún.
              </p>
            ) : (
              <ul className="space-y-2">
                {recentDays.map((d) => (
                  <li key={d.id} className="rounded-xl border border-border bg-bg overflow-hidden">
                    {/* Clickable main area → open that day */}
                    <button
                      type="button"
                      className="w-full text-left p-3 hover:bg-bg-muted transition-colors"
                      onClick={() => { setSelectedDate(d.date); setTab('today') }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-text">{formatDateLabel(d.date)}</p>
                          <p className="text-xs text-text-muted mt-0.5">
                            {d.exercises.length === 0
                              ? 'Sin ejercicios'
                              : `${d.exercises.filter((e) => e.status === 'completed').length}/${d.exercises.length} completados`}
                            {d.total_duration_min ? ` · ${d.total_duration_min} min` : ''}
                            {d.total_calories_burned ? ` · ${d.total_calories_burned} kcal` : ''}
                          </p>
                          {/* Exercise names preview */}
                          {d.exercises.length > 0 && (
                            <p className="text-xs text-text-subtle mt-1 truncate">
                              {d.exercises.slice(0, 4).map((e) => e.name).join(' · ')}
                              {d.exercises.length > 4 ? ` +${d.exercises.length - 4}` : ''}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {d.rpe != null && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-bg-muted text-text-muted">
                              RPE {d.rpe}
                            </span>
                          )}
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium',
                            d.status === 'completed' ? 'bg-success-soft text-[var(--success)]' : 'bg-bg-muted text-text-muted',
                          )}>
                            {d.status === 'completed' ? 'Completado' : 'Borrador'}
                          </span>
                        </div>
                      </div>
                      {d.coach_notes && (
                        <p className="mt-1.5 text-xs text-text-subtle italic truncate">{d.coach_notes}</p>
                      )}
                    </button>

                    {/* Actions row */}
                    <div className="flex items-center justify-between px-3 py-2 border-t border-border/50 bg-bg">
                      <button
                        type="button"
                        className="text-xs text-accent hover:text-[var(--accent-hover)] font-medium transition-colors"
                        onClick={() => { setSelectedDate(d.date); setTab('today') }}
                      >
                        {d.status === 'completed' ? 'Ver detalle →' : 'Continuar entrenamiento →'}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!window.confirm('¿Eliminar este día de entrenamiento?')) return
                          try {
                            await api.exercise.deleteDay(d.date)
                            await loadData()
                          } catch (err) {
                            setError(err instanceof Error ? err.message : 'No se pudo eliminar')
                          }
                        }}
                        className="touch-target text-text-subtle hover:text-[var(--danger)] transition-colors"
                        aria-label="Eliminar día"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* PROFILE TAB */}
        {tab === 'profile' && (
          <div className="rounded-2xl border border-border bg-bg-elevated p-4">
            <ExerciseProfileForm
              profile={profile}
              saving={savingProfile}
              onSubmit={saveProfile}
            />
          </div>
        )}
      </main>

      {/* Close training sheet */}
      {showCloseSheet && day && (
        <CloseTrainingSheet
          day={day}
          saving={closingTraining}
          onConfirm={handleCloseTraining}
          onCancel={() => setShowCloseSheet(false)}
        />
      )}
    </div>
  )
}
