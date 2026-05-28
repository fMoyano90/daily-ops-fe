'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import { ArrowLeft, CalendarDays, Pause, Play, CheckCircle2, Trash2, Edit2 } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { api } from '@/lib/api'
import { Goal, GoalStatus, GoalHorizon, Task, Project } from '@/lib/types'
import { ProjectBadge } from '@/components/tasks/ProjectBadge'
import { GoalProgressRing } from './GoalProgressRing'
import { GoalStepList } from './GoalStepList'
import { GoalComments } from './GoalComments'
import { GoalAntiGoals } from './GoalAntiGoals'
import { GoalForm } from './GoalForm'
import { cn } from '@/lib/utils'

interface GoalDetailProps {
  goalId: string
}

const horizonLabels: Record<GoalHorizon, string> = {
  short: 'Corto plazo',
  medium: 'Mediano plazo',
  long: 'Largo plazo',
}

const horizonColors: Record<GoalHorizon, string> = {
  short: 'bg-emerald-500/15 text-emerald-500',
  medium: 'bg-amber-500/15 text-amber-500',
  long: 'bg-violet-500/15 text-violet-500',
}

const statusLabels: Record<GoalStatus, string> = {
  active: 'Activa',
  achieved: 'Lograda',
  paused: 'Pausada',
  abandoned: 'Abandonada',
}

export function GoalDetail({ goalId }: GoalDetailProps) {
  const router = useRouter()
  const [goal, setGoal] = useState<Goal | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [goalData, tasksList, projectsList] = await Promise.all([
        api.goals.get(goalId),
        api.tasks.list(),
        api.projects.list(),
      ])
      setGoal(goalData)
      setTasks(tasksList)
      setProjects(projectsList)
    } catch (err) {
      console.error('Failed to load goal:', err)
    } finally {
      setLoading(false)
    }
  }, [goalId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleUpdateGoal = async (data: Record<string, unknown>) => {
    await api.goals.update(goalId, data)
    await loadData()
  }

  const handleStatusChange = async (status: GoalStatus) => {
    if (status === 'achieved') {
      await api.goals.complete(goalId)
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
    } else if (status === 'active') {
      await api.goals.reopen(goalId)
    } else {
      await api.goals.update(goalId, { status })
    }
    await loadData()
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar esta meta?')) return
    await api.goals.delete(goalId)
    router.push('/goals')
  }

  const handleAddStep = async (data: Record<string, unknown>) => {
    await api.goals.steps.create(goalId, data)
    await loadData()
  }

  const handleUpdateStep = async (stepId: string, data: Record<string, unknown>) => {
    await api.goals.steps.update(goalId, stepId, data)
    await loadData()
  }

  const handleDeleteStep = async (stepId: string) => {
    await api.goals.steps.delete(goalId, stepId)
    await loadData()
  }

  const handleToggleStep = async (stepId: string) => {
    await api.goals.steps.complete(goalId, stepId)
    await loadData()
  }

  const handleLinkTask = async (taskId: string) => {
    await api.goals.steps.create(goalId, {
      title: tasks.find((t) => t.id === taskId)?.title || 'Tarea vinculada',
      linked_task_id: taskId,
      sort_order: goal?.steps.length || 0,
    })
    await loadData()
  }

  const handleAddComment = async (content: string) => {
    await api.goals.comments.create(goalId, content)
    await loadData()
  }

  const handleUpdateComment = async (commentId: string, content: string) => {
    await api.goals.comments.update(goalId, commentId, content)
    await loadData()
  }

  const handleDeleteComment = async (commentId: string) => {
    await api.goals.comments.delete(goalId, commentId)
    await loadData()
  }

  const handleSaveAntiGoals = async (content: string) => {
    await api.goals.update(goalId, { anti_goals: content })
    await loadData()
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <div className="w-20 h-8 bg-bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 flex justify-center">
            <div className="w-32 h-32 bg-bg-muted rounded-full animate-pulse" />
          </div>
          <div className="md:col-span-2 space-y-3">
            <div className="h-8 w-3/4 bg-bg-muted rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-bg-muted rounded animate-pulse" />
            <div className="h-4 w-full bg-bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto text-center">
        <p className="text-text-subtle">Meta no encontrada</p>
        <button onClick={() => router.push('/goals')} className="mt-4 text-accent hover:underline">
          Volver a metas
        </button>
      </div>
    )
  }

  const project = projects.find((p) => p.id === goal.project_id)
  const daysLeft = differenceInDays(new Date(goal.target_date), new Date())
  const isOverdue = daysLeft < 0 && goal.status === 'active'

  return (
    <div>
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/goals')}
            className="flex items-center gap-2 text-text-muted hover:text-text transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a metas
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFormOpen(true)}
              className="p-2 text-text-muted hover:text-text transition-colors"
              title="Editar meta"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            {goal.status === 'active' && (
              <button
                onClick={() => handleStatusChange('paused')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--warning, #f59e0b)] bg-warning-soft/50 rounded-lg hover:bg-[var(--warning, #f59e0b)] hover:text-white transition-colors"
              >
                <Pause className="w-3 h-3" />
                Pausar
              </button>
            )}
            {goal.status === 'paused' && (
              <button
                onClick={() => handleStatusChange('active')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent bg-accent-soft rounded-lg hover:bg-accent hover:text-accent-fg transition-colors"
              >
                <Play className="w-3 h-3" />
                Reanudar
              </button>
            )}
            {goal.status === 'active' && (
              <button
                onClick={() => handleStatusChange('achieved')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--success)] bg-success-soft rounded-lg hover:bg-[var(--success)] hover:text-white transition-colors"
              >
                <CheckCircle2 className="w-3 h-3" />
                Lograda
              </button>
            )}
            <button
              onClick={handleDelete}
              className="p-2 text-text-subtle hover:text-danger transition-colors"
              title="Eliminar meta"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 flex flex-col items-center justify-start">
            <GoalProgressRing progress={goal.progress} size={160} strokeWidth={10} />
            <div className="mt-4 text-center">
              <span className={cn('text-xs px-2 py-1 rounded-full font-medium', horizonColors[goal.horizon])}>
                {horizonLabels[goal.horizon]}
              </span>
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-text">{goal.title}</h1>
              {goal.description && (
                <p className="text-sm text-text-subtle mt-2 whitespace-pre-wrap">{goal.description}</p>
              )}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {project && <ProjectBadge project={project} />}
              <span className={cn(
                'text-xs px-2 py-1 rounded-full font-medium',
                goal.status === 'active' ? 'bg-accent-soft text-accent' :
                goal.status === 'achieved' ? 'bg-success-soft text-[var(--success)]' :
                goal.status === 'paused' ? 'bg-warning-soft/50 text-[var(--warning, #f59e0b)]' :
                'bg-bg-muted text-text-subtle'
              )}>
                {statusLabels[goal.status]}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-bg-muted rounded-lg">
                <p className="text-xs text-text-muted flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" />
                  Inicio
                </p>
                <p className="text-sm font-medium text-text mt-1">
                  {format(new Date(goal.start_date), 'd MMM yyyy', { locale: es })}
                </p>
              </div>
              <div className={cn(
                'p-3 rounded-lg',
                isOverdue ? 'bg-danger-soft/30' : 'bg-bg-muted'
              )}>
                <p className={cn(
                  'text-xs flex items-center gap-1',
                  isOverdue ? 'text-danger' : 'text-text-muted'
                )}>
                  <CalendarDays className="w-3 h-3" />
                  Fecha límite
                </p>
                <p className={cn('text-sm font-medium mt-1', isOverdue ? 'text-danger' : 'text-text')}>
                  {format(new Date(goal.target_date), 'd MMM yyyy', { locale: es })}
                  {isOverdue && ` (vencida hace ${Math.abs(daysLeft)}d)`}
                  {daysLeft >= 0 && goal.status === 'active' && ` (${daysLeft}d restantes)`}
                </p>
              </div>
            </div>

            {goal.key_results && (
              <div className="p-3 bg-bg-muted rounded-lg">
                <p className="text-xs font-medium text-text-muted mb-1">Key Results</p>
                <p className="text-sm text-text whitespace-pre-wrap">{goal.key_results}</p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border pt-6 space-y-8">
          <GoalStepList
            steps={goal.steps}
            tasks={tasks}
            projects={projects}
            onAddStep={handleAddStep}
            onUpdateStep={handleUpdateStep}
            onDeleteStep={handleDeleteStep}
            onToggleStep={handleToggleStep}
            onLinkTask={handleLinkTask}
          />

          <GoalAntiGoals content={goal.anti_goals} onSave={handleSaveAntiGoals} />

          <GoalComments
            comments={goal.comments}
            onAdd={handleAddComment}
            onUpdate={handleUpdateComment}
            onDelete={handleDeleteComment}
          />
        </div>
      </div>

      <GoalForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleUpdateGoal}
        projects={projects}
        initialData={goal}
      />
    </div>
  )
}
