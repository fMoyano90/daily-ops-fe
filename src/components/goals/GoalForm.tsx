'use client'

import { useState, useEffect } from 'react'
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

  const inputClass = 'w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-bg-elevated text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent transition-colors'
  const labelClass = 'block text-xs font-medium text-text-subtle mb-1.5'

  return (
    <Modal open={open} onClose={handleClose} title={isEditing ? 'Editar meta' : 'Nueva meta'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={labelClass}>Título de la meta *</label>
          <input
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
          <label className={labelClass}>Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe tu meta en detalle..."
            className={cn(inputClass, 'resize-none')}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Proyecto *</label>
            {projects.length === 0 ? (
              <div className="px-3 py-2.5 border border-border rounded-lg text-sm text-text-subtle bg-bg-muted">
                No hay proyectos. Creá uno en Settings primero.
              </div>
            ) : (
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputClass} required>
                <option value="">Seleccionar...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className={labelClass}>Horizonte</label>
            <div className="flex gap-2">
              {horizonOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setHorizon(opt.value)}
                  className={cn(
                    'flex-1 px-2 py-2 rounded-lg text-xs font-medium border transition-all',
                    horizon === opt.value
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-border text-text-muted hover:border-border-strong'
                  )}
                >
                  <div>{opt.label}</div>
                  <div className="text-[10px] text-text-subtle">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Fecha de inicio</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Fecha límite *</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className={inputClass}
              required
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Anti-metas</label>
          <p className="text-xs text-text-subtle mb-1.5">Cosas que te alejarían de esta meta</p>
          <textarea
            value={antiGoals}
            onChange={(e) => setAntiGoals(e.target.value)}
            placeholder="Ej: Distracciones con redes sociales, no delegar tareas..."
            className={cn(inputClass, 'resize-none border-danger/30 focus:ring-danger')}
            rows={2}
          />
        </div>

        <div>
          <label className={labelClass}>Key Results</label>
          <p className="text-xs text-text-subtle mb-1.5">Métricas de éxito (cómo sabrás que lo lograste)</p>
          <textarea
            value={keyResults}
            onChange={(e) => setKeyResults(e.target.value)}
            placeholder="Ej: 100 usuarios activos, $1000 MRR, 4.5★ en reviews..."
            className={cn(inputClass, 'resize-none')}
            rows={2}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 border border-border text-text-muted text-sm font-medium rounded-lg hover:bg-bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting || !title.trim() || !projectId || !targetDate || projects.length === 0}
            className="px-4 py-2.5 bg-accent text-accent-fg text-sm font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
