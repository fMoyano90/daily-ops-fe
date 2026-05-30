'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, CheckCircle2, Edit2, Flame, Shield, TrendingDown, Wind, X } from 'lucide-react'
import { SkeletonCard, SkeletonStats } from '@/components/shared/Skeleton'
import { Modal } from '@/components/shared/Modal'
import { HabitForm } from '@/components/habits/HabitForm'
import { UrgePanel } from '@/components/habits/UrgePanel'
import { RelapseForm } from '@/components/habits/RelapseForm'
import { api } from '@/lib/api'
import { Habit, HabitEvent, HabitEventCreate, HabitSummary, HabitUpdate } from '@/lib/types'
import { cn } from '@/lib/utils'

type ActivePanel = null | 'urge' | 'relapse' | 'edit'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
}

const eventTypeLabel: Record<string, string> = {
  check_in: '✓ Check-in',
  urge: '⚡ Deseo',
  relapse: '↩ Registro',
}
const eventTypeColor: Record<string, string> = {
  check_in: 'text-[var(--success)]',
  urge: 'text-[var(--warning)]',
  relapse: 'text-text-muted',
}

export default function HabitDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [habit, setHabit] = useState<Habit | null>(null)
  const [events, setEvents] = useState<HabitEvent[]>([])
  const [summary, setSummary] = useState<HabitSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activePanel, setActivePanel] = useState<ActivePanel>(null)
  const [checkingIn, setCheckingIn] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  const load = useCallback(async () => {
    setError(null)
    try {
      const [h, evts, sum] = await Promise.all([
        api.habits.get(id),
        api.habits.events.list(id, { limit: '50' }),
        api.habits.summary(id),
      ])
      setHabit(h)
      setEvents(evts)
      setSummary(sum)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el hábito')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { void load() }, [load])

  async function handleSaveEvent(data: HabitEventCreate) {
    await api.habits.events.create(id, data)
    setActivePanel(null)
    const typeMsg = data.event_type === 'urge'
      ? (data.resisted ? 'Resististe el deseo. Registrado.' : 'Registrado honestamente.')
      : data.event_type === 'relapse'
      ? 'Registro guardado. Gracias por tu honestidad.'
      : 'Check-in guardado.'
    setStatusMessage(typeMsg)
    setTimeout(() => setStatusMessage(''), 3000)
    await load()
  }

  async function handleCheckIn() {
    setCheckingIn(true)
    try {
      await api.habits.events.create(id, { event_type: 'check_in' })
      setStatusMessage('¡Sigue así!')
      setTimeout(() => setStatusMessage(''), 3000)
      await load()
    } finally {
      setCheckingIn(false)
    }
  }

  async function handleUpdate(data: HabitUpdate) {
    await api.habits.update(id, data)
    setActivePanel(null)
    await load()
  }

  if (loading) return (
    <div className="p-4 space-y-4"><SkeletonStats /><SkeletonCard /><SkeletonCard /></div>
  )

  if (error || !habit) return (
    <div className="p-6 text-center">
      <p className="text-[var(--danger)] text-sm mb-3">{error || 'Hábito no encontrado'}</p>
      <button onClick={() => router.back()} className="text-sm text-accent hover:underline">Volver</button>
    </div>
  )

  const metrics = summary?.metrics
  const isAbstinence = habit.tracking_mode === 'abstinence'

  return (
    <div className="flex flex-col h-full">
      {/* Custom header with back + edit buttons */}
      <div className="flex items-center gap-3 border-b border-border px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <button onClick={() => router.back()} className="p-1 text-text-muted hover:text-text transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-text truncate">{habit.name}</h1>
          <p className="text-xs text-text-muted">{isAbstinence ? 'Abstinencia' : 'Control de conducta'}</p>
        </div>
        <button onClick={() => setActivePanel('edit')} className="p-1 text-text-muted hover:text-text transition-colors">
          <Edit2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <div className="max-w-lg mx-auto pt-4 space-y-5">
          {/* Status message */}
          <AnimatePresence>
            {statusMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="px-4 py-2.5 rounded-lg bg-success-soft text-[var(--success)] text-sm font-medium text-center"
              >
                {statusMessage}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Motivation */}
          {habit.motivation && (
            <div className="bg-accent/5 border border-accent/20 rounded-xl px-4 py-3">
              <p className="text-xs text-text-muted font-medium mb-0.5">Tu por qué</p>
              <p className="text-sm text-text">{habit.motivation}</p>
            </div>
          )}

          {/* Metrics */}
          {metrics && (
            <div className="grid grid-cols-3 gap-3">
              <div className={cn('rounded-xl p-3 text-center', isAbstinence ? 'bg-success-soft' : 'bg-info-soft')}>
                {isAbstinence ? <Flame className="w-4 h-4 mx-auto mb-1 text-[var(--success)]" /> : <TrendingDown className="w-4 h-4 mx-auto mb-1 text-[var(--info)]" />}
                <p className={cn('text-2xl font-bold leading-none', isAbstinence ? 'text-[var(--success)]' : 'text-[var(--info)]')}>
                  {isAbstinence ? metrics.current_streak_days : metrics.total_relapses}
                </p>
                <p className={cn('text-[10px] mt-0.5', isAbstinence ? 'text-[var(--success)]' : 'text-[var(--info)]')}>
                  {isAbstinence ? 'días' : 'episodios'}
                </p>
              </div>
              <div className="bg-warning-soft rounded-xl p-3 text-center">
                <Shield className="w-4 h-4 mx-auto mb-1 text-[var(--warning)]" />
                <p className="text-2xl font-bold leading-none text-[var(--warning)]">{metrics.urges_resisted}</p>
                <p className="text-[10px] mt-0.5 text-[var(--warning)]">resistidos</p>
              </div>
              <div className="bg-bg-subtle rounded-xl p-3 text-center">
                <Flame className="w-4 h-4 mx-auto mb-1 text-text-muted" />
                <p className="text-2xl font-bold leading-none text-text">{metrics.longest_streak_days}</p>
                <p className="text-[10px] mt-0.5 text-text-muted">mejor racha</p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button onClick={handleCheckIn} disabled={checkingIn}
              className="flex flex-col items-center gap-1 py-3 rounded-xl border border-border hover:border-[var(--success)] hover:bg-success-soft transition-colors text-text-muted hover:text-[var(--success)] disabled:opacity-50">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-xs font-medium">Hoy ok</span>
            </button>
            <button onClick={() => setActivePanel('urge')}
              className="flex flex-col items-center gap-1 py-3 rounded-xl border border-border hover:border-[var(--warning)] hover:bg-warning-soft transition-colors text-text-muted hover:text-[var(--warning)]">
              <Wind className="w-5 h-5" />
              <span className="text-xs font-medium">Tengo deseo</span>
            </button>
            <button onClick={() => setActivePanel('relapse')}
              className="flex flex-col items-center gap-1 py-3 rounded-xl border border-border hover:border-accent/50 hover:bg-accent/5 transition-colors text-text-muted hover:text-accent">
              <X className="w-5 h-5" />
              <span className="text-xs font-medium">Ocurrió</span>
            </button>
          </div>

          {/* Active panels */}
          <AnimatePresence>
            {activePanel === 'urge' && (
              <motion.div key="urge" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <UrgePanel habitName={habit.name} onSave={handleSaveEvent} onCancel={() => setActivePanel(null)} />
              </motion.div>
            )}
            {activePanel === 'relapse' && (
              <motion.div key="relapse" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <RelapseForm habitName={habit.name} onSave={handleSaveEvent} onCancel={() => setActivePanel(null)} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action plan */}
          {habit.action_plan && (
            <div className="bg-bg border border-border rounded-xl p-4">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1.5">Plan de acción</p>
              <p className="text-sm text-text whitespace-pre-wrap">{habit.action_plan}</p>
            </div>
          )}

          {/* Triggers & strategies */}
          {(habit.triggers.length > 0 || habit.coping_strategies.length > 0) && (
            <div className="grid grid-cols-2 gap-3">
              {habit.triggers.length > 0 && (
                <div className="bg-bg border border-border rounded-xl p-3">
                  <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">Gatillantes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {habit.triggers.map((t) => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-warning-soft text-[var(--warning)]">{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {habit.coping_strategies.length > 0 && (
                <div className="bg-bg border border-border rounded-xl p-3">
                  <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">Estrategias</p>
                  <div className="flex flex-wrap gap-1.5">
                    {habit.coping_strategies.map((s) => (
                      <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-success-soft text-[var(--success)]">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          {events.length > 0 && (
            <div>
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">Historial reciente</p>
              <div className="space-y-2">
                {events.map((ev) => (
                  <div key={ev.id} className="flex gap-3 items-start py-2 border-b border-border last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn('text-xs font-medium', eventTypeColor[ev.event_type])}>
                          {eventTypeLabel[ev.event_type]}
                        </span>
                        {ev.emotion && <span className="text-xs text-text-muted">{ev.emotion}</span>}
                        {ev.trigger && <span className="text-xs text-text-muted">· {ev.trigger}</span>}
                        {ev.resisted === true && <span className="text-xs text-[var(--success)] bg-success-soft px-1.5 rounded-full">resistido</span>}
                        {ev.breathing_used && <span className="text-xs text-accent">🌬</span>}
                      </div>
                      {ev.feeling_note && <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{ev.feeling_note}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-text-muted">{formatDate(ev.occurred_at)}</p>
                      <p className="text-xs text-text-muted">{formatTime(ev.occurred_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      <Modal open={activePanel === 'edit'} onClose={() => setActivePanel(null)} title="Editar hábito">
        <HabitForm initial={habit} onSave={handleUpdate} onCancel={() => setActivePanel(null)} />
      </Modal>
    </div>
  )
}
