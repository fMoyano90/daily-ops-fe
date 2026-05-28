'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, Link2 } from 'lucide-react'
import { GoalStep, Task, Project } from '@/lib/types'
import { GoalStepItem } from './GoalStepItem'
import { TaskLinker } from './TaskLinker'

interface GoalStepListProps {
  steps: GoalStep[]
  tasks: Task[]
  projects: Project[]
  onAddStep: (data: Record<string, unknown>) => Promise<void>
  onUpdateStep: (stepId: string, data: Record<string, unknown>) => Promise<void>
  onDeleteStep: (stepId: string) => Promise<void>
  onToggleStep: (stepId: string) => Promise<void>
  onLinkTask: (taskId: string) => Promise<void>
}

export function GoalStepList({
  steps,
  tasks,
  projects,
  onAddStep,
  onUpdateStep,
  onDeleteStep,
  onToggleStep,
  onLinkTask,
}: GoalStepListProps) {
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [showLinker, setShowLinker] = useState(false)

  const handleAdd = async () => {
    if (!newTitle.trim()) return
    await onAddStep({ title: newTitle.trim(), sort_order: steps.length })
    setNewTitle('')
    setAdding(false)
  }

  const sortedSteps = [...steps].sort((a, b) => a.sort_order - b.sort_order)

  const inputClass = 'w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-bg-elevated text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text">
          Pasos ({steps.filter((s) => s.status === 'completed').length}/{steps.length})
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLinker(!showLinker)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent bg-accent-soft rounded-lg hover:bg-accent hover:text-accent-fg transition-colors"
          >
            <Link2 className="w-3 h-3" />
            Vincular tarea
          </button>
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent bg-accent-soft rounded-lg hover:bg-accent hover:text-accent-fg transition-colors"
          >
            <Plus className="w-3 h-3" />
            Añadir paso
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showLinker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-bg-muted rounded-lg border border-border">
              <TaskLinker
                onLink={onLinkTask}
                onClose={() => setShowLinker(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 p-3 bg-bg-muted rounded-lg border border-accent/30">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd()
                  if (e.key === 'Escape') { setAdding(false); setNewTitle('') }
                }}
                placeholder="Nuevo paso..."
                className={inputClass}
                autoFocus
              />
              <button onClick={handleAdd} className="px-3 py-2 bg-accent text-accent-fg text-sm font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors flex-shrink-0">
                Añadir
              </button>
              <button onClick={() => { setAdding(false); setNewTitle('') }} className="px-3 py-2 border border-border text-text-muted text-sm font-medium rounded-lg hover:bg-bg-muted transition-colors flex-shrink-0">
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {sortedSteps.map((step) => {
          const linkedTask = tasks.find((t) => t.id === step.linked_task_id)
          const linkedProject = linkedTask ? projects.find((p) => p.id === linkedTask.project_id) : undefined
          return (
            <GoalStepItem
              key={step.id}
              step={step}
              linkedTask={linkedTask}
              linkedProject={linkedProject}
              onToggle={() => onToggleStep(step.id)}
              onDelete={() => onDeleteStep(step.id)}
              onUpdate={(data) => onUpdateStep(step.id, data)}
            />
          )
        })}
      </div>

      {sortedSteps.length === 0 && !adding && (
        <div className="text-center py-8">
          <p className="text-sm text-text-subtle">No hay pasos aún</p>
          <p className="text-xs text-text-muted mt-1">Añade pasos o vincula tareas del backlog</p>
        </div>
      )}
    </div>
  )
}
