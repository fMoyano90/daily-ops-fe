'use client'

import { useState, useEffect, useId } from 'react'
import { Modal } from '@/components/shared/Modal'
import { Project, GoalHorizon, Goal } from '@/lib/types'
import { cn } from '@/lib/utils'

interface GoalFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  projects: Project[]
  initialData?: Goal
}

const horizonOptions: { value: GoalHorizon; label: string; desc: string }[] = [
  { value: 'short', label: 'Corto plazo', desc: '< 1 mes' },
  { value: 'medium', label: 'Mediano plazo', desc: '1-6 meses' },
  { value: 'long', label: 'Largo plazo', desc: '> 6 meses' },
]

export function GoalForm({ open, onClose, onSubmit, projects, initialData }: GoalFormProps) {
  const formId = useId()
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [projectId, setProjectId] = useState(initialData?.project_id || '')
  const [horizon, setHorizon] = useState<GoalHorizon>(initialData?.horizon || 'medium')
  const [startDate, setStartDate] = useState(initialData?.start_date || new Date().toISOString().split('T')[0])
  const [targetDate, setTargetDate] = useState(initialData?.target_date || '')
  const [antiGoals, setAntiGoals] = useState(initialData?.anti_goals || '')
  const [keyResults, setKeyResults] = useState(initialData?.key_results || '')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open && initialData) {
      setTitle(initialData.title || '')
      setDescription(initialData.description || '')
      setProjectId(initialData.project_id || '')
      setHorizon(initialData.horizon || 'medium')
      setStartDate(initialData.start_date || new Date().toISOString().split('T')[0])
      setTargetDate(initialData.target_date || '')
      setAntiGoals(initialData.anti_goals || '')
      setKeyResults(initialData.key_results || '')
    }
  }, [open, initialData?.id])

  useEffect(() => {
    if (open && !initialData && !projectId && projects.length > 0) {
      setProjectId(projects[0].id)
    }
  }, [open, projects.length])

  const isEditing = !!initialData

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !projectId || !targetDate) return
    setSubmitting(true)
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        project_id: projectId,
        horizon,
        start_date: startDate,
        target_date: targetDate,
        anti_goals: antiGoals.trim() || null,
        key_results: keyResults.trim() || null,
      })
      resetForm()
      onClose()
    } catch (err) {
      console.error('Failed to save goal:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setProjectId(initialData?.project_id || projects[0]?.id || '')
    setHorizon(initialData?.horizon || 'medium')
    setStartDate(initialData?.start_date || new Date().toISOString().split('T')[0])
    setTargetDate(initialData?.target_date || '')
    setAntiGoals(initialData?.anti_goals || '')
    setKeyResults(initialData?.key_results || '')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const inputClass = 'w-full min-h-12 px-3 py-3 sm:py-2.5 border border-border rounded-lg text-base sm:text-sm bg-bg-elevated text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent transition-colors'
  const labelClass = 'block text-sm font-medium text-text-muted mb-1.5'
  const titleId = `${formId}-title`
  const descriptionId = `${formId}-description`
  const projectIdId = `${formId}-project`
  const startDateId = `${formId}-start-date`
  const targetDateId = `${formId}-target-date`
  const antiGoalsId = `${formId}-anti-goals`
  const antiGoalsHintId = `${formId}-anti-goals-hint`
  const keyResultsId = `${formId}-key-results`
  const keyResultsHintId = `${formId}-key-results-hint`

  return (
    <Modal open={open} onClose={handleClose} title={isEditing ? 'Editar meta' : 'Nueva meta'} size="lg">
      <form onSubmit={handleSubmit} className="flex max-h-[calc(100dvh-6rem)] flex-col sm:max-h-[75vh]">
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scroll-pb-6">
          <div>
            <label htmlFor={titleId} className={labelClass}>Título de la meta *</label>
            <input
              id={titleId}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Lanzar MVP del producto"
              className={inputClass}
              autoFocus
              required
            />
          </div>

          <div>
            <label htmlFor={descriptionId} className={labelClass}>Descripción</label>
            <textarea
              id={descriptionId}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe tu meta en detalle..."
              className={cn(inputClass, 'resize-none')}
              rows={3}
            />
          </div>

          <div>
            <label htmlFor={projectIdId} className={labelClass}>Proyecto *</label>
            {projects.length === 0 ? (
              <div className="px-3 py-3 sm:py-2.5 border border-border rounded-lg text-sm text-text-subtle bg-bg-muted">
                No hay proyectos. Creá uno en Settings primero.
              </div>
            ) : (
              <select id={projectIdId} value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputClass} required>
                <option value="">Seleccionar...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
          </div>

          <fieldset>
            <legend className={labelClass}>Horizonte</legend>
            <div className="grid grid-cols-3 gap-2">
              {horizonOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    'flex min-h-14 cursor-pointer flex-col items-center justify-center rounded-lg border px-2 py-2 text-center text-xs font-medium transition-all focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent sm:text-sm',
                    horizon === opt.value
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-border text-text-muted hover:border-border-strong'
                  )}
                >
                  <input
                    type="radio"
                    name={`${formId}-horizon`}
                    value={opt.value}
                    checked={horizon === opt.value}
                    onChange={() => setHorizon(opt.value)}
                    className="sr-only"
                  />
                  <span>{opt.label}</span>
                  <div className="text-[10px] sm:text-xs text-text-subtle">{opt.desc}</div>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={startDateId} className={labelClass}>Fecha de inicio</label>
              <input
                id={startDateId}
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor={targetDateId} className={labelClass}>Fecha límite *</label>
              <input
                id={targetDateId}
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className={inputClass}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor={antiGoalsId} className={labelClass}>Anti-metas</label>
            <p id={antiGoalsHintId} className="text-xs text-text-subtle mb-1.5">Cosas que te alejarían de esta meta</p>
            <textarea
              id={antiGoalsId}
              value={antiGoals}
              onChange={(e) => setAntiGoals(e.target.value)}
              placeholder="Ej: Distracciones con redes sociales, no delegar tareas..."
              className={cn(inputClass, 'resize-none border-danger/30 focus:ring-danger')}
              aria-describedby={antiGoalsHintId}
              rows={2}
            />
          </div>

          <div>
            <label htmlFor={keyResultsId} className={labelClass}>Key Results</label>
            <p id={keyResultsHintId} className="text-xs text-text-subtle mb-1.5">Métricas de éxito (cómo sabrás que lo lograste)</p>
            <textarea
              id={keyResultsId}
              value={keyResults}
              onChange={(e) => setKeyResults(e.target.value)}
              placeholder="Ej: 100 usuarios activos, $1000 MRR, 4.5★ en reviews..."
              className={cn(inputClass, 'resize-none')}
              aria-describedby={keyResultsHintId}
              rows={2}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-border bg-bg-elevated px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-end sm:px-6 sm:py-4">
          <button
            type="button"
            onClick={handleClose}
            className="w-full px-4 py-3 sm:w-auto sm:py-2.5 border border-border text-text-muted text-sm font-medium rounded-lg hover:bg-bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting || !title.trim() || !projectId || !targetDate || projects.length === 0}
            className="w-full px-4 py-3 sm:w-auto sm:py-2.5 bg-accent text-accent-fg text-sm font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-accent-fg/40 border-t-accent-fg rounded-full animate-spin" />
                Guardando...
              </span>
            ) : isEditing ? 'Guardar cambios' : 'Crear meta'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
