'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Header } from '@/components/layout/Header'
import { api } from '@/lib/api'
import { Project } from '@/lib/types'
import { TASK_CATEGORIES, isScheduledCategory } from '@/lib/categories'
import { normalizeExternalUrl } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { ReminderPicker } from '@/components/tasks/ReminderPicker'

export default function AddTaskPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [projectId, setProjectId] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
  const [estimatedMinutes, setEstimatedMinutes] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [meetingTime, setMeetingTime] = useState('')
  const [externalUrl, setExternalUrl] = useState('')
  const [category, setCategory] = useState('')
  const [reminderMinutes, setReminderMinutes] = useState<number | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data: Project[] = await api.projects.list()
        setProjects(data)
      } catch (err) {
        console.error(err)
      }
    }
    loadProjects()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !projectId) return

    const normalizedExternalUrl = normalizeExternalUrl(externalUrl)
    if (externalUrl.trim() && !normalizedExternalUrl) {
      alert('Ingresa una URL válida que empiece con http:// o https://')
      return
    }

    setLoading(true)
    try {
      await api.tasks.create({
        project_id: projectId,
        title,
        description: description || null,
        source: 'manual',
        priority,
        estimated_seconds: estimatedMinutes ? Number(estimatedMinutes) * 60 : null,
        due_date: dueDate || null,
        meeting_time: isScheduledCategory(category) ? (meetingTime || null) : null,
        external_url: normalizedExternalUrl,
        category: category || null,
        reminder_minutes_before: isScheduledCategory(category) && meetingTime ? reminderMinutes : null,
      })
      setShowSuccess(true)
      setTimeout(() => router.push('/backlog'), 1500)
    } catch (err) {
      console.error('Failed to create task:', err)
      alert('Error al crear la tarea')
    } finally {
      setLoading(false)
    }
  }

  const priorityStyles: Record<string, string> = {
    critical: 'bg-[var(--priority-critical-bg)] border-[var(--priority-critical-border)] text-[var(--priority-critical-text)]',
    high: 'bg-[var(--priority-high-bg)] border-[var(--priority-high-border)] text-[var(--priority-high-text)]',
    medium: 'bg-[var(--priority-medium-bg)] border-[var(--priority-medium-border)] text-[var(--priority-medium-text)]',
    low: 'bg-[var(--priority-low-bg)] border-[var(--priority-low-border)] text-[var(--priority-low-text)]',
  }

  const inputClass = 'w-full px-4 py-2.5 border border-border rounded-lg text-sm bg-bg-elevated text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent'
  const labelClass = 'block text-sm font-medium text-text-muted mb-1.5'
  const scheduledSelected = isScheduledCategory(category)

  return (
    <div>
      <Header title="Agregar tarea" subtitle="Crear nueva tarea manual" />

      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-6 p-4 bg-success-soft border border-[var(--success)] rounded-xl flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-[var(--success)] flex-shrink-0" />
              <p className="text-sm font-medium text-[var(--success)]">
                Tarea creada exitosamente. Redirigiendo al backlog...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.form
          onSubmit={handleSubmit}
          className="space-y-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div>
            <label className={labelClass}>Título <span className="text-danger">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="¿Qué necesitas hacer?"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles adicionales (opcional)"
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div>
            <label className={labelClass}>URL externa (Jira, etc.)</label>
            <input
              type="url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://jira.example.com/browse/PROJ-123"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Categoría (opcional)</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
              <option value="">Sin categoría</option>
              {TASK_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Proyecto / Área <span className="text-danger">*</span></label>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputClass} required>
              <option value="" disabled>Seleccionar proyecto...</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Prioridad</label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high', 'critical'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                      priority === p ? priorityStyles[p] : 'bg-bg-muted border-border text-text-muted hover:border-border-strong'
                    }`}
                  >
                    {p === 'critical' ? 'Crítica' : p === 'high' ? 'Alta' : p === 'medium' ? 'Media' : 'Baja'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Tiempo estimado (min)</label>
              <input
                type="number"
                min="0"
                step="5"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                placeholder="45"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div>
              <label className={labelClass}>{scheduledSelected ? 'Fecha (opcional)' : 'Fecha límite (opcional)'}</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {scheduledSelected && (
            <div>
              <label className={labelClass}>Hora de inicio (opcional)</label>
              <input
                type="time"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                className={inputClass}
              />
            </div>
          )}

          {scheduledSelected && meetingTime && (
            <ReminderPicker value={reminderMinutes} onChange={setReminderMinutes} />
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-2.5 px-4 border border-border text-text-muted font-medium rounded-lg hover:bg-bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !projectId || loading}
              className="flex-1 py-2.5 px-4 bg-accent text-accent-fg font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-accent-fg/40 border-t-accent-fg rounded-full animate-spin" />
                  Creando...
                </span>
              ) : 'Crear tarea'}
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  )
}
