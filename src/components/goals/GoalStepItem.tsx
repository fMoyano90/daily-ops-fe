'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { CheckCircle2, Circle, Trash2, ExternalLink, Edit2, CalendarDays, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GoalStep, Task, Project } from '@/lib/types'
import { ProjectBadge } from '@/components/tasks/ProjectBadge'
import { PriorityBadge } from '@/components/tasks/PriorityBadge'
import { differenceInDays, format } from 'date-fns'
import { es } from 'date-fns/locale'

interface GoalStepItemProps {
  step: GoalStep
  linkedTask?: Task
  linkedProject?: Project
  onToggle: () => void
  onDelete: () => void
  onUpdate: (data: Record<string, unknown>) => void
}

export function GoalStepItem({ step, linkedTask, linkedProject, onToggle, onDelete, onUpdate }: GoalStepItemProps) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(step.title)
  const [dueDate, setDueDate] = useState(step.due_date || '')

  const handleSave = () => {
    if (title.trim()) {
      onUpdate({ title: title.trim(), due_date: dueDate || null })
      setEditing(false)
    }
  }

  const daysLeft = step.due_date ? differenceInDays(new Date(step.due_date), new Date()) : null
  const isOverdue = daysLeft !== null && daysLeft < 0 && step.status !== 'completed'

  return (
    <motion.div
      layout
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border transition-all',
        step.status === 'completed' ? 'bg-success-soft/30 border-success/20' : isOverdue ? 'bg-danger-soft/20 border-danger/30' : 'bg-bg-muted border-border'
      )}
    >
      <button
        onClick={onToggle}
        className="mt-0.5 flex-shrink-0"
      >
        {step.status === 'completed' ? (
          <CheckCircle2 className="w-5 h-5 text-[var(--success)]" />
        ) : step.status === 'in_progress' ? (
          <Circle className="w-5 h-5 text-accent" />
        ) : step.status === 'blocked' ? (
          <AlertCircle className="w-5 h-5 text-danger" />
        ) : (
          <Circle className="w-5 h-5 text-text-subtle" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="space-y-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
                if (e.key === 'Escape') { setEditing(false); setTitle(step.title) }
              }}
              className="w-full px-2 py-1 border border-accent rounded text-sm bg-bg-elevated text-text focus:outline-none focus:ring-2 focus:ring-accent"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="px-2 py-1 border border-border rounded text-xs bg-bg-elevated text-text focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button onClick={handleSave} className="px-2 py-1 bg-accent text-accent-fg text-xs font-medium rounded hover:bg-[var(--accent-hover)]">Guardar</button>
              <button onClick={() => { setEditing(false); setTitle(step.title) }} className="px-2 py-1 border border-border text-text-muted text-xs font-medium rounded hover:bg-bg-muted">Cancelar</button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className={cn(
                'text-sm',
                step.status === 'completed' ? 'text-text-subtle line-through' : 'text-text'
              )}>
                {step.title}
              </span>
              <button onClick={() => setEditing(true)} className="text-text-subtle hover:text-text">
                <Edit2 className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {step.due_date && (
                <span className={cn(
                  'text-xs flex items-center gap-1',
                  isOverdue ? 'text-danger' : 'text-text-subtle'
                )}>
                  <CalendarDays className="w-3 h-3" />
                  {format(new Date(step.due_date), 'd MMM', { locale: es })}
                  {daysLeft !== null && daysLeft >= 0 && step.status !== 'completed' && ` · ${daysLeft}d`}
                </span>
              )}
              {linkedTask && (
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" />
                  Tarea vinculada
                  {linkedProject && <ProjectBadge project={linkedProject} />}
                  <PriorityBadge priority={linkedTask.priority} />
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {!editing && (
        <button
          onClick={onDelete}
          className="text-text-subtle hover:text-danger transition-colors flex-shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  )
}
