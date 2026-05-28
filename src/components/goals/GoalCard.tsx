'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { CalendarDays, ChevronRight, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Goal, Project, GoalHorizon, GoalStatus } from '@/lib/types'
import { ProjectBadge } from '@/components/tasks/ProjectBadge'
import { differenceInDays, format } from 'date-fns'
import { es } from 'date-fns/locale'

interface GoalCardProps {
  goal: Goal
  projects: Project[]
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

const statusColors: Record<GoalStatus, string> = {
  active: 'bg-accent-soft text-accent',
  achieved: 'bg-success-soft text-[var(--success)]',
  paused: 'bg-warning-soft/50 text-[var(--warning, #f59e0b)]',
  abandoned: 'bg-bg-muted text-text-subtle',
}

export function GoalCard({ goal, projects }: GoalCardProps) {
  const project = projects.find((p) => p.id === goal.project_id)
  const daysLeft = differenceInDays(new Date(goal.target_date), new Date())
  const isOverdue = daysLeft < 0 && goal.status === 'active'
  const isUrgent = daysLeft <= 7 && daysLeft >= 0 && goal.status === 'active'

  const deadlineText = isOverdue
    ? `Vencida hace ${Math.abs(daysLeft)}d`
    : daysLeft === 0
      ? 'Vence hoy'
      : `Faltan ${daysLeft}d`

  const deadlineDate = format(new Date(goal.target_date), 'd MMM', { locale: es })

  return (
    <Link href={`/goals/${goal.id}`}>
      <motion.div
        className={cn(
          'bg-bg-elevated border border-border rounded-xl p-4 hover:border-border-strong hover:shadow-[var(--shadow-md)] transition-all group',
          isOverdue && 'border-danger/40'
        )}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <h3 className="text-sm font-semibold text-text truncate group-hover:text-accent transition-colors">
                {goal.title}
              </h3>
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0', horizonColors[goal.horizon])}>
                {horizonLabels[goal.horizon]}
              </span>
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0', statusColors[goal.status])}>
                {statusLabels[goal.status]}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {project && <ProjectBadge project={project} />}
              <span className={cn(
                'text-xs flex items-center gap-1 flex-shrink-0',
                isOverdue ? 'text-danger' : isUrgent ? 'text-[var(--warning, #f59e0b)]' : 'text-text-subtle'
              )}>
                <CalendarDays className="w-3 h-3" />
                {deadlineDate} · {deadlineText}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-text-subtle group-hover:text-accent transition-colors flex-shrink-0" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted flex items-center gap-1">
              <Target className="w-3 h-3" />
              Progreso
            </span>
            <span className="font-semibold text-text">{Math.round(goal.progress)}%</span>
          </div>
          <div className="h-2 bg-bg-muted rounded-full overflow-hidden">
            <motion.div
              className={cn(
                'h-full rounded-full transition-all',
                goal.progress >= 70 ? 'bg-[var(--success)]' : goal.progress >= 30 ? 'bg-[var(--warning, #f59e0b)]' : 'bg-danger'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${goal.progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>

          {goal.steps.length > 0 && (
            <p className="text-xs text-text-subtle">
              {goal.steps.filter((s) => s.status === 'completed').length}/{goal.steps.length} pasos completados
            </p>
          )}

          {goal.steps.length > 0 && (
            <div className="space-y-1 pt-1">
              {goal.steps.slice(0, 3).map((step) => (
                <div key={step.id} className="flex items-center gap-2 text-xs">
                  <span className={cn(
                    'w-1.5 h-1.5 rounded-full flex-shrink-0',
                    step.status === 'completed' ? 'bg-[var(--success)]' : step.status === 'in_progress' ? 'bg-accent' : step.status === 'blocked' ? 'bg-danger' : 'bg-border'
                  )} />
                  <span className={cn(
                    'truncate',
                    step.status === 'completed' ? 'text-text-subtle line-through' : 'text-text-muted'
                  )}>
                    {step.title}
                  </span>
                </div>
              ))}
              {goal.steps.length > 3 && (
                <p className="text-xs text-text-subtle pl-3.5">+{goal.steps.length - 3} más</p>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  )
}
