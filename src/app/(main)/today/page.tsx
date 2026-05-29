'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import { Header } from '@/components/layout/Header'
import { TaskCard } from '@/components/today/TaskCard'
import { DayCloser } from '@/components/today/DayCloser'
import { PriorityBadge } from '@/components/tasks/PriorityBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { Modal } from '@/components/shared/Modal'
import { SkeletonStats } from '@/components/shared/Skeleton'
import { api } from '@/lib/api'
import { DailyTask, DailyTaskStatus, EmotionEnergy, EmotionEntry, EmotionValence, Priority, SubtaskStatus, Task, Project, TaskEmotionPhase } from '@/lib/types'
import { normalizeExternalUrl } from '@/lib/utils'
import { Plus, Inbox, Clock, ExternalLink, Repeat2, Tag, Bell } from 'lucide-react'
import Link from 'next/link'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { PullToRefreshIndicator } from '@/components/shared/PullToRefreshIndicator'
import { SwipeAction } from '@/components/shared/SwipeAction'
import confetti from 'canvas-confetti'

const priorityOrder: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 28 } },
}

const taskEmotionOptions: Array<{ value: string; label: string; valence: EmotionValence }> = [
  { value: 'calma', label: 'Calma', valence: 'pleasant' },
  { value: 'alegria', label: 'Alegría', valence: 'pleasant' },
  { value: 'ansiedad', label: 'Ansiedad', valence: 'unpleasant' },
  { value: 'frustracion', label: 'Frustración', valence: 'unpleasant' },
  { value: 'cansancio', label: 'Cansancio', valence: 'neutral' },
  { value: 'enfoque', label: 'Enfoque', valence: 'pleasant' },
]

type PendingEmotionAction = {
  taskId: string
  phase: TaskEmotionPhase
  next: 'start' | 'complete'
}

function formatMeetingTime(value: string | null | undefined): string | null {
  if (!value) return null
  const [h, m] = value.split(':')
  if (!h || !m) return value
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
}

export default function TodayPage() {
  const [tasks, setTasks] = useState<DailyTask[]>([])
  const [suggested, setSuggested] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [planId, setPlanId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [addingTaskId, setAddingTaskId] = useState<string | null>(null)
  const [activeSessionsByTaskId, setActiveSessionsByTaskId] = useState<Record<string, string>>({})
  const [timerBusyTaskIds, setTimerBusyTaskIds] = useState<Set<string>>(new Set())
  const [pendingEmotionAction, setPendingEmotionAction] = useState<PendingEmotionAction | null>(null)

  const setTimerBusy = (taskId: string, busy: boolean) => {
    setTimerBusyTaskIds((prev) => {
      const next = new Set(prev)
      if (busy) next.add(taskId)
      else next.delete(taskId)
      return next
    })
  }

  const loadData = useCallback(async () => {
    try {
      const [plan, projectsList] = await Promise.all([
        api.dailyPlans.getToday(),
        api.projects.list(),
      ])

      if (plan.status === 'closed') {
        window.location.href = '/history'
        return
      }

      setPlanId(plan.id)
      setTasks(plan.tasks || [])
      setProjects(projectsList)

      const runningTasks = (plan.tasks || []).filter((t) => t.status === 'in_progress')
      if (runningTasks.length > 0) {
        const results = await Promise.all(
          runningTasks.map(async (t) => {
            try {
              const sessions = await api.timers.sessions(t.id)
              const active = sessions.find((s) => !s.stopped_at)
              console.log('[timer] task:', t.id, 'status:', t.status, 'live_total_seconds:', t.live_total_seconds, 'total_seconds:', t.total_seconds, 'sessions:', sessions.length, 'active:', !!active)
              return active ? ([t.id, active.started_at] as const) : null
            } catch {
              return null
            }
          })
        )
        const map: Record<string, string> = {}
        for (const entry of results) {
          if (entry) map[entry[0]] = entry[1]
        }
        console.log('[timer] activeSessionsByTaskId:', map)
        setActiveSessionsByTaskId(map)
      } else {
        setActiveSessionsByTaskId({})
      }

      try {
        const suggestions = await api.dailyPlans.getSuggestions()
        const allSuggestions = [
          ...(suggestions.rolled_over || []),
          ...(suggestions.high_priority_backlog || []),
          ...(suggestions.due_today || []),
          ...(suggestions.recurring_today || []),
        ]

        const taskIdsInDay = new Set((plan.tasks || []).map((t) => t.task_id).filter(Boolean))
        const recurringIdsInDay = new Set((plan.tasks || []).map((t) => t.recurring_task_id).filter(Boolean))

        let unique = allSuggestions.filter(
          (t: Task, i: number, arr: Task[]) => {
            const isRecurring = t.id.startsWith('recurring_')
            const recurringId = isRecurring ? t.id.replace('recurring_', '') : null
            return (
              arr.findIndex((x) => x.id === t.id) === i &&
              !taskIdsInDay.has(t.id) &&
              !recurringIdsInDay.has(recurringId ?? '')
            )
          }
        )

        if (unique.length === 0) {
          const backlog = await api.tasks.backlog()
          unique = backlog
            .filter((t: Task) => !taskIdsInDay.has(t.id))
            .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
            .slice(0, 10)
        }

        setSuggested(unique.slice(0, 10))
      } catch {
        const backlog = await api.tasks.backlog()
        const taskIdsInDay = new Set((plan.tasks || []).map((t) => t.task_id).filter(Boolean))
        setSuggested(
          backlog
            .filter((t: Task) => !taskIdsInDay.has(t.id))
            .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
            .slice(0, 10)
        )
      }
    } catch (err) {
      console.error('Failed to load today data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const ptr = usePullToRefresh({
    onRefresh: async () => {
      setLoading(true)
      await loadData()
    },
  })

  const hasTaskEmotion = (taskId: string, phase: TaskEmotionPhase) => {
    const task = tasks.find((t) => t.id === taskId)
    return !!task?.emotion_entries?.some((entry) => entry.task_phase === phase)
  }

  const performCompleteTask = async (taskId: string, emotionEntry?: EmotionEntry) => {
    const task = tasks.find((t) => t.id === taskId)
    const updatedTask = await api.dailyTasks.complete(taskId)
    if (task?.task_id) {
      await api.tasks.update(task.task_id, { status: 'done' })
    }
    const mergedTask = emotionEntry
      ? { ...updatedTask, emotion_entries: [...(updatedTask.emotion_entries || []), emotionEntry] }
      : updatedTask
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? mergedTask : t))
    )
    confetti({ particleCount: 50, spread: 65, origin: { y: 0.7 }, colors: ['#7c3aed', '#34d399', '#60a5fa'] })
  }

  const handleUpdateStatus = async (taskId: string, status: DailyTaskStatus) => {
    try {
      if (status === 'completed') {
        if (!hasTaskEmotion(taskId, 'after')) {
          setPendingEmotionAction({ taskId, phase: 'after', next: 'complete' })
          return
        }
        await performCompleteTask(taskId)
      } else {
        await api.dailyTasks.update(taskId, { status })
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, status }
              : t
          )
        )
      }
    } catch (err) {
      console.error('Failed to update task status:', err)
    }
  }

  const performStartTimer = async (taskId: string) => {
    setTimerBusy(taskId, true)
    try {
      const res = await api.timers.start(taskId)
      setActiveSessionsByTaskId((prev) => ({ ...prev, [taskId]: res.started_at }))
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'in_progress' as DailyTaskStatus, live_total_seconds: t.total_seconds } : t))
      )
    } catch (err) {
      console.error('Failed to start timer:', err)
    } finally {
      setTimerBusy(taskId, false)
    }
  }

  const handleStartTimer = async (taskId: string) => {
    if (!hasTaskEmotion(taskId, 'before')) {
      setPendingEmotionAction({ taskId, phase: 'before', next: 'start' })
      return
    }
    await performStartTimer(taskId)
  }

  const handlePauseTimer = async (taskId: string) => {
    setTimerBusy(taskId, true)
    try {
      const res = await api.timers.pause(taskId)
      const addedSeconds = res.duration_seconds || 0
      setActiveSessionsByTaskId((prev) => {
        const next = { ...prev }
        delete next[taskId]
        return next
      })
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: 'paused' as DailyTaskStatus, total_seconds: t.total_seconds + addedSeconds, live_total_seconds: t.total_seconds + addedSeconds }
            : t
        )
      )
    } catch (err) {
      console.error('Failed to pause timer:', err)
    } finally {
      setTimerBusy(taskId, false)
    }
  }

  const handleResumeTimer = async (taskId: string) => {
    setTimerBusy(taskId, true)
    try {
      const res = await api.timers.resume(taskId)
      setActiveSessionsByTaskId((prev) => ({ ...prev, [taskId]: res.started_at }))
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'in_progress' as DailyTaskStatus, live_total_seconds: t.total_seconds } : t))
      )
    } catch (err) {
      console.error('Failed to resume timer:', err)
    } finally {
      setTimerBusy(taskId, false)
    }
  }

  const handleResetTimer = async (taskId: string) => {
    setTimerBusy(taskId, true)
    try {
      await api.timers.reset(taskId)
      setActiveSessionsByTaskId((prev) => {
        const next = { ...prev }
        delete next[taskId]
        return next
      })
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: 'planned' as DailyTaskStatus, total_seconds: 0, live_total_seconds: 0 }
            : t
        )
      )
    } catch (err) {
      console.error('Failed to reset timer:', err)
    } finally {
      setTimerBusy(taskId, false)
    }
  }

  const continuePendingEmotionAction = async (action: PendingEmotionAction, emotionEntry?: EmotionEntry) => {
    setPendingEmotionAction(null)
    if (action.next === 'start') {
      await performStartTimer(action.taskId)
    } else {
      await performCompleteTask(action.taskId, emotionEntry)
    }
  }

  const handleSaveTaskEmotion = async (data: {
    emotion: string
    valence: EmotionValence
    intensity: number
    energy: EmotionEnergy
    note?: string | null
  }) => {
    if (!pendingEmotionAction) return
    const action = pendingEmotionAction
    const task = tasks.find((t) => t.id === action.taskId)
    try {
      const entry = await api.emotions.create({
        daily_plan_id: planId,
        daily_task_id: action.taskId,
        project_id: task?.project?.id ?? task?.task?.project_id ?? task?.recurring_task?.project_id ?? null,
        task_phase: action.phase,
        emotion: data.emotion,
        valence: data.valence,
        intensity: data.intensity,
        energy: data.energy,
        trigger_type: 'tarea',
        secondary_emotions: [],
        note: data.note || null,
      })
      await continuePendingEmotionAction(action, entry)
    } catch (err) {
      console.error('Failed to save task emotion:', err)
    }
  }

  const handleToggleSubtask = async (subtaskId: string) => {
    const task = tasks.find((t) => t.subtasks.some((s) => s.id === subtaskId))
    if (!task) return
    const subtask = task.subtasks.find((s) => s.id === subtaskId)
    if (!subtask) return
    const newStatus: SubtaskStatus = subtask.status === 'completed' ? 'pending' : 'completed'
    try {
      await api.subtasks.update(task.id, subtaskId, { status: newStatus })
      setTasks((prev) =>
        prev.map((t) => ({
          ...t,
          subtasks: t.subtasks.map((st) =>
            st.id === subtaskId ? { ...st, status: newStatus } : st
          ),
        }))
      )
    } catch (err) {
      console.error('Failed to toggle subtask:', err)
    }
  }

  const handleUpdateSubtask = async (
    taskId: string,
    subtaskId: string,
    data: { title?: string; priority?: Priority }
  ) => {
    const prevTasks = tasks
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks.map((st) =>
                st.id === subtaskId ? { ...st, ...data } : st
              ),
            }
          : t
      )
    )
    try {
      const updated = await api.subtasks.update(taskId, subtaskId, data)
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                subtasks: t.subtasks.map((st) => (st.id === subtaskId ? updated : st)),
              }
            : t
        )
      )
    } catch (err) {
      console.error('Failed to update subtask:', err)
      setTasks(prevTasks)
    }
  }

  const handleUpdateDescription = async (taskId: string, description: string) => {
    const trimmed = description.trim()
    const value = trimmed.length > 0 ? trimmed : null
    await api.tasks.update(taskId, { description: value })
    setTasks((prev) =>
      prev.map((t) =>
        t.task_id === taskId ? { ...t, description: value ?? undefined } : t
      )
    )
  }

  const handleUpdateCategory = async (
    taskId: string,
    data: { category: string | null; due_date?: string | null; meeting_time?: string | null; reminder_minutes_before?: number | null }
  ) => {
    const payload: Record<string, unknown> = { category: data.category }
    if (data.due_date !== undefined) payload.due_date = data.due_date
    if (data.meeting_time !== undefined) payload.meeting_time = data.meeting_time
    if (data.reminder_minutes_before !== undefined) payload.reminder_minutes_before = data.reminder_minutes_before
    await api.tasks.update(taskId, payload)
    setTasks((prev) =>
      prev.map((t) =>
        t.task_id === taskId
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
  }

  const handleAddSubtask = async (taskId: string, title: string) => {
    try {
      const newSubtask = await api.subtasks.create(taskId, { title, priority: 'medium' })
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, subtasks: [...t.subtasks, newSubtask] } : t
        )
      )
    } catch (err) {
      console.error('Failed to add subtask:', err)
    }
  }

  const handleAddToToday = async (task: Task) => {
    const alreadyInPlan = tasks.some((t) => t.task_id === task.id || t.recurring_task_id === task.id.replace('recurring_', ''))
    if (alreadyInPlan || addingTaskId === task.id) return

    setAddingTaskId(task.id)
    try {
      await api.dailyPlans.addTask(planId, { task_id: task.id, priority: task.priority })
      const updatedPlan = await api.dailyPlans.getToday()
      setPlanId(updatedPlan.id)
      setTasks(updatedPlan.tasks || [])
      setSuggested((prev) => prev.filter((t) => t.id !== task.id))
    } catch (err) {
      console.error('Failed to add task to today:', err)
    } finally {
      setAddingTaskId(null)
    }
  }

  const handleRemoveFromToday = async (taskId: string) => {
    try {
      await api.dailyTasks.remove(taskId)
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
    } catch (err) {
      console.error('Failed to remove task from today:', err)
    }
  }

  const handleCloseDay = async () => {
    try {
      await api.dailyPlans.close(planId)
      window.location.href = '/history'
    } catch (err) {
      console.error('Failed to close day:', err)
      alert('Error al cerrar el día')
    }
  }

  const completedCount = tasks.filter((t) => t.status === 'completed').length
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress' || t.status === 'paused').length
  const plannedCount = tasks.filter((t) => t.status === 'planned').length
  const totalSeconds = tasks.reduce((acc, t) => acc + (t.live_total_seconds ?? t.total_seconds), 0)

  const sortedTasks = [...tasks].sort((a, b) => {
    const aDone = a.status === 'completed' ? 1 : 0
    const bDone = b.status === 'completed' ? 1 : 0
    if (aDone !== bDone) return aDone - bDone
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
  const pendingEmotionTask = pendingEmotionAction ? tasks.find((t) => t.id === pendingEmotionAction.taskId) : null

  if (loading) {
    return (
      <div>
        <Header title="Today" subtitle="Cargando tu plan diario..." />
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
          <SkeletonStats />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="animate-slide-in-up" style={{ animationDelay: `${i * 0.06}s` }}><div className="bg-bg-elevated border border-border rounded-xl p-4 h-20 animate-shimmer" /></div>)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PullToRefreshIndicator pull={ptr.pull} refreshing={ptr.refreshing} progress={ptr.progress} />
      <Header title="Today" subtitle="Planifica y ejecuta tu día" />

      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        {tasks.length === 0 && suggested.length === 0 ? (
          <EmptyState
            icon={<Inbox className="w-8 h-8" />}
            title="No hay tareas para hoy"
            description="Selecciona tareas del backlog o añade nuevas para comenzar tu día"
            action={
              <Link
                href="/backlog"
                className="flex items-center gap-2 px-4 py-2.5 bg-accent text-accent-fg font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ir al Backlog
              </Link>
            }
          />
        ) : tasks.length === 0 && suggested.length > 0 ? (
          <motion.div className="space-y-4" variants={listVariants} initial="hidden" animate="show">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-text mb-1">Comienza tu día</h3>
              <p className="text-sm text-text-muted">Selecciona tareas del backlog para añadir a hoy</p>
            </div>

            <div className="space-y-2">
              {suggested.map((task) => {
                const project = projects.find((p) => p.id === task.project_id)
                const isRecurringSuggestion = task.id.startsWith('recurring_')
                const meetingTime = formatMeetingTime(task.meeting_time)
                const safeExternalUrl = normalizeExternalUrl(task.external_url)
                const reminderLabel = task.reminder_minutes_before != null
                  ? (task.reminder_minutes_before === 0 ? 'A la hora' : task.reminder_minutes_before === 15 ? '15 min' : task.reminder_minutes_before === 30 ? '30 min' : task.reminder_minutes_before === 60 ? '1h' : task.reminder_minutes_before === 180 ? '3h' : `${task.reminder_minutes_before} min`)
                  : null
                return (
                  <motion.div
                    key={task.id}
                    variants={itemVariants}
                    className="flex items-center justify-between p-4 bg-bg-elevated border border-border rounded-xl hover:border-border-strong hover:shadow-[var(--shadow-md)] transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <PriorityBadge priority={task.priority} />
                      <span className="text-sm font-medium text-text truncate">{task.title}</span>
                      {isRecurringSuggestion && (
                        <span className="inline-flex items-center gap-1 text-xs text-accent bg-accent-soft px-1.5 py-0.5 rounded-full flex-shrink-0">
                          <Repeat2 className="w-3 h-3" />
                        </span>
                      )}
                      {task.source === 'jira' && task.external_key && (
                        <span className="text-xs text-accent font-mono flex-shrink-0">{task.external_key}</span>
                      )}
                      {meetingTime && (
                        <span className="inline-flex items-center gap-1 text-xs text-[var(--info)] bg-[var(--info-soft)] px-1.5 py-0.5 rounded-full flex-shrink-0">
                          <Clock className="w-3 h-3" />
                          {meetingTime}
                        </span>
                      )}
                      {reminderLabel && (
                        <span className="inline-flex items-center gap-1 text-xs text-[var(--warning)] bg-warning-soft px-1.5 py-0.5 rounded-full flex-shrink-0">
                          <Bell className="w-3 h-3" />
                          {reminderLabel}
                        </span>
                      )}
                      {task.tag && (
                        <span className="inline-flex items-center gap-1 text-xs text-[var(--warning)] bg-warning-soft px-1.5 py-0.5 rounded-full flex-shrink-0">
                          <Tag className="w-3 h-3" />
                          {task.tag}
                        </span>
                      )}
                      {safeExternalUrl && (
                        <a
                          href={safeExternalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-accent hover:text-[var(--accent-hover)] flex-shrink-0"
                          title={safeExternalUrl}
                        >
                          Enlace
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {project && (
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
                      )}
                    </div>
                    <button
                      onClick={() => handleAddToToday(task)}
                      disabled={addingTaskId === task.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-accent text-accent-fg text-sm font-medium rounded-lg hover:bg-[var(--accent-hover)] flex-shrink-0 ml-3 transition-colors disabled:opacity-60"
                    >
                      {addingTaskId === task.id ? (
                        <span className="w-4 h-4 border-2 border-accent-fg/40 border-t-accent-fg rounded-full animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      Añadir a hoy
                    </button>
                  </motion.div>
                )
              })}
            </div>

            <div className="text-center pt-4">
              <Link href="/backlog" className="text-sm text-accent hover:text-[var(--accent-hover)] font-medium">
                Ver todas las tareas del backlog →
              </Link>
            </div>
          </motion.div>
        ) : (
          <>
            <motion.div
              className="flex flex-wrap items-center justify-between gap-y-2 gap-x-3"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-info-soft rounded-lg">
                  <span className="text-xs font-medium text-[var(--info)]">{inProgressCount} en curso</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-muted rounded-lg">
                  <span className="text-xs font-medium text-text-muted">{plannedCount} planeadas</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-success-soft rounded-lg">
                  <span className="text-xs font-medium text-[var(--success)]">{completedCount} completadas</span>
                </div>
              </div>
              <span className="text-xs md:text-sm text-text-subtle">{tasks.length} tareas en total</span>
            </motion.div>

            <motion.div
              className="space-y-3"
              variants={listVariants}
              initial="hidden"
              animate="show"
            >
              {sortedTasks.map((task) => (
                <motion.div key={task.id} variants={itemVariants}>
                  <SwipeAction
                    disabled={task.status === 'completed'}
                    onSwipeRight={() => handleUpdateStatus(task.id, 'completed')}
                    onSwipeLeft={() => handleRemoveFromToday(task.id)}
                  >
                    <TaskCard
                      task={task}
                      activeSessionStartedAt={activeSessionsByTaskId[task.id] ?? null}
                      timerBusy={timerBusyTaskIds.has(task.id)}
                      onUpdateStatus={handleUpdateStatus}
                      onToggleSubtask={handleToggleSubtask}
                      onAddSubtask={handleAddSubtask}
                      onUpdateSubtask={handleUpdateSubtask}
                      onUpdateDescription={handleUpdateDescription}
                      onUpdateCategory={handleUpdateCategory}
                      onRemove={handleRemoveFromToday}
                      onStartTimer={handleStartTimer}
                      onPauseTimer={handlePauseTimer}
                      onResumeTimer={handleResumeTimer}
                      onResetTimer={handleResetTimer}
                    />
                  </SwipeAction>
                </motion.div>
              ))}
            </motion.div>

            {suggested.length > 0 && (
              <div className="mt-8 pt-6 border-t border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-text-muted">
                    Sugerencias del backlog ({suggested.length})
                  </h3>
                  <button
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="text-xs text-accent hover:text-[var(--accent-hover)] font-medium transition-colors"
                  >
                    {showSuggestions ? 'Ocultar' : 'Ver todas'}
                  </button>
                </div>

                {showSuggestions && (
                  <motion.div
                    className="space-y-2 mb-4"
                    variants={listVariants}
                    initial="hidden"
                    animate="show"
                  >
                    {suggested.map((task) => {
                      const project = projects.find((p) => p.id === task.project_id)
                      const isRecurringSuggestion = task.id.startsWith('recurring_')
                      const recurringId = isRecurringSuggestion ? task.id.replace('recurring_', '') : null
                      const alreadyInPlan = tasks.some((t) => t.task_id === task.id || t.recurring_task_id === recurringId)
                      const meetingTime = formatMeetingTime(task.meeting_time)
                      const safeExternalUrl = normalizeExternalUrl(task.external_url)
                      const reminderLabel = task.reminder_minutes_before != null
                        ? (task.reminder_minutes_before === 0 ? 'A la hora' : task.reminder_minutes_before === 15 ? '15 min' : task.reminder_minutes_before === 30 ? '30 min' : task.reminder_minutes_before === 60 ? '1h' : task.reminder_minutes_before === 180 ? '3h' : `${task.reminder_minutes_before} min`)
                        : null

                      return (
                        <motion.div
                          key={task.id}
                          variants={itemVariants}
                          className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                            alreadyInPlan
                              ? 'bg-bg-muted border-border'
                              : 'bg-bg-elevated border-border hover:border-border-strong'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <PriorityBadge priority={task.priority} />
                            <span className={`text-sm truncate ${alreadyInPlan ? 'text-text-subtle' : 'text-text'}`}>
                              {task.title}
                            </span>
                            {isRecurringSuggestion && (
                              <span className="inline-flex items-center gap-1 text-xs text-accent bg-accent-soft px-1.5 py-0.5 rounded-full flex-shrink-0">
                                <Repeat2 className="w-3 h-3" />
                              </span>
                            )}
                            {task.source === 'jira' && task.external_key && (
                              <span className="text-xs text-accent font-mono flex-shrink-0">{task.external_key}</span>
                            )}
                            {meetingTime && (
                              <span className="inline-flex items-center gap-1 text-xs text-[var(--info)] bg-[var(--info-soft)] px-1.5 py-0.5 rounded-full flex-shrink-0">
                                <Clock className="w-3 h-3" />
                                {meetingTime}
                              </span>
                            )}
                            {reminderLabel && (
                              <span className="inline-flex items-center gap-1 text-xs text-[var(--warning)] bg-warning-soft px-1.5 py-0.5 rounded-full flex-shrink-0">
                                <Bell className="w-3 h-3" />
                                {reminderLabel}
                              </span>
                            )}
                            {task.tag && (
                              <span className="inline-flex items-center gap-1 text-xs text-[var(--warning)] bg-warning-soft px-1.5 py-0.5 rounded-full flex-shrink-0">
                                <Tag className="w-3 h-3" />
                                {task.tag}
                              </span>
                            )}
                            {safeExternalUrl && (
                              <a
                                href={safeExternalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-accent hover:text-[var(--accent-hover)] flex-shrink-0"
                                title={safeExternalUrl}
                              >
                                Enlace
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            {project && (
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
                            )}
                            {alreadyInPlan && (
                              <span className="text-xs text-[var(--success)] font-medium flex-shrink-0">✓ En el plan</span>
                            )}
                          </div>
                          {alreadyInPlan ? (
                            <button disabled className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-muted text-text-subtle text-xs font-medium rounded-lg flex-shrink-0 ml-3 cursor-not-allowed">
                              <Plus className="w-3 h-3" /> Añadida
                            </button>
                          ) : addingTaskId === task.id ? (
                            <button disabled className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/60 text-accent-fg text-xs font-medium rounded-lg flex-shrink-0 ml-3 cursor-wait">
                              <span className="w-3 h-3 border-2 border-accent-fg/40 border-t-accent-fg rounded-full animate-spin" />
                              Añadiendo...
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAddToToday(task)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-accent-fg text-xs font-medium rounded-lg hover:bg-[var(--accent-hover)] flex-shrink-0 ml-3 transition-colors"
                            >
                              <Plus className="w-3 h-3" /> Añadir
                            </button>
                          )}
                        </motion.div>
                      )
                    })}
                  </motion.div>
                )}
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-border">
              <DayCloser
                completedCount={completedCount}
                rolledOverCount={tasks.length - completedCount}
                totalSeconds={totalSeconds}
                onCloseDay={handleCloseDay}
              />
            </div>
          </>
        )}
      </div>

      {pendingEmotionAction && pendingEmotionTask && (
        <TaskEmotionModal
          taskTitle={pendingEmotionTask.title_snapshot}
          phase={pendingEmotionAction.phase}
          onClose={() => setPendingEmotionAction(null)}
          onSkip={() => continuePendingEmotionAction(pendingEmotionAction)}
          onSave={handleSaveTaskEmotion}
        />
      )}
    </div>
  )
}

function TaskEmotionModal({
  taskTitle,
  phase,
  onClose,
  onSkip,
  onSave,
}: {
  taskTitle: string
  phase: TaskEmotionPhase
  onClose: () => void
  onSkip: () => void
  onSave: (data: { emotion: string; valence: EmotionValence; intensity: number; energy: EmotionEnergy; note?: string | null }) => Promise<void>
}) {
  const [emotion, setEmotion] = useState('calma')
  const [valence, setValence] = useState<EmotionValence>('pleasant')
  const [intensity, setIntensity] = useState(5)
  const [energy, setEnergy] = useState<EmotionEnergy>('medium')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const title = phase === 'before' ? 'Antes de empezar' : 'Después de terminar'

  const selectEmotion = (value: string) => {
    const option = taskEmotionOptions.find((item) => item.value === value)
    setEmotion(value)
    if (option) setValence(option.valence)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({ emotion, valence, intensity, energy, note: note.trim() || null })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen onClose={onClose} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">{title}</p>
          <h2 className="text-lg font-semibold text-text mt-1">{taskTitle}</h2>
          <p className="text-sm text-text-muted mt-1">Registra una señal rápida para detectar patrones reales.</p>
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-text mb-2">Emoción</legend>
          <div className="flex flex-wrap gap-2">
            {taskEmotionOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => selectEmotion(option.value)}
                aria-pressed={emotion === option.value}
                className={`px-3 py-2 rounded-full border text-sm font-medium transition-colors ${
                  emotion === option.value
                    ? 'bg-accent-soft border-accent text-accent'
                    : 'border-border text-text-muted hover:text-text hover:bg-bg-muted'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="task-emotion-energy" className="block text-xs font-medium text-text-subtle mb-1">Energía</label>
            <select id="task-emotion-energy" value={energy} onChange={(e) => setEnergy(e.target.value as EmotionEnergy)} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg-elevated text-text focus:outline-none focus:ring-2 focus:ring-accent">
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
            </select>
          </div>
          <div>
            <label htmlFor="task-emotion-valence" className="block text-xs font-medium text-text-subtle mb-1">Valencia</label>
            <select id="task-emotion-valence" value={valence} onChange={(e) => setValence(e.target.value as EmotionValence)} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg-elevated text-text focus:outline-none focus:ring-2 focus:ring-accent">
              <option value="pleasant">Agradable</option>
              <option value="neutral">Neutra</option>
              <option value="unpleasant">Desagradable</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="task-emotion-intensity" className="flex items-center justify-between text-sm font-medium text-text mb-2">
            Intensidad
            <span className="font-mono text-accent">{intensity}/10</span>
          </label>
          <input id="task-emotion-intensity" type="range" min="1" max="10" value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} className="w-full accent-[var(--accent)]" />
        </div>

        <div>
          <label htmlFor="task-emotion-note" className="block text-sm font-medium text-text mb-1">Nota opcional</label>
          <textarea id="task-emotion-note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={500} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg-elevated text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent resize-none" placeholder="¿Qué noto ahora?" />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" onClick={onSkip} disabled={saving} className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text hover:bg-bg-muted rounded-lg transition-colors disabled:opacity-60">
            Omitir
          </button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-accent text-accent-fg text-sm font-semibold rounded-lg hover:bg-[var(--accent-hover)] disabled:opacity-60 transition-colors">
            {saving ? 'Guardando...' : phase === 'before' ? 'Guardar e iniciar' : 'Guardar y finalizar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
