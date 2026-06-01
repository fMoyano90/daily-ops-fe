'use client'

import { ReactNode, useCallback, useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Gauge, Moon, Pencil, Plus, RefreshCw, Sparkles, Trash2, Waves } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { EmptyState } from '@/components/shared/EmptyState'
import { SkeletonCard, SkeletonStats } from '@/components/shared/Skeleton'
import { PullToRefreshIndicator } from '@/components/shared/PullToRefreshIndicator'
import { SleepLogForm } from '@/components/sleep/SleepLogForm'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { SleepLog, SleepLogInput, SleepLogSummary } from '@/lib/types'

const defaultSummary: SleepLogSummary = {
  period_start: '',
  period_end: '',
  total_logs: 0,
  days_with_log: 0,
  days_without_log: 0,
  avg_hours_slept: null,
  avg_sleep_quality: null,
  avg_wakeups: null,
  avg_tiredness_on_wake: null,
  avg_tiredness_during_day: null,
  hours_trend: 'stable',
  quality_trend: 'stable',
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

function formatTime(value?: string | null) {
  return value ? value.slice(0, 5) : '--:--'
}

function trendLabel(value: SleepLogSummary['hours_trend']) {
  if (value === 'up') return 'subiendo'
  if (value === 'down') return 'bajando'
  return 'estable'
}

async function getLogByDateOrNull(date: string) {
  try {
    return await api.sleepLogs.getByDate(date)
  } catch (err) {
    if (err instanceof Error && err.message.toLowerCase().includes('not found')) return null
    throw err
  }
}

export default function SleepPage() {
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateValue())
  const [selectedLog, setSelectedLog] = useState<SleepLog | null>(null)
  const [recentLogs, setRecentLogs] = useState<SleepLog[]>([])
  const [summary, setSummary] = useState<SleepLogSummary>(defaultSummary)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [editingSleepLog, setEditingSleepLog] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setError(null)
    setTimelineLoading(true)
    try {
      const [dateLog, logs, weeklySummary] = await Promise.all([
        getLogByDateOrNull(selectedDate),
        api.sleepLogs.list({ limit: '30' }),
        api.sleepLogs.weeklySummary().catch(() => defaultSummary),
      ])
      setSelectedLog(dateLog)
      setRecentLogs(logs)
      setSummary(weeklySummary)
    } catch (err) {
      console.error('Failed to load sleep logs:', err)
      setError(err instanceof Error ? err.message : 'No se pudo cargar el registro del sueño')
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

  useEffect(() => {
    setEditingSleepLog(false)
  }, [selectedDate])

  const ptr = usePullToRefresh({ onRefresh: loadData })
  const todayValue = getLocalDateValue()
  const isSelectedToday = selectedDate === todayValue
  const formTitle = isSelectedToday ? 'Registro de hoy' : `Registro del ${formatDateLabel(selectedDate)}`

  const handleSave = async (data: SleepLogInput) => {
    setSaving(true)
    setError(null)
    setStatusMessage('')
    try {
      const payload = { ...data, date: data.date || selectedDate }
      const saved = selectedLog
        ? await api.sleepLogs.update(selectedLog.id, payload)
        : await api.sleepLogs.create(payload)
      setSelectedDate(saved.date)
      setSelectedLog(saved)
      setEditingSleepLog(false)
      setStatusMessage(selectedLog ? 'Registro del sueño actualizado' : 'Registro del sueño guardado')
      await loadData()
    } catch (err) {
      console.error('Failed to save sleep log:', err)
      setError(err instanceof Error ? err.message : 'No se pudo guardar el registro')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (log: SleepLog) => {
    if (!window.confirm(`¿Eliminar el registro de sueño del ${formatDateLabel(log.date)}?`)) return
    try {
      await api.sleepLogs.delete(log.id)
      if (selectedLog?.id === log.id) setSelectedLog(null)
      setRecentLogs((prev) => prev.filter((item) => item.id !== log.id))
      setStatusMessage('Registro eliminado')
      api.sleepLogs.weeklySummary().then(setSummary).catch(() => {})
    } catch (err) {
      console.error('Failed to delete sleep log:', err)
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el registro')
    }
  }

  if (loading) {
    return (
      <div>
        <Header title="Sueño" subtitle="Cargando registro del sueño..." />
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

  return (
    <div>
      <PullToRefreshIndicator pull={ptr.pull} refreshing={ptr.refreshing} progress={ptr.progress} />
      <Header title="Sueño" subtitle="Registra sueño, energía y cansancio diario" />

      <main className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <InsightCard icon={<Moon className="w-4 h-4" />} label="Promedio sueño" value={summary.avg_hours_slept != null ? `${summary.avg_hours_slept}h` : 'Sin datos'} tone="text-[var(--info)] bg-info-soft" />
          <InsightCard icon={<Sparkles className="w-4 h-4" />} label="Calidad prom." value={summary.avg_sleep_quality != null ? `${summary.avg_sleep_quality}/10` : 'Sin datos'} tone="text-accent bg-accent-soft" />
          <InsightCard icon={<Waves className="w-4 h-4" />} label="Despertares prom." value={summary.avg_wakeups != null ? summary.avg_wakeups.toString() : 'Sin datos'} tone="text-[var(--warning)] bg-warning-soft" />
          <InsightCard icon={<Gauge className="w-4 h-4" />} label="Tendencia calidad" value={trendLabel(summary.quality_trend)} tone="text-[var(--success)] bg-success-soft" />
        </div>

        {error && (
          <div role="alert" className="p-3 rounded-xl border border-danger-soft bg-danger-soft/40 text-sm text-[var(--danger)]">
            {error}
          </div>
        )}
        <p className="sr-only" aria-live="polite" aria-atomic="true">{statusMessage}</p>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,430px)_1fr] gap-5 items-start">
          <section aria-labelledby="sleep-form-title" className="bg-bg-elevated border border-border rounded-2xl p-4 md:p-5 lg:sticky lg:top-28">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 id="sleep-form-title" className="text-base font-semibold text-text">{formTitle}</h2>
                <p className="text-sm text-text-muted mt-1">{selectedLog ? 'Edita el registro existente.' : 'Aún no hay registro para esta fecha.'}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold', selectedLog ? 'bg-success-soft text-[var(--success)]' : 'bg-bg-muted text-text-muted')}>
                  {selectedLog ? 'Guardado' : 'Pendiente'}
                </span>
                {selectedLog && (
                  <button
                    type="button"
                    onClick={() => setEditingSleepLog((value) => !value)}
                    aria-expanded={editingSleepLog}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-bg-muted hover:text-text"
                  >
                    <Pencil className="w-4 h-4" aria-hidden="true" />
                    {editingSleepLog ? 'Cerrar' : 'Editar'}
                  </button>
                )}
              </div>
            </div>

            {selectedLog && !editingSleepLog ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-bg p-3 text-center text-xs text-text-muted">
                  <span><strong className="block text-sm text-text">{selectedLog.hours_slept ?? '--'}h</strong>Sueño</span>
                  <span><strong className="block text-sm text-accent">{selectedLog.sleep_quality ?? '--'}/10</strong>Calidad</span>
                  <span><strong className="block text-sm text-text">{formatTime(selectedLog.bedtime)} → {formatTime(selectedLog.wake_time)}</strong>Horario</span>
                  <span><strong className="block text-sm text-text">{selectedLog.wakeups ?? 0}</strong>Despertares</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-text-muted">
                  <span className="rounded-full bg-bg px-2.5 py-1 border border-border">Cansancio al despertar: {selectedLog.tiredness_on_wake ?? '--'}/10</span>
                  <span className="rounded-full bg-bg px-2.5 py-1 border border-border">Cansancio día: {selectedLog.tiredness_during_day ?? '--'}/10</span>
                </div>
                {selectedLog.note && <p className="rounded-xl border border-border bg-bg p-3 text-sm text-text-muted">{selectedLog.note}</p>}
              </div>
            ) : (
              <SleepLogForm key={selectedLog?.id ?? selectedDate} date={selectedDate} initialLog={selectedLog} saving={saving} onSubmit={handleSave} />
            )}
          </section>

          <section aria-labelledby="sleep-history-title" className="space-y-4">
            <div className="bg-bg-elevated border border-border rounded-2xl p-4 md:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
                <div>
                  <h2 id="sleep-history-title" className="text-base font-semibold text-text">Historial de sueño</h2>
                  <p className="text-sm text-text-muted mt-1">{recentLogs.length} registro{recentLogs.length !== 1 ? 's' : ''} recientes</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDate((date) => addDaysToDateValue(date, -1))}
                    className="touch-target inline-flex items-center justify-center rounded-lg border border-border text-text-muted hover:text-text hover:bg-bg-muted transition-colors"
                    aria-label="Ver registro del día anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <label className="relative inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-bg text-sm text-text">
                    <CalendarDays className="w-4 h-4 text-text-subtle" aria-hidden="true" />
                    <span className="sr-only">Fecha del registro de sueño</span>
                    <input
                      type="date"
                      value={selectedDate}
                      max={todayValue}
                      onChange={(e) => setSelectedDate(e.target.value || todayValue)}
                      className="bg-transparent text-sm text-text focus:outline-none"
                      aria-label="Fecha del registro de sueño"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setSelectedDate((date) => addDaysToDateValue(date, 1))}
                    disabled={isSelectedToday}
                    className="touch-target inline-flex items-center justify-center rounded-lg border border-border text-text-muted hover:text-text hover:bg-bg-muted disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-muted transition-colors"
                    aria-label="Ver registro del día siguiente"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  {!isSelectedToday && (
                    <button type="button" onClick={() => setSelectedDate(todayValue)} className="px-3 py-2 rounded-lg bg-accent-soft text-accent text-sm font-semibold hover:bg-accent-soft/80 transition-colors">
                      Hoy
                    </button>
                  )}
                  <button type="button" onClick={loadData} className="touch-target inline-flex items-center justify-center rounded-lg border border-border text-text-muted hover:text-text hover:bg-bg-muted transition-colors" aria-label="Recargar registros">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {timelineLoading ? (
                <div className="py-8 text-center text-sm text-text-muted">Cargando registros...</div>
              ) : recentLogs.length === 0 ? (
                <EmptyState icon={<Moon className="w-8 h-8" />} title="Sin registros aún" description="Guarda tu primer registro para empezar a ver patrones de sueño." />
              ) : (
                <motion.ol className="space-y-3" variants={listVariants} initial="hidden" animate="show">
                  {recentLogs.map((log) => (
                    <SleepLogItem key={log.id} log={log} selected={log.date === selectedDate} onSelect={() => setSelectedDate(log.date)} onDelete={handleDelete} />
                  ))}
                </motion.ol>
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
      <p className="text-xl font-bold text-text truncate capitalize">{value}</p>
    </div>
  )
}

function SleepLogItem({ log, selected, onSelect, onDelete }: { log: SleepLog; selected: boolean; onSelect: () => void; onDelete: (log: SleepLog) => void }) {
  return (
    <motion.li variants={itemVariants}>
      <article className={cn('border rounded-xl p-4 transition-colors', selected ? 'bg-accent-soft border-accent/40' : 'bg-bg border-border')}>
        <div className="flex items-start justify-between gap-3">
          <button type="button" onClick={onSelect} className="min-w-0 text-left flex-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-text capitalize">{formatDateLabel(log.date)}</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-info-soft text-[var(--info)]">{log.hours_slept ?? '--'}h</span>
              {log.sleep_quality != null && <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-accent-soft text-accent">{log.sleep_quality}/10</span>}
            </div>
            <p className="text-xs text-text-subtle mt-1">
              {formatTime(log.bedtime)} → {formatTime(log.wake_time)} · {log.wakeups ?? 0} despertar{log.wakeups === 1 ? '' : 'es'}
            </p>
          </button>
          <button type="button" onClick={() => onDelete(log)} className="touch-target -m-2 text-text-subtle hover:text-[var(--danger)] transition-colors" aria-label={`Eliminar registro de ${formatDateLabel(log.date)}`}>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-text-muted">
          <span className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Cansancio despertar: {log.tiredness_on_wake ?? '--'}/10</span>
          <span className="inline-flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Cansancio día: {log.tiredness_during_day ?? '--'}/10</span>
        </div>

        {log.note && <p className="mt-3 text-sm text-text-muted">{log.note}</p>}
      </article>
    </motion.li>
  )
}
