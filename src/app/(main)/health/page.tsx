'use client'

import { FormEvent, ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Activity, AlertTriangle, Bell, ClipboardCheck, HeartPulse, ListChecks, Pencil, Plus, RefreshCw, Sparkles, Thermometer, Trash2 } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { EmptyState } from '@/components/shared/EmptyState'
import { Modal } from '@/components/shared/Modal'
import { PullToRefreshIndicator } from '@/components/shared/PullToRefreshIndicator'
import { SkeletonCard, SkeletonStats } from '@/components/shared/Skeleton'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { ConditionCategory, ConditionStatus, EpisodeType, GuidelineKind, HealthCondition, HealthConditionInput, HealthGuideline, HealthReminder, SicknessEpisode, SicknessEpisodeInput, SicknessEpisodeSummary } from '@/lib/types'

const conditionCategories: Array<{ value: ConditionCategory; label: string }> = [
  { value: 'cardiovascular', label: 'Cardiovascular' },
  { value: 'metabolic', label: 'Metabólica' },
  { value: 'dental', label: 'Dental' },
  { value: 'mental', label: 'Mental' },
  { value: 'respiratory', label: 'Respiratoria' },
  { value: 'other', label: 'Otra' },
]

const conditionStatuses: Array<{ value: ConditionStatus; label: string }> = [
  { value: 'active', label: 'Activa' },
  { value: 'monitoring', label: 'En monitoreo' },
  { value: 'resolved', label: 'Resuelta' },
]

const episodeTypes: Array<{ value: EpisodeType; label: string }> = [
  { value: 'cold', label: 'Resfrío' },
  { value: 'flu', label: 'Gripe' },
  { value: 'physical', label: 'Físico' },
  { value: 'mental', label: 'Mental' },
  { value: 'other', label: 'Otro' },
]

const guidelineLabels: Record<GuidelineKind, string> = {
  avoid: 'Qué evitar',
  helps: 'Qué me hace bien',
  action: 'Plan de acción',
}

const defaultSummary: SicknessEpisodeSummary = {
  period_start: '',
  period_end: '',
  total: 0,
  by_type: {},
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

function formatDateLabel(value?: string | null) {
  if (!value) return 'Sin fecha'
  return parseDateValue(value).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
}

function typeLabel(value: EpisodeType | string) {
  return episodeTypes.find((item) => item.value === value)?.label ?? value
}

function categoryLabel(value: ConditionCategory) {
  return conditionCategories.find((item) => item.value === value)?.label ?? value
}

function statusLabel(value: ConditionStatus) {
  return conditionStatuses.find((item) => item.value === value)?.label ?? value
}

function linesToText(items: string[]) {
  return items.join('\n')
}

function textToLines(value: string) {
  return value.split('\n').map((item) => item.trim()).filter(Boolean)
}

function optionalText(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

export default function HealthPage() {
  const [conditions, setConditions] = useState<HealthCondition[]>([])
  const [episodes, setEpisodes] = useState<SicknessEpisode[]>([])
  const [summary, setSummary] = useState<SicknessEpisodeSummary>(defaultSummary)
  const [loading, setLoading] = useState(true)
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState('')
  const [conditionModal, setConditionModal] = useState<HealthCondition | 'new' | null>(null)
  const [guidelineModal, setGuidelineModal] = useState<{ condition: HealthCondition; guideline?: HealthGuideline } | null>(null)
  const [reminderModal, setReminderModal] = useState<{ condition: HealthCondition; reminder?: HealthReminder } | null>(null)
  const [episodeModal, setEpisodeModal] = useState<SicknessEpisode | 'new' | null>(null)
  const [suggestionModal, setSuggestionModal] = useState<HealthCondition | null>(null)
  const [suggestionDraft, setSuggestionDraft] = useState({ avoid: '', helps: '', action_plan: '' })
  const loadRequestIdRef = useRef(0)

  const loadData = useCallback(async () => {
    const requestId = loadRequestIdRef.current + 1
    loadRequestIdRef.current = requestId
    setError(null)
    setTimelineLoading(true)
    try {
      const [loadedConditions, loadedEpisodes, loadedSummary] = await Promise.all([
        api.health.conditions.list(),
        api.health.episodes.list({ limit: '30' }),
        api.health.episodes.summary().catch(() => defaultSummary),
      ])
      if (requestId !== loadRequestIdRef.current) return
      setConditions(loadedConditions)
      setEpisodes(loadedEpisodes)
      setSummary(loadedSummary)
    } catch (err) {
      if (requestId !== loadRequestIdRef.current) return
      console.error('Failed to load health data:', err)
      setError(err instanceof Error ? err.message : 'No se pudo cargar salud')
    } finally {
      if (requestId === loadRequestIdRef.current) {
        setLoading(false)
        setTimelineLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadData])

  const ptr = usePullToRefresh({ onRefresh: loadData })
  const activeConditions = conditions.filter((condition) => condition.status !== 'resolved').length
  const pendingActions = conditions.flatMap((condition) => condition.guidelines).filter((item) => item.kind === 'action' && !item.is_done).length
  const activeReminders = conditions.flatMap((condition) => condition.reminders).filter((item) => item.is_active).length

  const conditionName = useCallback((conditionId?: string | null) => {
    if (!conditionId) return null
    return conditions.find((condition) => condition.id === conditionId)?.name ?? null
  }, [conditions])

  const saveCondition = async (data: HealthConditionInput) => {
    setSaving(true)
    setError(null)
    try {
      if (conditionModal && conditionModal !== 'new') {
        await api.health.conditions.update(conditionModal.id, data)
        setStatusMessage('Condición actualizada')
      } else {
        await api.health.conditions.create(data)
        setStatusMessage('Condición creada')
      }
      setConditionModal(null)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la condición')
    } finally {
      setSaving(false)
    }
  }

  const deleteCondition = async (condition: HealthCondition) => {
    if (!window.confirm(`¿Eliminar ${condition.name}? Se borrarán sus cuidados asociados.`)) return
    try {
      await api.health.conditions.delete(condition.id)
      setStatusMessage('Condición eliminada')
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la condición')
    }
  }

  const saveGuideline = async (data: { kind: GuidelineKind; text: string; is_done?: boolean }) => {
    if (!guidelineModal) return
    setSaving(true)
    setError(null)
    try {
      if (guidelineModal.guideline) {
        await api.health.guidelines.update(guidelineModal.guideline.id, data)
        setStatusMessage('Cuidado actualizado')
      } else {
        await api.health.guidelines.create(guidelineModal.condition.id, data)
        setStatusMessage('Cuidado agregado')
      }
      setGuidelineModal(null)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el cuidado')
    } finally {
      setSaving(false)
    }
  }

  const toggleGuideline = async (guideline: HealthGuideline) => {
    try {
      await api.health.guidelines.update(guideline.id, { is_done: !guideline.is_done })
      setConditions((prev) => prev.map((condition) => ({
        ...condition,
        guidelines: condition.guidelines.map((item) => item.id === guideline.id ? { ...item, is_done: !item.is_done } : item),
      })))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el plan')
    }
  }

  const deleteGuideline = async (guideline: HealthGuideline) => {
    if (!window.confirm('¿Eliminar este cuidado?')) return
    try {
      await api.health.guidelines.delete(guideline.id)
      setStatusMessage('Cuidado eliminado')
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el cuidado')
    }
  }

  const saveReminder = async (data: { text: string; time_of_day?: string | null; frequency?: string; is_active?: boolean }) => {
    if (!reminderModal) return
    setSaving(true)
    setError(null)
    try {
      if (reminderModal.reminder) {
        await api.health.reminders.update(reminderModal.reminder.id, data)
        setStatusMessage('Recordatorio actualizado')
      } else {
        await api.health.reminders.create(reminderModal.condition.id, data)
        setStatusMessage('Recordatorio agregado')
      }
      setReminderModal(null)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el recordatorio')
    } finally {
      setSaving(false)
    }
  }

  const toggleReminder = async (reminder: HealthReminder) => {
    try {
      await api.health.reminders.update(reminder.id, { is_active: !reminder.is_active })
      setConditions((prev) => prev.map((condition) => ({
        ...condition,
        reminders: condition.reminders.map((item) => item.id === reminder.id ? { ...item, is_active: !item.is_active } : item),
      })))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el recordatorio')
    }
  }

  const deleteReminder = async (reminder: HealthReminder) => {
    if (!window.confirm('¿Eliminar este recordatorio?')) return
    try {
      await api.health.reminders.delete(reminder.id)
      setStatusMessage('Recordatorio eliminado')
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el recordatorio')
    }
  }

  const requestSuggestion = async (condition: HealthCondition) => {
    setSuggestionModal(condition)
    setSuggestionDraft({ avoid: '', helps: '', action_plan: '' })
    setSuggesting(true)
    setError(null)
    try {
      const suggestion = await api.health.suggest({ name: condition.name, category: condition.category })
      setSuggestionDraft({
        avoid: linesToText(suggestion.avoid),
        helps: linesToText(suggestion.helps),
        action_plan: linesToText(suggestion.action_plan),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar la sugerencia')
    } finally {
      setSuggesting(false)
    }
  }

  const saveSuggestion = async () => {
    if (!suggestionModal) return
    setSaving(true)
    setError(null)
    try {
      const groups: Array<{ kind: GuidelineKind; items: string[] }> = [
        { kind: 'avoid', items: textToLines(suggestionDraft.avoid) },
        { kind: 'helps', items: textToLines(suggestionDraft.helps) },
        { kind: 'action', items: textToLines(suggestionDraft.action_plan) },
      ]
      for (const group of groups) {
        for (const text of group.items) {
          await api.health.guidelines.create(suggestionModal.id, { kind: group.kind, text })
        }
      }
      setSuggestionModal(null)
      setStatusMessage('Sugerencias guardadas como cuidados')
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron guardar las sugerencias')
    } finally {
      setSaving(false)
    }
  }

  const saveEpisode = async (data: SicknessEpisodeInput) => {
    setSaving(true)
    setError(null)
    try {
      if (episodeModal && episodeModal !== 'new') {
        await api.health.episodes.update(episodeModal.id, data)
        setStatusMessage('Episodio actualizado')
      } else {
        await api.health.episodes.create(data)
        setStatusMessage('Episodio registrado')
      }
      setEpisodeModal(null)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el episodio')
    } finally {
      setSaving(false)
    }
  }

  const deleteEpisode = async (episode: SicknessEpisode) => {
    if (!window.confirm(`¿Eliminar el episodio "${episode.title}"?`)) return
    try {
      await api.health.episodes.delete(episode.id)
      setStatusMessage('Episodio eliminado')
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el episodio')
    }
  }

  if (loading) {
    return (
      <div>
        <Header title="Salud" subtitle="Cargando condiciones y episodios..." />
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
          <SkeletonStats />
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-5">
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
      <Header title="Salud" subtitle="Registra condiciones, cuidados y episodios de malestar" />

      <main className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <InsightCard icon={<HeartPulse className="w-4 h-4" />} label="Condiciones activas" value={activeConditions.toString()} tone="text-accent bg-accent-soft" />
          <InsightCard icon={<ClipboardCheck className="w-4 h-4" />} label="Acciones pendientes" value={pendingActions.toString()} tone="text-[var(--warning)] bg-warning-soft" />
          <InsightCard icon={<Bell className="w-4 h-4" />} label="Recordatorios activos" value={activeReminders.toString()} tone="text-[var(--info)] bg-info-soft" />
          <InsightCard icon={<Thermometer className="w-4 h-4" />} label="Episodios 30 días" value={summary.total.toString()} tone="text-[var(--danger)] bg-danger-soft" />
        </div>

        {error && <div role="alert" className="p-3 rounded-xl border border-danger-soft bg-danger-soft/40 text-sm text-[var(--danger)]">{error}</div>}
        <p className="sr-only" aria-live="polite" aria-atomic="true">{statusMessage}</p>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-5 items-start">
          <section aria-labelledby="conditions-title" className="space-y-4">
            <div className="bg-bg-elevated border border-border rounded-2xl p-4 md:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
                <div>
                  <h2 id="conditions-title" className="text-base font-semibold text-text">Condiciones crónicas</h2>
                  <p className="text-sm text-text-muted mt-1">Cuidados in-app: evitar, ayuda, plan de acción y recordatorios.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={loadData} className="touch-target inline-flex items-center justify-center rounded-lg border border-border text-text-muted hover:text-text hover:bg-bg-muted transition-colors" aria-label="Recargar salud">
                    <RefreshCw className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => setConditionModal('new')} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-accent text-accent-fg text-sm font-semibold hover:bg-[var(--accent-hover)] transition-colors">
                    <Plus className="w-4 h-4" /> Nueva condición
                  </button>
                </div>
              </div>

              {conditions.length === 0 ? (
                <EmptyState icon={<HeartPulse className="w-8 h-8" />} title="Sin condiciones" description="Agrega tu primera condición para organizar sus cuidados." />
              ) : (
                <motion.div className="space-y-4" variants={listVariants} initial="hidden" animate="show">
                  {conditions.map((condition) => (
                    <ConditionCard
                      key={condition.id}
                      condition={condition}
                      onEdit={() => setConditionModal(condition)}
                      onDelete={() => deleteCondition(condition)}
                      onSuggest={() => requestSuggestion(condition)}
                      onAddGuideline={() => setGuidelineModal({ condition })}
                      onEditGuideline={(guideline) => setGuidelineModal({ condition, guideline })}
                      onToggleGuideline={toggleGuideline}
                      onDeleteGuideline={deleteGuideline}
                      onAddReminder={() => setReminderModal({ condition })}
                      onEditReminder={(reminder) => setReminderModal({ condition, reminder })}
                      onToggleReminder={toggleReminder}
                      onDeleteReminder={deleteReminder}
                    />
                  ))}
                </motion.div>
              )}
            </div>
          </section>

          <aside className="space-y-5 lg:sticky lg:top-28">
            <section aria-labelledby="episodes-title" className="bg-bg-elevated border border-border rounded-2xl p-4 md:p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 id="episodes-title" className="text-base font-semibold text-text">Episodios</h2>
                  <p className="text-sm text-text-muted mt-1">Malestar físico o mental registrado.</p>
                </div>
                <button type="button" onClick={() => setEpisodeModal('new')} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-soft text-accent text-sm font-semibold hover:bg-accent-soft/80 transition-colors">
                  <Plus className="w-4 h-4" /> Registrar
                </button>
              </div>

              <EpisodeSummary summary={summary} />

              {timelineLoading ? (
                <p className="py-6 text-center text-sm text-text-muted">Actualizando episodios...</p>
              ) : episodes.length === 0 ? (
                <p className="py-6 text-center text-sm text-text-muted">Sin episodios todavía.</p>
              ) : (
                <motion.ol className="space-y-3" variants={listVariants} initial="hidden" animate="show">
                  {episodes.map((episode) => (
                    <EpisodeItem key={episode.id} episode={episode} conditionName={conditionName(episode.condition_id)} onEdit={() => setEpisodeModal(episode)} onDelete={() => deleteEpisode(episode)} />
                  ))}
                </motion.ol>
              )}
            </section>
          </aside>
        </div>
      </main>

      <Modal open={Boolean(conditionModal)} onClose={() => setConditionModal(null)} title={conditionModal === 'new' ? 'Nueva condición' : 'Editar condición'} size="lg">
        <div className="p-6 max-h-[80dvh] overflow-y-auto">
          <ConditionForm initial={conditionModal && conditionModal !== 'new' ? conditionModal : null} saving={saving} onSubmit={saveCondition} />
        </div>
      </Modal>

      <Modal open={Boolean(guidelineModal)} onClose={() => setGuidelineModal(null)} title={guidelineModal?.guideline ? 'Editar cuidado' : 'Agregar cuidado'} size="lg">
        <div className="p-6 max-h-[80dvh] overflow-y-auto">
          {guidelineModal && <GuidelineForm initial={guidelineModal.guideline ?? null} saving={saving} onSubmit={saveGuideline} />}
        </div>
      </Modal>

      <Modal open={Boolean(reminderModal)} onClose={() => setReminderModal(null)} title={reminderModal?.reminder ? 'Editar recordatorio' : 'Agregar recordatorio'} size="lg">
        <div className="p-6 max-h-[80dvh] overflow-y-auto">
          {reminderModal && <ReminderForm initial={reminderModal.reminder ?? null} saving={saving} onSubmit={saveReminder} />}
        </div>
      </Modal>

      <Modal open={Boolean(episodeModal)} onClose={() => setEpisodeModal(null)} title={episodeModal === 'new' ? 'Registrar episodio' : 'Editar episodio'} size="lg">
        <div className="p-6 max-h-[80dvh] overflow-y-auto">
          <EpisodeForm initial={episodeModal && episodeModal !== 'new' ? episodeModal : null} conditions={conditions} saving={saving} onSubmit={saveEpisode} />
        </div>
      </Modal>

      <Modal open={Boolean(suggestionModal)} onClose={() => setSuggestionModal(null)} title="Sugerir con IA" size="lg">
        <div className="p-6 max-h-[80dvh] overflow-y-auto space-y-4">
          <p className="text-sm text-text-muted">Revisa y edita antes de guardar. Estas sugerencias son orientación general y no reemplazan atención médica.</p>
          {suggesting ? (
            <p className="py-8 text-center text-sm text-text-muted">Generando sugerencias...</p>
          ) : (
            <SuggestionEditor draft={suggestionDraft} onChange={setSuggestionDraft} />
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setSuggestionModal(null)} className="px-4 py-2 rounded-lg border border-border text-sm font-semibold text-text-muted hover:text-text hover:bg-bg-muted transition-colors">Cancelar</button>
            <button type="button" disabled={saving || suggesting} onClick={saveSuggestion} className="px-4 py-2 rounded-lg bg-accent text-accent-fg text-sm font-semibold hover:bg-[var(--accent-hover)] disabled:opacity-60 transition-colors">
              {saving ? 'Guardando...' : 'Guardar como cuidados'}
            </button>
          </div>
        </div>
      </Modal>
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

function ConditionCard(props: {
  condition: HealthCondition
  onEdit: () => void
  onDelete: () => void
  onSuggest: () => void
  onAddGuideline: () => void
  onEditGuideline: (guideline: HealthGuideline) => void
  onToggleGuideline: (guideline: HealthGuideline) => void
  onDeleteGuideline: (guideline: HealthGuideline) => void
  onAddReminder: () => void
  onEditReminder: (reminder: HealthReminder) => void
  onToggleReminder: (reminder: HealthReminder) => void
  onDeleteReminder: (reminder: HealthReminder) => void
}) {
  const { condition } = props
  const grouped = {
    avoid: condition.guidelines.filter((item) => item.kind === 'avoid'),
    helps: condition.guidelines.filter((item) => item.kind === 'helps'),
    action: condition.guidelines.filter((item) => item.kind === 'action'),
  }

  return (
    <motion.article variants={itemVariants} className="border border-border bg-bg rounded-2xl p-4 md:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-text truncate">{condition.name}</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-accent-soft text-accent">{categoryLabel(condition.category)}</span>
            <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', condition.status === 'resolved' ? 'bg-success-soft text-[var(--success)]' : 'bg-bg-muted text-text-muted')}>{statusLabel(condition.status)}</span>
          </div>
          {condition.description && <p className="mt-2 text-sm text-text-muted">{condition.description}</p>}
          <p className="mt-1 text-xs text-text-subtle">Diagnosticada: {formatDateLabel(condition.diagnosed_on)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={props.onSuggest} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent-soft text-accent text-sm font-semibold hover:bg-accent-soft/80 transition-colors">
            <Sparkles className="w-4 h-4" /> Sugerir
          </button>
          <IconButton label="Editar condición" onClick={props.onEdit}><Pencil className="w-4 h-4" /></IconButton>
          <IconButton label="Eliminar condición" onClick={props.onDelete} danger><Trash2 className="w-4 h-4" /></IconButton>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 mt-5">
        {(['avoid', 'helps', 'action'] as GuidelineKind[]).map((kind) => (
          <GuidelineBlock
            key={kind}
            kind={kind}
            items={grouped[kind]}
            onAdd={props.onAddGuideline}
            onEdit={props.onEditGuideline}
            onToggle={props.onToggleGuideline}
            onDelete={props.onDeleteGuideline}
          />
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-border bg-bg-elevated/60 p-3">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h4 className="inline-flex items-center gap-2 text-sm font-semibold text-text"><Bell className="w-4 h-4 text-text-subtle" /> Recordatorios de cuidado</h4>
          <button type="button" onClick={props.onAddReminder} className="text-xs font-semibold text-accent hover:underline">Agregar</button>
        </div>
        {condition.reminders.length === 0 ? (
          <p className="text-sm text-text-muted">Sin recordatorios in-app.</p>
        ) : (
          <ul className="space-y-2">
            {condition.reminders.map((reminder) => (
              <li key={reminder.id} className="flex items-start justify-between gap-2 rounded-lg bg-bg px-3 py-2 text-sm">
                <label className="flex min-w-0 items-start gap-2 text-text">
                  <input type="checkbox" checked={reminder.is_active} onChange={() => props.onToggleReminder(reminder)} className="mt-1 accent-[var(--accent)]" />
                  <span className={cn('min-w-0', !reminder.is_active && 'text-text-muted line-through')}>
                    {reminder.text}
                    <span className="block text-xs text-text-subtle">{reminder.frequency}{reminder.time_of_day ? ` · ${reminder.time_of_day.slice(0, 5)}` : ''}</span>
                  </span>
                </label>
                <div className="flex items-center gap-1">
                  <IconButton label="Editar recordatorio" onClick={() => props.onEditReminder(reminder)}><Pencil className="w-3.5 h-3.5" /></IconButton>
                  <IconButton label="Eliminar recordatorio" onClick={() => props.onDeleteReminder(reminder)} danger><Trash2 className="w-3.5 h-3.5" /></IconButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.article>
  )
}

function GuidelineBlock({ kind, items, onAdd, onEdit, onToggle, onDelete }: { kind: GuidelineKind; items: HealthGuideline[]; onAdd: () => void; onEdit: (item: HealthGuideline) => void; onToggle: (item: HealthGuideline) => void; onDelete: (item: HealthGuideline) => void }) {
  return (
    <div className="rounded-xl border border-border bg-bg-elevated/60 p-3 min-h-[10rem]">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h4 className="inline-flex items-center gap-2 text-sm font-semibold text-text">
          {kind === 'avoid' ? <AlertTriangle className="w-4 h-4 text-[var(--warning)]" /> : kind === 'helps' ? <Activity className="w-4 h-4 text-[var(--success)]" /> : <ListChecks className="w-4 h-4 text-accent" />}
          {guidelineLabels[kind]}
        </h4>
        <button type="button" onClick={onAdd} className="text-xs font-semibold text-accent hover:underline">Agregar</button>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-text-muted">Sin ítems.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-2 rounded-lg bg-bg px-3 py-2 text-sm">
              {kind === 'action' ? (
                <label className="flex min-w-0 items-start gap-2 text-text">
                  <input type="checkbox" checked={item.is_done} onChange={() => onToggle(item)} className="mt-1 accent-[var(--accent)]" />
                  <span className={cn('min-w-0', item.is_done && 'text-text-muted line-through')}>{item.text}</span>
                </label>
              ) : (
                <span className="min-w-0 text-text">{item.text}</span>
              )}
              <div className="flex items-center gap-1">
                <IconButton label="Editar cuidado" onClick={() => onEdit(item)}><Pencil className="w-3.5 h-3.5" /></IconButton>
                <IconButton label="Eliminar cuidado" onClick={() => onDelete(item)} danger><Trash2 className="w-3.5 h-3.5" /></IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function EpisodeSummary({ summary }: { summary: SicknessEpisodeSummary }) {
  return (
    <div className="rounded-xl border border-border bg-bg p-3">
      <p className="text-sm font-semibold text-text">{summary.total} episodio{summary.total === 1 ? '' : 's'} en el período</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {episodeTypes.map((item) => (
          <div key={item.value} className="rounded-lg bg-bg-elevated px-3 py-2">
            <p className="text-xs text-text-subtle">{item.label}</p>
            <p className="text-lg font-bold text-text">{summary.by_type[item.value] ?? 0}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function EpisodeItem({ episode, conditionName, onEdit, onDelete }: { episode: SicknessEpisode; conditionName: string | null; onEdit: () => void; onDelete: () => void }) {
  return (
    <motion.li variants={itemVariants}>
      <article className="rounded-xl border border-border bg-bg p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-text truncate">{episode.title}</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-bg-muted text-text-muted">{typeLabel(episode.episode_type)}</span>
            </div>
            <p className="mt-1 text-xs text-text-subtle">{formatDateLabel(episode.started_on)}{episode.ended_on ? ` → ${formatDateLabel(episode.ended_on)}` : ' · en curso'}</p>
            {conditionName && <p className="mt-1 text-xs text-accent">Ligado a {conditionName}</p>}
          </div>
          <div className="flex items-center gap-1">
            <IconButton label="Editar episodio" onClick={onEdit}><Pencil className="w-3.5 h-3.5" /></IconButton>
            <IconButton label="Eliminar episodio" onClick={onDelete} danger><Trash2 className="w-3.5 h-3.5" /></IconButton>
          </div>
        </div>
        {episode.severity != null && <p className="mt-2 text-xs text-text-muted">Severidad: {episode.severity}/5</p>}
        {episode.symptoms && <p className="mt-2 text-sm text-text-muted">{episode.symptoms}</p>}
      </article>
    </motion.li>
  )
}

function IconButton({ label, onClick, children, danger }: { label: string; onClick: () => void; children: ReactNode; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className={cn('touch-target -m-2 inline-flex items-center justify-center text-text-subtle hover:text-text transition-colors', danger && 'hover:text-[var(--danger)]')}>
      {children}
    </button>
  )
}

function ConditionForm({ initial, saving, onSubmit }: { initial: HealthCondition | null; saving: boolean; onSubmit: (data: HealthConditionInput) => void }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [category, setCategory] = useState<ConditionCategory>(initial?.category ?? 'other')
  const [status, setStatus] = useState<ConditionStatus>(initial?.status ?? 'active')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [diagnosedOn, setDiagnosedOn] = useState(initial?.diagnosed_on ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit({ name: name.trim(), category, status, description: optionalText(description), diagnosed_on: diagnosedOn || null, notes: optionalText(notes) })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Nombre" required><input name="name" value={name} onChange={(event) => setName(event.target.value)} required className="form-input" /></Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Categoría"><select name="category" value={category} onChange={(event) => setCategory(event.target.value as ConditionCategory)} className="form-input">{conditionCategories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
        <Field label="Estado"><select name="status" value={status} onChange={(event) => setStatus(event.target.value as ConditionStatus)} className="form-input">{conditionStatuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
      </div>
      <Field label="Fecha de diagnóstico"><input name="diagnosed_on" type="date" value={diagnosedOn} max={getLocalDateValue()} onChange={(event) => setDiagnosedOn(event.target.value)} className="form-input" /></Field>
      <Field label="Descripción"><textarea name="description" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="form-input resize-y" /></Field>
      <Field label="Notas"><textarea name="notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="form-input resize-y" /></Field>
      <SubmitRow saving={saving} label="Guardar condición" />
    </form>
  )
}

function GuidelineForm({ initial, saving, onSubmit }: { initial: HealthGuideline | null; saving: boolean; onSubmit: (data: { kind: GuidelineKind; text: string; is_done?: boolean }) => void }) {
  const [kind, setKind] = useState<GuidelineKind>(initial?.kind ?? 'avoid')
  const [text, setText] = useState(initial?.text ?? '')
  const [isDone, setIsDone] = useState(initial?.is_done ?? false)

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit({ kind, text: text.trim(), is_done: isDone })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Tipo"><select name="kind" value={kind} onChange={(event) => setKind(event.target.value as GuidelineKind)} className="form-input">{(['avoid', 'helps', 'action'] as GuidelineKind[]).map((item) => <option key={item} value={item}>{guidelineLabels[item]}</option>)}</select></Field>
      <Field label="Texto" required><textarea name="text" value={text} onChange={(event) => setText(event.target.value)} required rows={4} className="form-input resize-y" /></Field>
      {kind === 'action' && <label className="flex items-center gap-2 text-sm text-text"><input type="checkbox" checked={isDone} onChange={(event) => setIsDone(event.target.checked)} className="accent-[var(--accent)]" /> Acción completada</label>}
      <SubmitRow saving={saving} label="Guardar cuidado" />
    </form>
  )
}

function ReminderForm({ initial, saving, onSubmit }: { initial: HealthReminder | null; saving: boolean; onSubmit: (data: { text: string; time_of_day?: string | null; frequency?: string; is_active?: boolean }) => void }) {
  const [text, setText] = useState(initial?.text ?? '')
  const [timeOfDay, setTimeOfDay] = useState(initial?.time_of_day?.slice(0, 5) ?? '')
  const [frequency, setFrequency] = useState(initial?.frequency ?? 'daily')
  const [isActive, setIsActive] = useState(initial?.is_active ?? true)

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit({ text: text.trim(), time_of_day: timeOfDay || null, frequency: frequency.trim() || 'daily', is_active: isActive })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Recordatorio" required><textarea name="text" value={text} onChange={(event) => setText(event.target.value)} required rows={3} className="form-input resize-y" /></Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Hora opcional"><input name="time_of_day" type="time" value={timeOfDay} onChange={(event) => setTimeOfDay(event.target.value)} className="form-input" /></Field>
        <Field label="Frecuencia"><input name="frequency" value={frequency} onChange={(event) => setFrequency(event.target.value)} className="form-input" /></Field>
      </div>
      <label className="flex items-center gap-2 text-sm text-text"><input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} className="accent-[var(--accent)]" /> Activo</label>
      <SubmitRow saving={saving} label="Guardar recordatorio" />
    </form>
  )
}

function EpisodeForm({ initial, conditions, saving, onSubmit }: { initial: SicknessEpisode | null; conditions: HealthCondition[]; saving: boolean; onSubmit: (data: SicknessEpisodeInput) => void }) {
  const [conditionId, setConditionId] = useState(initial?.condition_id ?? '')
  const [episodeType, setEpisodeType] = useState<EpisodeType>(initial?.episode_type ?? 'physical')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [startedOn, setStartedOn] = useState(initial?.started_on ?? getLocalDateValue())
  const [endedOn, setEndedOn] = useState(initial?.ended_on ?? '')
  const [severity, setSeverity] = useState(initial?.severity?.toString() ?? '')
  const [symptoms, setSymptoms] = useState(initial?.symptoms ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit({
      condition_id: conditionId || null,
      episode_type: episodeType,
      title: title.trim(),
      started_on: startedOn,
      ended_on: endedOn || null,
      severity: severity ? Number(severity) : null,
      symptoms: optionalText(symptoms),
      notes: optionalText(notes),
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Título" required><input name="title" value={title} onChange={(event) => setTitle(event.target.value)} required className="form-input" /></Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Tipo"><select name="episode_type" value={episodeType} onChange={(event) => setEpisodeType(event.target.value as EpisodeType)} className="form-input">{episodeTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
        <Field label="Condición relacionada"><select name="condition_id" value={conditionId} onChange={(event) => setConditionId(event.target.value)} className="form-input"><option value="">Sin condición</option>{conditions.map((condition) => <option key={condition.id} value={condition.id}>{condition.name}</option>)}</select></Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label="Inicio"><input name="started_on" type="date" value={startedOn} max={getLocalDateValue()} onChange={(event) => setStartedOn(event.target.value)} required className="form-input" /></Field>
        <Field label="Fin"><input name="ended_on" type="date" value={endedOn} max={getLocalDateValue()} onChange={(event) => setEndedOn(event.target.value)} className="form-input" /></Field>
        <Field label="Severidad"><input name="severity" type="number" min="1" max="5" inputMode="numeric" value={severity} onChange={(event) => setSeverity(event.target.value)} className="form-input" /></Field>
      </div>
      <Field label="Síntomas"><textarea name="symptoms" value={symptoms} onChange={(event) => setSymptoms(event.target.value)} rows={3} className="form-input resize-y" /></Field>
      <Field label="Notas"><textarea name="notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="form-input resize-y" /></Field>
      <SubmitRow saving={saving} label="Guardar episodio" />
    </form>
  )
}

function SuggestionEditor({ draft, onChange }: { draft: { avoid: string; helps: string; action_plan: string }; onChange: (draft: { avoid: string; helps: string; action_plan: string }) => void }) {
  return (
    <div className="space-y-4">
      <Field label="Qué evitar"><textarea value={draft.avoid} onChange={(event) => onChange({ ...draft, avoid: event.target.value })} rows={5} className="form-input resize-y" /></Field>
      <Field label="Qué me hace bien"><textarea value={draft.helps} onChange={(event) => onChange({ ...draft, helps: event.target.value })} rows={5} className="form-input resize-y" /></Field>
      <Field label="Plan de acción"><textarea value={draft.action_plan} onChange={(event) => onChange({ ...draft, action_plan: event.target.value })} rows={5} className="form-input resize-y" /></Field>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-text">{label}{required ? ' *' : ''}</span>
      {children}
    </label>
  )
}

function SubmitRow({ saving, label }: { saving: boolean; label: string }) {
  return (
    <div className="flex justify-end pt-2">
      <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-accent text-accent-fg text-sm font-semibold hover:bg-[var(--accent-hover)] disabled:opacity-60 transition-colors">
        {saving ? 'Guardando...' : label}
      </button>
    </div>
  )
}
