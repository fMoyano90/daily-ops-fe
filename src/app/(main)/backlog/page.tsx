'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'motion/react'
import { Header } from '@/components/layout/Header'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { PullToRefreshIndicator } from '@/components/shared/PullToRefreshIndicator'
import { PriorityBadge } from '@/components/tasks/PriorityBadge'
import { ProjectBadge } from '@/components/tasks/ProjectBadge'
import { CategoryPicker } from '@/components/tasks/CategoryPicker'
import { EmptyState } from '@/components/shared/EmptyState'
import { SkeletonRow, Skeleton } from '@/components/shared/Skeleton'
import { api } from '@/lib/api'
import { Task, Project, Priority, SubtaskStatus } from '@/lib/types'
import { formatDuration, normalizeExternalUrl, sourceLabel } from '@/lib/utils'
import { ListFilter, Plus, ExternalLink, CalendarDays, ChevronDown, ChevronRight, CheckCircle2, Circle, Repeat2, Bell } from 'lucide-react'
import Link from 'next/link'

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 28 } },
}

export default function BacklogPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [filterProject, setFilterProject] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterSource, setFilterSource] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [addingSubtask, setAddingSubtask] = useState<string | null>(null)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [editingUrl, setEditingUrl] = useState<string | null>(null)
  const [urlValue, setUrlValue] = useState('')
  const [editingEstimate, setEditingEstimate] = useState<string | null>(null)
  const [estimateValue, setEstimateValue] = useState('')
  const [editingTitle, setEditingTitle] = useState<string | null>(null)
  const [titleValue, setTitleValue] = useState('')
  const [editingPriority, setEditingPriority] = useState<string | null>(null)
  const [editingProject, setEditingProject] = useState<string | null>(null)
  const [addingRecurring, setAddingRecurring] = useState<string | null>(null)
  const [addingToToday, setAddingToToday] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      const [backlog, projectsList] = await Promise.all([
        api.tasks.backlog(),
        api.projects.list(),
      ])
      setTasks(backlog)
      setProjects(projectsList)
    } catch (err) {
      console.error('Failed to load backlog:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const ptr = usePullToRefresh({ onRefresh: loadData })

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filterProject !== 'all' && task.project_id !== filterProject) return false
      if (filterPriority !== 'all' && task.priority !== filterPriority) return false
      if (filterSource !== 'all' && task.source !== filterSource) return false
      if (filterType !== 'all') {
        const project = projects.find((p) => p.id === task.project_id)
        if (project?.type !== filterType) return false
      }
      return true
    })
  }, [tasks, filterProject, filterPriority, filterSource, filterType, projects])

  const priorityOrder: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 }

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
  }, [filteredTasks])

  const projectCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    tasks.forEach((t) => { counts[t.project_id] = (counts[t.project_id] || 0) + 1 })
    return counts
  }, [tasks])

  const toggleExpand = (taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev)
      next.has(taskId) ? next.delete(taskId) : next.add(taskId)
      return next
    })
  }

  const handleAddSubtask = async (taskId: string) => {
    if (!newSubtaskTitle.trim()) return
    try {
      const newSubtask = await api.taskSubtasks.create(taskId, { title: newSubtaskTitle.trim(), priority: 'medium' })
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, subtasks: [...(t.subtasks || []), newSubtask] } : t))
      setNewSubtaskTitle('')
      setAddingSubtask(null)
    } catch (err) {
      console.error('Failed to add subtask:', err)
    }
  }

  const handleToggleSubtask = async (taskId: string, subtaskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return
    const subtask = task.subtasks?.find((s) => s.id === subtaskId)
    if (!subtask) return
    const newStatus: SubtaskStatus = subtask.status === 'completed' ? 'pending' : 'completed'
    try {
      await api.taskSubtasks.update(taskId, subtaskId, { status: newStatus })
      setTasks((prev) =>
        prev.map((t) => t.id === taskId ? { ...t, subtasks: t.subtasks?.map((st) => st.id === subtaskId ? { ...st, status: newStatus } : st) } : t)
      )
    } catch (err) {
      console.error('Failed to toggle subtask:', err)
    }
  }

  const handleSaveUrl = async (taskId: string) => {
    const normalizedExternalUrl = normalizeExternalUrl(urlValue)
    if (urlValue.trim() && !normalizedExternalUrl) {
      alert('Ingresa una URL válida que empiece con http:// o https://')
      return
    }

    try {
      await api.tasks.update(taskId, { external_url: normalizedExternalUrl })
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, external_url: normalizedExternalUrl || undefined } : t))
      setEditingUrl(null)
      setUrlValue('')
    } catch (err) {
      console.error('Failed to update URL:', err)
    }
  }

  const handleSaveEstimate = async (taskId: string) => {
    const minutes = estimateValue.trim() ? Number(estimateValue) : null
    if (minutes !== null && Number.isNaN(minutes)) return
    const estimatedSeconds = minutes !== null ? Math.max(0, minutes) * 60 : null
    try {
      await api.tasks.update(taskId, { estimated_seconds: estimatedSeconds })
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, estimated_seconds: estimatedSeconds } : t))
      setEditingEstimate(null)
      setEstimateValue('')
    } catch (err) {
      console.error('Failed to update estimate:', err)
    }
  }

  const handleSaveTitle = async (taskId: string) => {
    if (!titleValue.trim()) return
    try {
      await api.tasks.update(taskId, { title: titleValue.trim() })
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, title: titleValue.trim() } : t))
      setEditingTitle(null)
      setTitleValue('')
    } catch (err) {
      console.error('Failed to update title:', err)
    }
  }

  const handleUpdatePriority = async (taskId: string, priority: Priority) => {
    try {
      await api.tasks.update(taskId, { priority })
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, priority } : t))
      setEditingPriority(null)
    } catch (err) {
      console.error('Failed to update priority:', err)
    }
  }

  const handleUpdateProject = async (taskId: string, projectId: string) => {
    try {
      await api.tasks.update(taskId, { project_id: projectId })
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, project_id: projectId } : t))
      setEditingProject(null)
    } catch (err) {
      console.error('Failed to update project:', err)
    }
  }

  const handleUpdateCategory = async (
    taskId: string,
    data: { category: string | null; due_date?: string | null; meeting_time?: string | null; reminder_minutes_before?: number | null }
  ) => {
    const payload: Record<string, unknown> = { category: data.category }
    if (data.due_date !== undefined) payload.due_date = data.due_date
    if (data.meeting_time !== undefined) payload.meeting_time = data.meeting_time
    if (data.reminder_minutes_before !== undefined) payload.reminder_minutes_before = data.reminder_minutes_before
    try {
      await api.tasks.update(taskId, payload)
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                category: data.category ?? undefined,
                due_date: data.due_date !== undefined ? data.due_date ?? undefined : t.due_date,
                meeting_time: data.meeting_time ?? undefined,
                reminder_minutes_before: data.reminder_minutes_before ?? undefined,
              }
            : t
        )
      )
    } catch (err) {
      console.error('Failed to update category:', err)
    }
  }

  const handleAddRecurringToToday = async (recurringTaskId: string, task: Task) => {
    setAddingRecurring(recurringTaskId)
    try {
      const plan = await api.dailyPlans.getToday()
      await api.dailyPlans.addTask(plan.id, { task_id: task.id, priority: task.priority })
      setTasks((prev) => prev.filter((t) => t.id !== task.id))
    } catch (err) {
      console.error('Failed to add recurring task to today:', err)
    } finally {
      setAddingRecurring(null)
    }
  }

  const handleAddToToday = async (task: Task) => {
    setAddingToToday(task.id)
    try {
      const plan = await api.dailyPlans.getToday()
      await api.dailyPlans.addTask(plan.id, { task_id: task.id, priority: task.priority })
      setTasks((prev) => prev.filter((t) => t.id !== task.id))
    } catch (err) {
      console.error('Failed to add task to today:', err)
    } finally {
      setAddingToToday(null)
    }
  }

  if (loading) {
    return (
      <div>
        <Header title="Backlog" subtitle="Cargando tareas..." />
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} />)}
          </div>
        </div>
      </div>
    )
  }

  const selectClass = 'w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg-elevated text-text focus:outline-none focus:ring-2 focus:ring-accent'

  return (
    <div>
      <PullToRefreshIndicator pull={ptr.pull} refreshing={ptr.refreshing} progress={ptr.progress} />
      <Header title="Backlog" subtitle="Todas tus tareas pendientes" />

      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListFilter className="w-4 h-4 text-text-subtle" />
            <span className="text-sm font-medium text-text-muted">Filtros:</span>
          </div>
          <Link
            href="/add-task"
            className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-fg text-sm font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva tarea
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-text-subtle mb-1">Proyecto</label>
            <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className={selectClass}>
              <option value="all">Todos</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name} ({projectCounts[p.id] || 0})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-subtle mb-1">Prioridad</label>
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className={selectClass}>
              <option value="all">Todas</option>
              <option value="critical">Crítica</option>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-subtle mb-1">Fuente</label>
            <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className={selectClass}>
              <option value="all">Todas</option>
              <option value="manual">Manual</option>
              <option value="jira">Jira</option>
              <option value="recurring">Recurrente</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-subtle mb-1">Tipo</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={selectClass}>
              <option value="all">Todos</option>
              <option value="work">Trabajo</option>
              <option value="business">Negocio</option>
              <option value="partner">Socio</option>
              <option value="personal">Personal</option>
            </select>
          </div>
        </div>

        <p className="text-sm text-text-subtle">
          {sortedTasks.length} tarea{sortedTasks.length !== 1 ? 's' : ''} en el backlog
        </p>

        {sortedTasks.length === 0 ? (
          <EmptyState
            icon={<ListFilter className="w-8 h-8" />}
            title="No hay tareas que coincidan"
            description="Ajusta los filtros o crea una nueva tarea"
            action={
              <Link href="/add-task" className="flex items-center gap-2 px-4 py-2.5 bg-accent text-accent-fg font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors">
                <Plus className="w-4 h-4" />
                Crear tarea
              </Link>
            }
          />
        ) : (
          <motion.div className="space-y-2" variants={listVariants} initial="hidden" animate="show">
            {sortedTasks.map((task) => {
              const project = projects.find((p) => p.id === task.project_id)
              const isExpanded = expandedTasks.has(task.id)
              const subtasks = task.subtasks || []
              const completedSubtasks = subtasks.filter((s) => s.status === 'completed').length
              const safeExternalUrl = normalizeExternalUrl(task.external_url)

              return (
                <motion.div
                  key={task.id}
                  variants={itemVariants}
                  className="bg-bg-elevated border border-border rounded-xl hover:border-border-strong hover:shadow-[var(--shadow-md)] transition-all"
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleExpand(task.id)}
                        className="mt-1 p-1 text-text-subtle hover:text-text-muted transition-colors"
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {editingTitle === task.id ? (
                            <div className="flex-1 flex gap-2">
                              <input
                                type="text"
                                value={titleValue}
                                onChange={(e) => setTitleValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveTitle(task.id)
                                  else if (e.key === 'Escape') { setEditingTitle(null); setTitleValue('') }
                                }}
                                className="flex-1 px-2 py-1 border border-accent rounded text-sm font-semibold bg-bg-elevated text-text focus:outline-none focus:ring-2 focus:ring-accent"
                                autoFocus
                              />
                              <button onClick={() => handleSaveTitle(task.id)} className="px-2 py-1 bg-accent text-accent-fg text-xs font-medium rounded hover:bg-[var(--accent-hover)] transition-colors">Guardar</button>
                              <button onClick={() => { setEditingTitle(null); setTitleValue('') }} className="px-2 py-1 border border-border text-text-muted text-xs font-medium rounded hover:bg-bg-muted transition-colors">Cancelar</button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <h3
                                  className="text-sm font-semibold text-text line-clamp-3 cursor-pointer hover:text-accent transition-colors"
                                  onClick={() => { setEditingTitle(task.id); setTitleValue(task.title) }}
                                  title="Click para editar"
                                >
                                  {task.title}
                                </h3>
                                {task.is_recurring && (
                                  <span className="flex items-center gap-1 text-xs text-accent bg-accent-soft px-1.5 py-0.5 rounded-full flex-shrink-0" title="Tarea recurrente">
                                    <Repeat2 className="w-3 h-3" />
                                  </span>
                                )}
                              </div>
                              {task.source === 'jira' && task.external_key && safeExternalUrl && (
                                <a href={safeExternalUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-accent hover:text-[var(--accent-hover)] flex-shrink-0 transition-colors">
                                  <ExternalLink className="w-3 h-3" />
                                  {task.external_key}
                                </a>
                              )}
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                          {editingProject === task.id ? (
                            <select
                              autoFocus
                              defaultValue={task.project_id}
                              onChange={(e) => handleUpdateProject(task.id, e.target.value)}
                              onBlur={() => setEditingProject(null)}
                              className="px-2 py-0.5 text-xs border border-accent rounded-full bg-bg-elevated text-text focus:outline-none focus:ring-2 focus:ring-accent"
                            >
                              {projects.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          ) : (
                            <button
                              onClick={() => setEditingProject(task.id)}
                              className="hover:opacity-80 transition-opacity"
                              title="Click para cambiar de proyecto"
                            >
                              <ProjectBadge project={project} />
                            </button>
                          )}
                          {editingPriority === task.id ? (
                            <div className="flex gap-1">
                              {(['low', 'medium', 'high', 'critical'] as const).map((p) => (
                                <button key={p} onClick={() => handleUpdatePriority(task.id, p)} className="px-2 py-0.5 text-xs font-medium rounded-full border border-border bg-bg-muted text-text-muted hover:border-accent hover:text-accent transition-colors">
                                  {p === 'critical' ? 'Crítica' : p === 'high' ? 'Alta' : p === 'medium' ? 'Media' : 'Baja'}
                                </button>
                              ))}
                              <button onClick={() => setEditingPriority(null)} className="px-2 py-0.5 text-xs text-text-subtle hover:text-text transition-colors">✕</button>
                            </div>
                          ) : (
                            <button onClick={() => setEditingPriority(task.id)} className="hover:opacity-80 transition-opacity" title="Click para cambiar prioridad">
                              <PriorityBadge priority={task.priority} />
                            </button>
                          )}
                          <span className="text-xs px-2 py-0.5 bg-bg-muted text-text-muted rounded-full">{sourceLabel(task.source)}</span>
                          {task.is_recurring && (
                            <button
                              onClick={() => handleAddRecurringToToday(task.recurring_task_id!, task)}
                              disabled={addingRecurring === task.recurring_task_id}
                              className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-accent bg-accent-soft rounded-full hover:bg-accent hover:text-accent-fg transition-colors disabled:opacity-50"
                            >
                              {addingRecurring === task.recurring_task_id ? (
                                <span className="w-3 h-3 border-2 border-accent/40 border-t-accent rounded-full animate-spin" />
                              ) : (
                                <><Plus className="w-3 h-3" /> Añadir a hoy</>
                              )}
                            </button>
                          )}
                          {!task.is_recurring && (
                            <button
                              onClick={() => handleAddToToday(task)}
                              disabled={addingToToday === task.id}
                              className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-[var(--success)] bg-success-soft rounded-full hover:bg-[var(--success)] hover:text-[var(--success-fg)] transition-colors disabled:opacity-50"
                            >
                              {addingToToday === task.id ? (
                                <span className="w-3 h-3 border-2 border-success/40 border-t-success rounded-full animate-spin" />
                              ) : (
                                <><CalendarDays className="w-3 h-3" /> Añadir a hoy</>
                              )}
                            </button>
                          )}
                          <CategoryPicker
                            category={task.category}
                            dueDate={task.due_date}
                            meetingTime={task.meeting_time}
                            reminderMinutesBefore={task.reminder_minutes_before}
                            editable={!task.is_recurring}
                            onUpdate={!task.is_recurring ? (data) => handleUpdateCategory(task.id, data) : undefined}
                          />
                          {task.estimated_seconds != null && task.estimated_seconds > 0 && (
                            <span className="text-xs px-2 py-0.5 bg-info-soft text-[var(--info)] rounded-full font-mono">
                              Est. {formatDuration(task.estimated_seconds)}
                            </span>
                          )}
                          {task.reminder_minutes_before != null && task.meeting_time && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-warning-soft text-[var(--warning)] border border-[var(--warning)]/30 rounded-full font-medium">
                              <Bell className="w-3 h-3" />
                              {task.reminder_minutes_before === 0 ? 'A la hora' : task.reminder_minutes_before === 15 ? '15 min' : task.reminder_minutes_before === 30 ? '30 min' : task.reminder_minutes_before === 60 ? '1h' : task.reminder_minutes_before === 180 ? '3h' : `${task.reminder_minutes_before} min`}
                            </span>
                          )}
                          {subtasks.length > 0 && <span className="text-xs text-text-subtle">{completedSubtasks}/{subtasks.length} subtareas</span>}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-border space-y-4">
                        {!task.is_recurring && (
                          <div>
                            <label className="block text-xs font-medium text-text-subtle mb-1.5">Tiempo estimado</label>
                            {editingEstimate === task.id ? (
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="5"
                                  value={estimateValue}
                                  onChange={(e) => setEstimateValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEstimate(task.id)
                                    else if (e.key === 'Escape') { setEditingEstimate(null); setEstimateValue('') }
                                  }}
                                  placeholder="Minutos"
                                  className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-bg-elevated text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent"
                                  autoFocus
                                />
                                <button onClick={() => handleSaveEstimate(task.id)} className="px-3 py-2 bg-accent text-accent-fg text-sm font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors">Guardar</button>
                                <button onClick={() => { setEditingEstimate(null); setEstimateValue('') }} className="px-3 py-2 border border-border text-text-muted text-sm font-medium rounded-lg hover:bg-bg-muted transition-colors">Cancelar</button>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setEditingEstimate(task.id); setEstimateValue(task.estimated_seconds ? String(Math.round(task.estimated_seconds / 60)) : '') }}
                                className="text-sm text-accent hover:text-[var(--accent-hover)] font-medium transition-colors"
                              >
                                {task.estimated_seconds ? `Editar estimación (${formatDuration(task.estimated_seconds)})` : 'Añadir estimación'}
                              </button>
                            )}
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-medium text-text-subtle mb-1.5">URL externa (Jira, etc.)</label>
                          {editingUrl === task.id ? (
                            <div className="flex gap-2">
                              <input
                                type="url"
                                value={urlValue}
                                onChange={(e) => setUrlValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveUrl(task.id)
                                  else if (e.key === 'Escape') { setEditingUrl(null); setUrlValue('') }
                                }}
                                placeholder="https://jira.example.com/browse/PROJ-123"
                                className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-bg-elevated text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent"
                                autoFocus
                              />
                              <button onClick={() => handleSaveUrl(task.id)} className="px-3 py-2 bg-accent text-accent-fg text-sm font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors">Guardar</button>
                              <button onClick={() => { setEditingUrl(null); setUrlValue('') }} className="px-3 py-2 border border-border text-text-muted text-sm font-medium rounded-lg hover:bg-bg-muted transition-colors">Cancelar</button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {safeExternalUrl ? (
                                <>
                                  <a href={safeExternalUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-accent hover:text-[var(--accent-hover)] flex-1 truncate transition-colors">
                                    <ExternalLink className="w-4 h-4 flex-shrink-0" />
                                    <span className="truncate">{safeExternalUrl}</span>
                                  </a>
                                  <button onClick={() => { setEditingUrl(task.id); setUrlValue(task.external_url || '') }} className="px-2 py-1 text-xs text-text-subtle hover:text-text transition-colors">Editar</button>
                                </>
                              ) : (
                                <button onClick={() => { setEditingUrl(task.id); setUrlValue('') }} className="flex items-center gap-2 px-3 py-2 text-sm text-accent hover:text-[var(--accent-hover)] font-medium transition-colors">
                                  <Plus className="w-4 h-4" /> Añadir URL
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-text-subtle">Subtareas ({completedSubtasks}/{subtasks.length})</span>
                          </div>
                          <div className="space-y-2 mb-3">
                            {subtasks.map((subtask) => (
                              <div key={subtask.id} className="flex items-center gap-3 p-2 bg-bg-muted rounded-lg">
                                <button onClick={() => handleToggleSubtask(task.id, subtask.id)} className="flex-shrink-0">
                                  {subtask.status === 'completed' ? (
                                    <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-text-subtle" />
                                  )}
                                </button>
                                <span className={`text-sm flex-1 ${subtask.status === 'completed' ? 'text-text-subtle line-through' : 'text-text-muted'}`}>
                                  {subtask.title}
                                </span>
                                <PriorityBadge priority={subtask.priority} />
                              </div>
                            ))}
                          </div>

                          {addingSubtask === task.id ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newSubtaskTitle}
                                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleAddSubtask(task.id)
                                  else if (e.key === 'Escape') { setAddingSubtask(null); setNewSubtaskTitle('') }
                                }}
                                placeholder="Nueva subtarea..."
                                className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-bg-elevated text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent"
                                autoFocus
                              />
                              <button onClick={() => handleAddSubtask(task.id)} className="px-3 py-2 bg-accent text-accent-fg text-sm font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors">Añadir</button>
                              <button onClick={() => { setAddingSubtask(null); setNewSubtaskTitle('') }} className="px-3 py-2 border border-border text-text-muted text-sm font-medium rounded-lg hover:bg-bg-muted transition-colors">Cancelar</button>
                            </div>
                          ) : (
                            <button onClick={() => setAddingSubtask(task.id)} className="flex items-center gap-2 px-3 py-2 text-sm text-accent hover:text-[var(--accent-hover)] font-medium transition-colors">
                              <Plus className="w-4 h-4" /> Añadir subtarea
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
    </div>
  )
}
