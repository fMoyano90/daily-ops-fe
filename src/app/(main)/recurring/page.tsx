'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Header } from '@/components/layout/Header'
import { ProjectBadge } from '@/components/tasks/ProjectBadge'
import { PriorityBadge } from '@/components/tasks/PriorityBadge'
import { SkeletonRow, Skeleton } from '@/components/shared/Skeleton'
import { api } from '@/lib/api'
import { RecurringTask, Project } from '@/lib/types'
import { Plus, Repeat2, Trash2, Pencil, History, CheckCircle2, XCircle } from 'lucide-react'
import { RecurringTaskForm } from '@/components/recurring/RecurringTaskForm'

const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function formatRecurrence(task: RecurringTask): string {
  if (task.recurrence_type === 'daily') return 'Todos los días'
  if (task.recurrence_type === 'weekly' && task.recurrence_days) {
    return task.recurrence_days.map((d) => dayNames[d]).join(', ')
  }
  if (task.recurrence_type === 'monthly' && task.recurrence_days) {
    return `Día${task.recurrence_days.length > 1 ? 's' : ''} ${task.recurrence_days.join(', ')}`
  }
  return ''
}

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 28 } },
}

export default function RecurringPage() {
  const [tasks, setTasks] = useState<RecurringTask[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<RecurringTask | null>(null)
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null)
  const [historyData, setHistoryData] = useState<Record<string, unknown[]>>({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [recurring, projectsList] = await Promise.all([
        api.recurringTasks.list(true),
        api.projects.list(),
      ])
      setTasks(recurring)
      setProjects(projectsList)
    } catch (err) {
      console.error('Failed to load recurring tasks:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (task: RecurringTask) => {
    try {
      await api.recurringTasks.toggle(task.id, !task.is_active)
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, is_active: !t.is_active } : t))
    } catch (err) {
      console.error('Failed to toggle task:', err)
    }
  }

  const handleDelete = async (task: RecurringTask) => {
    if (!confirm(`¿Eliminar "${task.title}"?`)) return
    try {
      await api.recurringTasks.delete(task.id)
      setTasks((prev) => prev.filter((t) => t.id !== task.id))
    } catch (err) {
      console.error('Failed to delete task:', err)
    }
  }

  const handleEdit = (task: RecurringTask) => {
    setEditingTask(task)
    setShowForm(true)
  }

  const handleViewHistory = async (task: RecurringTask) => {
    if (expandedHistory === task.id) { setExpandedHistory(null); return }
    try {
      const history = await api.recurringTasks.history(task.id)
      setHistoryData((prev) => ({ ...prev, [task.id]: history }))
      setExpandedHistory(task.id)
    } catch (err) {
      console.error('Failed to load history:', err)
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingTask(null)
    loadData()
  }

  if (loading) {
    return (
      <div>
        <Header title="Recurring" subtitle="Cargando tareas recurrentes..." />
        <div className="p-8 max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-9 w-44 rounded-lg" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header title="Recurring" subtitle="Tareas que se repiten automáticamente" />

      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Repeat2 className="w-5 h-5 text-text-subtle" />
            <span className="text-sm text-text-muted">
              {tasks.length} tarea{tasks.length !== 1 ? 's' : ''} recurrente{tasks.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-fg text-sm font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva tarea recurrente
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-12 animate-fade-in">
            <div className="w-16 h-16 bg-accent-soft rounded-2xl flex items-center justify-center mx-auto mb-4 text-accent animate-float">
              <Repeat2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-text mb-1">Sin tareas recurrentes</h3>
            <p className="text-sm text-text-muted mb-4">Crea tareas que se agreguen automáticamente a tu plan diario</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-accent-fg text-sm font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Crear tarea recurrente
            </button>
          </div>
        ) : (
          <motion.div className="space-y-3" variants={listVariants} initial="hidden" animate="show">
            {tasks.map((task) => {
              const project = projects.find((p) => p.id === task.project_id)
              const isExpanded = expandedHistory === task.id

              return (
                <motion.div
                  key={task.id}
                  variants={itemVariants}
                  className={`bg-bg-elevated border rounded-xl overflow-hidden transition-opacity ${
                    task.is_active ? 'border-border' : 'border-border opacity-60'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Repeat2 className="w-4 h-4 text-accent flex-shrink-0" />
                          <h3 className={`font-semibold truncate ${task.is_active ? 'text-text' : 'text-text-muted'}`}>
                            {task.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap mt-2">
                          <ProjectBadge project={project} size="sm" />
                          <PriorityBadge priority={task.priority} size="sm" />
                          <span className="text-xs px-2 py-0.5 bg-accent-soft text-accent rounded-full font-medium">
                            {formatRecurrence(task)}
                          </span>
                          <span className="text-xs text-text-subtle">
                            {task.completed_count}/{task.instances_count} completadas
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleViewHistory(task)}
                          className={`p-2 rounded-lg transition-colors ${isExpanded ? 'text-accent bg-accent-soft' : 'text-text-subtle hover:text-accent hover:bg-accent-soft'}`}
                          title="Ver historial"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(task)}
                          className="p-2 text-text-subtle hover:text-text hover:bg-bg-muted rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggle(task)}
                          className={`p-2 rounded-lg transition-colors ${
                            task.is_active ? 'text-[var(--success)] hover:bg-success-soft' : 'text-text-subtle hover:bg-bg-muted'
                          }`}
                          title={task.is_active ? 'Desactivar' : 'Activar'}
                        >
                          {task.is_active ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(task)}
                          className="p-2 text-text-subtle hover:text-danger hover:bg-danger-soft rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {isExpanded && historyData[task.id] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border px-4 py-3 bg-bg-muted"
                    >
                      <h4 className="text-xs font-semibold text-text-subtle uppercase tracking-wide mb-2">
                        Historial reciente
                      </h4>
                      <div className="space-y-1.5">
                        {(historyData[task.id] as any[]).map((instance) => (
                          <div key={instance.id} className="flex items-center justify-between text-sm">
                            <span className="text-text-muted">
                              {new Date(instance.date).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              instance.status === 'completed'
                                ? 'bg-success-soft text-[var(--success)]'
                                : instance.status === 'skipped'
                                ? 'bg-bg-muted text-text-subtle'
                                : 'bg-warning-soft text-[var(--warning)]'
                            }`}>
                              {instance.status === 'completed' ? 'Completada' : instance.status === 'skipped' ? 'Saltada' : 'Pendiente'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>

      {showForm && (
        <RecurringTaskForm
          task={editingTask}
          projects={projects}
          onClose={handleFormClose}
        />
      )}
    </div>
  )
}
