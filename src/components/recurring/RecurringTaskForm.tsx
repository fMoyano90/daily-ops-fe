'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { Modal } from '@/components/shared/Modal'
import { api } from '@/lib/api'
import { RecurringTask, Project, Priority } from '@/lib/types'
import { TASK_CATEGORIES } from '@/lib/categories'
import { normalizeExternalUrl } from '@/lib/utils'
import { X } from 'lucide-react'
import { ReminderPicker } from '@/components/tasks/ReminderPicker'

const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const dayShort = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

interface RecurringTaskFormProps {
  task: RecurringTask | null
  projects: Project[]
  onClose: () => void
}

export function RecurringTaskForm({ task, projects, onClose }: RecurringTaskFormProps) {
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [projectId, setProjectId] = useState(task?.project_id || '')
  const [priority, setPriority] = useState<Priority>(task?.priority || 'medium')
  const [estimatedMinutes, setEstimatedMinutes] = useState(task?.estimated_seconds ? String(Math.round(task.estimated_seconds / 60)) : '')
  const [category, setCategory] = useState(task?.category || '')
  const [meetingTime, setMeetingTime] = useState(task?.meeting_time?.slice(0, 5) || '')
  const [reminderMinutes, setReminderMinutes] = useState<number | null>(task?.reminder_minutes_before ?? null)
  const [externalUrl, setExternalUrl] = useState(task?.external_url || '')
  const [tag, setTag] = useState(task?.tag || '')
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'monthly'>(task?.recurrence_type || 'weekly')
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>(task?.recurrence_days || [0, 1, 2, 3, 4])
  const [loading, setLoading] = useState(false)

  const priorityStyles: Record<Priority, string> = {
    critical: 'bg-[var(--priority-critical-bg)] border-[var(--priority-critical-border)] text-[var(--priority-critical-text)]',
    high: 'bg-[var(--priority-high-bg)] border-[var(--priority-high-border)] text-[var(--priority-high-text)]',
    medium: 'bg-[var(--priority-medium-bg)] border-[var(--priority-medium-border)] text-[var(--priority-medium-text)]',
    low: 'bg-[var(--priority-low-bg)] border-[var(--priority-low-border)] text-[var(--priority-low-text)]',
  }

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
      const data: Record<string, unknown> = {
        project_id: projectId,
        title,
        description: description || null,
        priority,
        estimated_seconds: estimatedMinutes ? Number(estimatedMinutes) * 60 : null,
        category: category || null,
        meeting_time: meetingTime || null,
        external_url: normalizedExternalUrl,
        tag: tag || null,
        recurrence_type: recurrenceType,
        recurrence_days: recurrenceType === 'daily' ? null : recurrenceDays,
        reminder_minutes_before: meetingTime ? reminderMinutes : null,
      }

      if (task) {
        await api.recurringTasks.update(task.id, data)
      } else {
        await api.recurringTasks.create(data)
      }
      onClose()
    } catch (err) {
      console.error('Failed to save recurring task:', err)
      alert('Error al guardar la tarea recurrente')
    } finally {
      setLoading(false)
    }
  }

  const toggleDay = (day: number) => {
    setRecurrenceDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
  }

  const toggleMonthDay = (day: number) => {
    setRecurrenceDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    )
  }

  return (
    <Modal isOpen onClose={onClose} maxWidth="max-w-lg">
      <div className="flex items-center justify-between p-6 border-b border-border">
        <h2 className="text-lg font-semibold text-text">
          {task ? 'Editar tarea recurrente' : 'Nueva tarea recurrente'}
        </h2>
        <button
          onClick={onClose}
          className="p-2 text-text-subtle hover:text-text hover:bg-bg-muted rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1.5">
            Título <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="¿Qué necesitas hacer?"
            className="w-full px-4 py-2.5 border border-border rounded-lg text-sm bg-bg-elevated text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">
              Categoría
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Reunión, Desarrollo..."
              list="recurring-task-categories"
              maxLength={100}
              className="w-full px-4 py-2.5 border border-border rounded-lg text-sm bg-bg-elevated text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <datalist id="recurring-task-categories">
              {TASK_CATEGORIES.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1.5">
              Hora
            </label>
            <input
              type="time"
              value={meetingTime}
              onChange={(e) => setMeetingTime(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg text-sm bg-bg-elevated text-text focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        {meetingTime && (
          <ReminderPicker value={reminderMinutes} onChange={setReminderMinutes} />
        )}

        <div>
          <label className="block text-sm font-medium text-text-muted mb-1.5">
            Enlace
          </label>
          <input
            type="url"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            placeholder="https://meet.google.com/..."
            className="w-full px-4 py-2.5 border border-border rounded-lg text-sm bg-bg-elevated text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-muted mb-1.5">
            Tag
          </label>
          <input
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="Nuevo Hábito"
            maxLength={100}
            className="w-full px-4 py-2.5 border border-border rounded-lg text-sm bg-bg-elevated text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-muted mb-1.5">
            Descripción
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalles adicionales (opcional)"
            rows={2}
            className="w-full px-4 py-2.5 border border-border rounded-lg text-sm bg-bg-elevated text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-muted mb-1.5">
            Proyecto / Área <span className="text-danger">*</span>
          </label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full px-4 py-2.5 border border-border rounded-lg text-sm bg-bg-elevated text-text focus:outline-none focus:ring-2 focus:ring-accent"
            required
          >
            <option value="" disabled>Seleccionar proyecto...</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-muted mb-1.5">Prioridad</label>
          <div className="flex gap-2">
            {(['low', 'medium', 'high', 'critical'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                  priority === p
                    ? priorityStyles[p]
                    : 'bg-bg-muted border-border text-text-muted hover:border-border-strong'
                }`}
              >
                {p === 'critical' ? 'Crítica' : p === 'high' ? 'Alta' : p === 'medium' ? 'Media' : 'Baja'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="recurring-estimated-minutes" className="block text-sm font-medium text-text-muted mb-1.5">
            Tiempo estimado por ejecución (min)
          </label>
          <input
            id="recurring-estimated-minutes"
            type="number"
            min="0"
            step="5"
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(e.target.value)}
            placeholder="30"
            className="w-full px-4 py-2.5 border border-border rounded-lg text-sm bg-bg-elevated text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-muted mb-1.5">Frecuencia</label>
          <div className="flex gap-2">
            {(['daily', 'weekly', 'monthly'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setRecurrenceType(type)
                  if (type === 'daily') setRecurrenceDays([])
                  if (type === 'weekly') setRecurrenceDays([0, 1, 2, 3, 4])
                  if (type === 'monthly') setRecurrenceDays([1])
                }}
                className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                  recurrenceType === type
                    ? 'bg-accent-soft border-accent text-accent'
                    : 'bg-bg-muted border-border text-text-muted hover:border-border-strong'
                }`}
              >
                {type === 'daily' ? 'Diario' : type === 'weekly' ? 'Semanal' : 'Mensual'}
              </button>
            ))}
          </div>
        </div>

        {recurrenceType === 'weekly' && (
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">
              Días de la semana
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {dayNames.map((name, i) => (
                <motion.button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(i)}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    recurrenceDays.includes(i)
                      ? 'bg-accent-soft border-accent text-accent'
                      : 'bg-bg-muted border-border text-text-muted hover:border-border-strong'
                  }`}
                >
                  {dayShort[i]}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {recurrenceType === 'monthly' && (
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">
              Días del mes
            </label>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <motion.button
                  key={day}
                  type="button"
                  onClick={() => toggleMonthDay(day)}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: day * 0.01 }}
                  className={`py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    recurrenceDays.includes(day)
                      ? 'bg-accent-soft border-accent text-accent'
                      : 'bg-bg-muted border-border text-text-muted hover:border-border-strong'
                  }`}
                >
                  {day}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 border border-border text-text-muted font-medium rounded-lg hover:bg-bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!title.trim() || !projectId || loading}
            className="flex-1 py-2.5 px-4 bg-accent text-accent-fg font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Guardando...' : task ? 'Guardar cambios' : 'Crear tarea'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
