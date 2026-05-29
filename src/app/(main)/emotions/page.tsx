'use client'

import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Activity, BookOpen, Brain, CalendarDays, ChevronLeft, ChevronRight, Gauge, Plus, Sparkles, Trash2, TrendingUp } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { EmptyState } from '@/components/shared/EmptyState'
import { SkeletonCard, SkeletonStats } from '@/components/shared/Skeleton'
import { PullToRefreshIndicator } from '@/components/shared/PullToRefreshIndicator'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { EmotionEnergy, EmotionEntry, EmotionSummary, EmotionValence } from '@/lib/types'

const emotionOptions: Array<{ value: string; label: string; valence: EmotionValence; color: string }> = [
  { value: 'alegria', label: 'Alegría', valence: 'pleasant', color: 'bg-success-soft text-[var(--success)] border-[var(--success-soft)]' },
  { value: 'calma', label: 'Calma', valence: 'pleasant', color: 'bg-info-soft text-[var(--info)] border-[var(--info-soft)]' },
  { value: 'gratitud', label: 'Gratitud', valence: 'pleasant', color: 'bg-accent-soft text-accent border-accent-soft' },
  { value: 'ansiedad', label: 'Ansiedad', valence: 'unpleasant', color: 'bg-warning-soft text-[var(--warning)] border-[var(--warning-soft)]' },
  { value: 'pena', label: 'Pena', valence: 'unpleasant', color: 'bg-info-soft text-[var(--info)] border-[var(--info-soft)]' },
  { value: 'rabia', label: 'Rabia', valence: 'unpleasant', color: 'bg-danger-soft text-[var(--danger)] border-[var(--danger-soft)]' },
  { value: 'frustracion', label: 'Frustración', valence: 'unpleasant', color: 'bg-warning-soft text-[var(--warning)] border-[var(--warning-soft)]' },
  { value: 'cansancio', label: 'Cansancio', valence: 'neutral', color: 'bg-bg-muted text-text-muted border-border' },
]

const triggerOptions = ['trabajo', 'familia', 'pareja', 'salud', 'dinero', 'conversacion', 'recuerdo', 'cuerpo', 'tarea', 'descanso']
const regulationOptions = ['respirar', 'caminar', 'escribir', 'hablar', 'pausar', 'tomar agua', 'ordenar prioridades', 'descansar']

const defaultSummary: EmotionSummary = {
  start_date: '',
  end_date: '',
  total_entries: 0,
  average_intensity: 0,
  unpleasant_count: 0,
  pleasant_count: 0,
  neutral_count: 0,
  by_emotion: {},
  by_trigger: {},
  by_valence: {},
}

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 28 } },
}

function labelForEmotion(value: string) {
  return emotionOptions.find((option) => option.value === value)?.label || value
}

function labelForValence(value: EmotionValence) {
  if (value === 'pleasant') return 'Agradable'
  if (value === 'unpleasant') return 'Desagradable'
  return 'Neutra'
}

function formatEntryTime(value: string) {
  return new Date(value).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
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

export default function EmotionsPage() {
  const [entries, setEntries] = useState<EmotionEntry[]>([])
  const [summary, setSummary] = useState<EmotionSummary>(defaultSummary)
  const [loading, setLoading] = useState(true)
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateValue())
  const [form, setForm] = useState({
    emotion: 'alegria',
    intensity: 5,
    valence: 'pleasant' as EmotionValence,
    energy: 'medium' as EmotionEnergy,
    trigger_type: '',
    trigger_note: '',
    secondary_emotions: '',
    body_sensation: '',
    thought: '',
    need: '',
    response: '',
    regulation_strategy: '',
    strategy_helped: '',
    note: '',
  })

  const loadData = useCallback(async () => {
    setError(null)
    setTimelineLoading(true)
    try {
      const [dateEntries, weeklySummary] = await Promise.all([
        api.emotions.list({ date_from: selectedDate, date_to: selectedDate, limit: '200' }),
        api.emotions.weeklySummary().catch(() => defaultSummary),
      ])
      setEntries(dateEntries)
      setSummary(weeklySummary)
    } catch (err) {
      console.error('Failed to load emotions:', err)
      setError(err instanceof Error ? err.message : 'No se pudo cargar el diario emocional')
    } finally {
      setLoading(false)
      setTimelineLoading(false)
    }
  }, [selectedDate])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadData])

  const ptr = usePullToRefresh({ onRefresh: loadData })

  const selectedEmotion = emotionOptions.find((option) => option.value === form.emotion)

  const valenceTone = useMemo(() => {
    if (form.valence === 'pleasant') return 'text-[var(--success)] bg-success-soft'
    if (form.valence === 'unpleasant') return 'text-[var(--warning)] bg-warning-soft'
    return 'text-text-muted bg-bg-muted'
  }, [form.valence])

  const handleEmotionSelect = (value: string) => {
    const emotion = emotionOptions.find((option) => option.value === value)
    setForm((prev) => ({
      ...prev,
      emotion: value,
      valence: emotion?.valence || prev.valence,
    }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setStatusMessage('')
    try {
      const payload = {
        ...form,
        secondary_emotions: form.secondary_emotions.split(',').map((item) => item.trim()).filter(Boolean),
        trigger_type: form.trigger_type || null,
        trigger_note: form.trigger_note || null,
        body_sensation: form.body_sensation || null,
        thought: form.thought || null,
        need: form.need || null,
        response: form.response || null,
        regulation_strategy: form.regulation_strategy || null,
        strategy_helped: form.strategy_helped || null,
        note: form.note || null,
      }
      await api.emotions.create(payload)
      setForm((prev) => ({
        ...prev,
        intensity: 5,
        trigger_type: '',
        trigger_note: '',
        secondary_emotions: '',
        body_sensation: '',
        thought: '',
        need: '',
        response: '',
        regulation_strategy: '',
        strategy_helped: '',
        note: '',
      }))
      setStatusMessage('Registro emocional guardado')
      const todayValue = getLocalDateValue()
      if (selectedDate !== todayValue) {
        setSelectedDate(todayValue)
      } else {
        await loadData()
      }
    } catch (err) {
      console.error('Failed to create emotion:', err)
      setError(err instanceof Error ? err.message : 'No se pudo guardar el registro')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (entryId: string) => {
    if (!window.confirm('¿Eliminar este registro emocional?')) return
    try {
      await api.emotions.delete(entryId)
      setEntries((prev) => prev.filter((entry) => entry.id !== entryId))
      setStatusMessage('Registro eliminado')
      api.emotions.weeklySummary().then(setSummary).catch(() => {})
    } catch (err) {
      console.error('Failed to delete emotion:', err)
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el registro')
    }
  }

  const topTriggers = Object.entries(summary.by_trigger).slice(0, 4)
  const todayValue = getLocalDateValue()
  const isSelectedToday = selectedDate === todayValue
  const timelineTitle = isSelectedToday ? 'Timeline de hoy' : `Timeline del ${formatDateLabel(selectedDate)}`

  if (loading) {
    return (
      <div>
        <Header title="Emotions" subtitle="Cargando diario emocional..." />
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
          <SkeletonStats />
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_1fr] gap-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PullToRefreshIndicator pull={ptr.pull} refreshing={ptr.refreshing} progress={ptr.progress} />
      <Header title="Emotions" subtitle="Registra cambios de ánimo y detecta patrones" />

      <main className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <InsightCard icon={<BookOpen className="w-4 h-4" />} label="Registros semana" value={summary.total_entries.toString()} tone="text-accent bg-accent-soft" />
          <InsightCard icon={<Gauge className="w-4 h-4" />} label="Intensidad prom." value={`${summary.average_intensity}/10`} tone="text-[var(--info)] bg-info-soft" />
          <InsightCard icon={<Sparkles className="w-4 h-4" />} label="Emoción dominante" value={summary.dominant_emotion ? labelForEmotion(summary.dominant_emotion) : 'Sin datos'} tone="text-[var(--success)] bg-success-soft" />
          <InsightCard icon={<TrendingUp className="w-4 h-4" />} label="Gatillante común" value={summary.dominant_trigger || 'Sin datos'} tone="text-[var(--warning)] bg-warning-soft" />
        </div>

        {error && (
          <div role="alert" className="p-3 rounded-xl border border-danger-soft bg-danger-soft/40 text-sm text-[var(--danger)]">
            {error}
          </div>
        )}
        <p className="sr-only" aria-live="polite" aria-atomic="true">{statusMessage}</p>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,430px)_1fr] gap-5 items-start">
          <form onSubmit={handleSubmit} className="bg-bg-elevated border border-border rounded-2xl p-4 md:p-5 space-y-5 lg:sticky lg:top-28">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-text">Registrar ahora</h3>
                <p className="text-sm text-text-muted mt-1">Captura la emoción mientras está fresca.</p>
              </div>
              <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold', valenceTone)}>
                {labelForValence(form.valence)}
              </span>
            </div>

            <fieldset>
              <legend className="text-sm font-medium text-text mb-2">Emoción principal</legend>
              <div className="flex flex-wrap gap-2">
                {emotionOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleEmotionSelect(option.value)}
                    aria-pressed={form.emotion === option.value}
                    className={cn(
                      'px-3 py-2 rounded-full border text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                      form.emotion === option.value ? option.color : 'border-border text-text-muted hover:text-text hover:bg-bg-muted'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-text-subtle mt-2">Seleccionada: {selectedEmotion?.label}</p>
            </fieldset>

            <div>
              <label htmlFor="emotion-intensity" className="flex items-center justify-between text-sm font-medium text-text mb-2">
                Intensidad
                <span className="font-mono text-accent">{form.intensity}/10</span>
              </label>
              <input
                id="emotion-intensity"
                type="range"
                min="1"
                max="10"
                value={form.intensity}
                onChange={(e) => setForm((prev) => ({ ...prev, intensity: Number(e.target.value) }))}
                className="w-full accent-[var(--accent)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="emotion-valence" className="block text-xs font-medium text-text-subtle mb-1">Valencia</label>
                <select id="emotion-valence" value={form.valence} onChange={(e) => setForm((prev) => ({ ...prev, valence: e.target.value as EmotionValence }))} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg-elevated text-text focus:outline-none focus:ring-2 focus:ring-accent">
                  <option value="pleasant">Agradable</option>
                  <option value="neutral">Neutra</option>
                  <option value="unpleasant">Desagradable</option>
                </select>
              </div>
              <div>
                <label htmlFor="emotion-energy" className="block text-xs font-medium text-text-subtle mb-1">Energía</label>
                <select id="emotion-energy" value={form.energy} onChange={(e) => setForm((prev) => ({ ...prev, energy: e.target.value as EmotionEnergy }))} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg-elevated text-text focus:outline-none focus:ring-2 focus:ring-accent">
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="emotion-trigger" className="block text-sm font-medium text-text mb-2">Gatillante</label>
              <select id="emotion-trigger" value={form.trigger_type} onChange={(e) => setForm((prev) => ({ ...prev, trigger_type: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg-elevated text-text focus:outline-none focus:ring-2 focus:ring-accent">
                <option value="">Sin clasificar</option>
                {triggerOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="trigger-note" className="block text-sm font-medium text-text mb-1">¿Qué pasó?</label>
              <textarea id="trigger-note" value={form.trigger_note} onChange={(e) => setForm((prev) => ({ ...prev, trigger_note: e.target.value }))} rows={2} maxLength={1000} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg-elevated text-text focus:outline-none focus:ring-2 focus:ring-accent resize-none" placeholder="Ej: cambió mi ánimo después de una conversación..." />
            </div>

            <details className="group rounded-xl border border-border bg-bg/40 p-3">
              <summary className="cursor-pointer text-sm font-medium text-text marker:text-text-subtle">Reflexión profunda opcional</summary>
              <div className="mt-4 space-y-3">
                <TextField id="secondary-emotions" label="Emociones secundarias" value={form.secondary_emotions} onChange={(value) => setForm((prev) => ({ ...prev, secondary_emotions: value }))} placeholder="Ej: culpa, alivio, miedo" />
                <TextField id="body-sensation" label="Cuerpo" value={form.body_sensation} onChange={(value) => setForm((prev) => ({ ...prev, body_sensation: value }))} placeholder="Ej: presión en el pecho, cansancio..." />
                <TextField id="thought" label="Pensamiento" value={form.thought} onChange={(value) => setForm((prev) => ({ ...prev, thought: value }))} placeholder="¿Qué historia me conté?" />
                <TextField id="need" label="Necesidad" value={form.need} onChange={(value) => setForm((prev) => ({ ...prev, need: value }))} placeholder="Claridad, descanso, conexión, seguridad..." />
                <TextField id="response" label="Respuesta" value={form.response} onChange={(value) => setForm((prev) => ({ ...prev, response: value }))} placeholder="¿Cómo reaccioné?" />
                <div>
                  <label htmlFor="regulation-strategy" className="block text-xs font-medium text-text-subtle mb-1">Estrategia de regulación</label>
                  <select id="regulation-strategy" value={form.regulation_strategy} onChange={(e) => setForm((prev) => ({ ...prev, regulation_strategy: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg-elevated text-text focus:outline-none focus:ring-2 focus:ring-accent">
                    <option value="">No usé estrategia</option>
                    {regulationOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
                <TextField id="note" label="Aprendizaje" value={form.note} onChange={(value) => setForm((prev) => ({ ...prev, note: value }))} placeholder="¿Qué aprendí de este momento?" />
              </div>
            </details>

            <button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-accent-fg text-sm font-semibold hover:bg-[var(--accent-hover)] disabled:opacity-60 transition-colors">
              {saving ? <span className="w-4 h-4 border-2 border-accent-fg/40 border-t-accent-fg rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
              Guardar registro
            </button>
          </form>

          <section aria-labelledby="emotion-timeline-title" className="space-y-4">
            <div className="bg-bg-elevated border border-border rounded-2xl p-4 md:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
                <div>
                  <h3 id="emotion-timeline-title" className="text-base font-semibold text-text">{timelineTitle}</h3>
                  <p className="text-sm text-text-muted mt-1">{entries.length} registro{entries.length !== 1 ? 's' : ''} emocional{entries.length !== 1 ? 'es' : ''}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDate((date) => addDaysToDateValue(date, -1))}
                    className="touch-target inline-flex items-center justify-center rounded-lg border border-border text-text-muted hover:text-text hover:bg-bg-muted transition-colors"
                    aria-label="Ver registros del día anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <label className="relative inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-bg text-sm text-text">
                    <CalendarDays className="w-4 h-4 text-text-subtle" aria-hidden="true" />
                    <span className="sr-only">Fecha del historial emocional</span>
                    <input
                      type="date"
                      value={selectedDate}
                      max={todayValue}
                      onChange={(e) => setSelectedDate(e.target.value || todayValue)}
                      className="bg-transparent text-sm text-text focus:outline-none"
                      aria-label="Fecha del historial emocional"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setSelectedDate((date) => addDaysToDateValue(date, 1))}
                    disabled={isSelectedToday}
                    className="touch-target inline-flex items-center justify-center rounded-lg border border-border text-text-muted hover:text-text hover:bg-bg-muted disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-muted transition-colors"
                    aria-label="Ver registros del día siguiente"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  {!isSelectedToday && (
                    <button
                      type="button"
                      onClick={() => setSelectedDate(todayValue)}
                      className="px-3 py-2 rounded-lg bg-accent-soft text-accent text-sm font-semibold hover:bg-accent-soft/80 transition-colors"
                    >
                      Hoy
                    </button>
                  )}
                </div>
              </div>

              {timelineLoading ? (
                <div className="py-8 text-center text-sm text-text-muted">Cargando registros...</div>
              ) : entries.length === 0 ? (
                <EmptyState icon={<Brain className="w-8 h-8" />} title={isSelectedToday ? 'Sin registros hoy' : 'Sin registros en esta fecha'} description={isSelectedToday ? 'Registra una emoción para empezar a encontrar patrones reales de tu día.' : 'Puedes cambiar de día para revisar otros registros emocionales.'} />
              ) : (
                <motion.ol className="space-y-3" variants={listVariants} initial="hidden" animate="show">
                  {entries.map((entry) => (
                    <EmotionEntryItem key={entry.id} entry={entry} onDelete={handleDelete} />
                  ))}
                </motion.ol>
              )}
            </div>

            <div className="bg-bg-elevated border border-border rounded-2xl p-4 md:p-5">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-accent" />
                <h3 className="text-base font-semibold text-text">Patrones de la semana</h3>
              </div>
              {topTriggers.length === 0 ? (
                <p className="text-sm text-text-muted">Aún no hay suficientes gatillantes para detectar patrones.</p>
              ) : (
                <div className="space-y-3">
                  {topTriggers.map(([trigger, count]) => (
                    <div key={trigger} className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-text capitalize">{trigger}</span>
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <div className="h-2 flex-1 rounded-full bg-bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(12, (count / Math.max(summary.total_entries, 1)) * 100)}%` }} />
                        </div>
                        <span className="text-xs font-mono text-text-subtle">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

function TextField({ id, label, value, onChange, placeholder }: { id: string; label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-text-subtle mb-1">{label}</label>
      <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} rows={2} maxLength={1000} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg-elevated text-text focus:outline-none focus:ring-2 focus:ring-accent resize-none" placeholder={placeholder} />
    </div>
  )
}

function EmotionEntryItem({ entry, onDelete }: { entry: EmotionEntry; onDelete: (id: string) => void }) {
  const valenceClass = entry.valence === 'pleasant'
    ? 'bg-success-soft text-[var(--success)]'
    : entry.valence === 'unpleasant'
      ? 'bg-warning-soft text-[var(--warning)]'
      : 'bg-bg-muted text-text-muted'

  return (
    <motion.li variants={itemVariants} className="relative pl-6">
      <span className="absolute left-1.5 top-4 bottom-[-0.75rem] w-px bg-border" aria-hidden="true" />
      <span className="absolute left-0 top-4 w-3 h-3 rounded-full bg-accent shadow-[var(--shadow-glow)]" aria-hidden="true" />
      <article className="bg-bg border border-border rounded-xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-semibold text-text">{labelForEmotion(entry.emotion)}</h4>
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', valenceClass)}>{labelForValence(entry.valence)}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-accent-soft text-accent">{entry.intensity}/10</span>
            </div>
            <p className="text-xs text-text-subtle mt-1">{formatEntryTime(entry.occurred_at)}{entry.trigger_type ? ` · ${entry.trigger_type}` : ''}</p>
          </div>
          <button type="button" onClick={() => onDelete(entry.id)} className="touch-target -m-2 text-text-subtle hover:text-[var(--danger)] transition-colors" aria-label={`Eliminar registro de ${labelForEmotion(entry.emotion)}`}>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {(entry.trigger_note || entry.note || entry.need || entry.regulation_strategy) && (
          <div className="mt-3 space-y-2 text-sm text-text-muted">
            {entry.trigger_note && <p>{entry.trigger_note}</p>}
            {entry.need && <p><span className="font-medium text-text">Necesidad:</span> {entry.need}</p>}
            {entry.regulation_strategy && <p><span className="font-medium text-text">Regulación:</span> {entry.regulation_strategy}</p>}
            {entry.note && <p><span className="font-medium text-text">Aprendizaje:</span> {entry.note}</p>}
          </div>
        )}

        {(entry.secondary_emotions?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {entry.secondary_emotions.map((emotion) => (
              <span key={emotion} className="px-2 py-0.5 rounded-full text-xs bg-bg-muted text-text-muted">{emotion}</span>
            ))}
          </div>
        )}
      </article>
    </motion.li>
  )
}
