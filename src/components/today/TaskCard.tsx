'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { DailyTask, DailyTaskStatus, Priority } from '@/lib/types'
import { ProjectBadge } from '@/components/tasks/ProjectBadge'
import { PriorityBadge } from '@/components/tasks/PriorityBadge'
import { StatusBadge } from '@/components/tasks/StatusBadge'
import { CategoryPicker } from '@/components/tasks/CategoryPicker'
import { TaskTimer } from '@/components/today/TaskTimer'
import { SubtaskList } from '@/components/today/SubtaskList'
import { TaskComments } from '@/components/today/TaskComments'
import { Modal } from '@/components/shared/Modal'
import { formatDuration, normalizeExternalUrl, projectTypeLabel } from '@/lib/utils'
import { ChevronDown, ChevronRight, CheckCircle2, Repeat2, X, FileText, RotateCcw, AlertTriangle, ExternalLink, Tag, Plus, Bell } from 'lucide-react'

interface TaskCardProps {
  task: DailyTask
  activeSessionStartedAt?: string | null
  timerBusy?: boolean
  onUpdateStatus: (taskId: string, status: DailyTaskStatus) => void
  onToggleSubtask: (subtaskId: string) => void
  onAddSubtask?: (taskId: string, title: string) => void
  onUpdateSubtask?: (taskId: string, subtaskId: string, data: { title?: string; priority?: Priority }) => void
  onUpdateDescription?: (taskId: string, description: string) => Promise<void> | void
  onUpdateCategory?: (taskId: string, data: { category: string | null; due_date?: string | null; meeting_time?: string | null; reminder_minutes_before?: number | null }) => Promise<void> | void
  onRemove?: (taskId: string) => void
  onStartTimer: (taskId: string) => void
  onPauseTimer: (taskId: string) => void
  onResumeTimer: (taskId: string) => void
  onResetTimer: (taskId: string) => void
}

export function TaskCard({
  task,
  activeSessionStartedAt,
  timerBusy,
  onUpdateStatus,
  onToggleSubtask,
  onAddSubtask,
  onUpdateSubtask,
  onUpdateDescription,
  onUpdateCategory,
  onRemove,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onResetTimer,
}: TaskCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [descriptionOpen, setDescriptionOpen] = useState(false)
  const [descriptionDraft, setDescriptionDraft] = useState('')
  const [descriptionEditing, setDescriptionEditing] = useState(false)
  const [descriptionSaving, setDescriptionSaving] = useState(false)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)

  const isActive = task.status === 'in_progress' || task.status === 'paused'
  const isCompleted = task.status === 'completed'
  const isRecurring = !!task.recurring_task_id
  const hasDescription = !!task.description && task.description.trim().length > 0
  const canEditDescription = !!onUpdateDescription && !!task.task_id
  const safeExternalUrl = normalizeExternalUrl(task.external_url)
  const emotionBefore = task.emotion_entries?.find((entry) => entry.task_phase === 'before')
  const emotionAfter = task.emotion_entries?.find((entry) => entry.task_phase === 'after')
  const displaySeconds = task.live_total_seconds ?? task.total_seconds

  const openDescription = () => {
    setDescriptionDraft(task.description ?? '')
    setDescriptionEditing(!hasDescription && canEditDescription)
    setDescriptionOpen(true)
  }

  const closeDescription = () => {
    setDescriptionOpen(false)
    setDescriptionEditing(false)
  }

  const handleSaveDescription = async () => {
    if (!onUpdateDescription || !task.task_id) return
    setDescriptionSaving(true)
    try {
      await onUpdateDescription(task.task_id, descriptionDraft)
      setDescriptionEditing(false)
      if (!descriptionDraft.trim()) setDescriptionOpen(false)
    } catch (err) {
      console.error('Failed to save description:', err)
    } finally {
      setDescriptionSaving(false)
    }
  }

  const timerStatus: 'idle' | 'running' | 'paused' =
    task.status === 'in_progress' ? 'running' : task.status === 'paused' ? 'paused' : 'idle'

  const handleComplete = () => {
    if (isCompleted) return
    onUpdateStatus(task.id, 'completed')
  }

  const handleResetRequest = () => setResetConfirmOpen(true)

  const handleResetConfirm = () => {
    setResetConfirmOpen(false)
    onResetTimer(task.id)
  }

  const actionButtons = (
    <>
      {!isCompleted && task.status !== 'in_progress' && task.status !== 'paused' && (
        <button
          onClick={() => onStartTimer(task.id)}
          disabled={timerBusy}
          className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-accent text-accent-fg text-xs font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors whitespace-nowrap disabled:opacity-60"
        >
          Iniciar
        </button>
      )}
      {!isCompleted && (
        <button
          onClick={handleComplete}
          className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-success-soft text-[var(--success)] text-xs font-medium rounded-lg hover:bg-[var(--success)] hover:text-[var(--success-fg)] transition-colors whitespace-nowrap"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Finalizar
        </button>
      )}
      {isRecurring && !isCompleted && onRemove && (
        <button
          onClick={() => onRemove(task.id)}
          className="flex items-center justify-center gap-1.5 px-3 py-2 text-text-subtle hover:text-danger hover:bg-danger-soft text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
          title="Quitar del plan"
        >
          <X className="w-3.5 h-3.5" />
          Quitar
        </button>
      )}
    </>
  )

  return (
    <motion.div
      layout="position"
      whileHover={!isCompleted ? { y: -2 } : {}}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={`relative bg-bg-elevated rounded-xl border transition-all duration-200 overflow-hidden ${
        isActive
          ? 'border-accent shadow-[var(--shadow-glow)]'
          : isCompleted
          ? 'border-border opacity-70'
          : 'border-border hover:border-border-strong hover:shadow-[var(--shadow-md)]'
      }`}
    >
      {/* Active gradient overlay */}
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-br from-accent-soft/30 via-transparent to-transparent pointer-events-none rounded-xl" />
      )}

      <div className="relative p-4">
        <div className="flex items-start gap-3 md:gap-4">
          <button
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? 'Colapsar' : 'Expandir'}
            className="-m-1 touch-target text-text-subtle hover:text-text-muted transition-colors flex-shrink-0"
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3
                    className={`font-semibold text-base ${
                      isCompleted ? 'text-text-subtle line-through' : 'text-text'
                    }`}
                  >
                    {task.title_snapshot}
                  </h3>
                  {(hasDescription || canEditDescription) && (
                    <button
                      onClick={openDescription}
                      className={`flex items-center gap-1 text-xs transition-colors p-0.5 rounded-md hover:bg-accent-soft ${
                        hasDescription ? 'text-text-subtle hover:text-accent' : 'text-text-subtle/60 hover:text-accent'
                      }`}
                      title={hasDescription ? 'Ver descripción' : 'Añadir descripción'}
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {safeExternalUrl && (
                    <a
                      href={safeExternalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs font-mono text-accent hover:text-[var(--accent-hover)] hover:bg-accent-soft px-1.5 py-0.5 rounded-md transition-colors whitespace-nowrap flex-shrink-0"
                      title={safeExternalUrl}
                    >
                      {task.external_key || 'Abrir'}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {isRecurring && (
                    <span className="flex items-center gap-1 text-xs text-accent bg-accent-soft px-1.5 py-0.5 rounded-full flex-shrink-0" title="Tarea recurrente">
                      <Repeat2 className="w-3 h-3" />
                    </span>
                  )}
                  {task.tag && (
                    <span className="flex items-center gap-1 text-xs text-[var(--warning)] bg-warning-soft px-1.5 py-0.5 rounded-full flex-shrink-0" title="Tag">
                      <Tag className="w-3 h-3" />
                      {task.tag}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <ProjectBadge project={task.project} />
                  <PriorityBadge priority={task.priority} />
                  <StatusBadge status={task.status} />
                  <CategoryPicker
                    category={task.category}
                    dueDate={task.due_date}
                    meetingTime={task.meeting_time}
                    reminderMinutesBefore={task.reminder_minutes_before}
                    editable={!!onUpdateCategory && !!task.task_id}
                    onUpdate={
                      onUpdateCategory && task.task_id
                        ? (data) => onUpdateCategory(task.task_id as string, data)
                        : undefined
                    }
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
                  {displaySeconds > 0 && (
                    <span className="text-xs px-2 py-0.5 bg-bg-muted text-text-subtle rounded-full font-mono">
                      Real {formatDuration(displaySeconds)}
                    </span>
                  )}
                  {emotionBefore && (
                    <span className="text-xs px-2 py-0.5 bg-warning-soft text-[var(--warning)] rounded-full">
                      Antes: {emotionBefore.emotion} · {emotionBefore.energy}
                    </span>
                  )}
                  {emotionAfter && (
                    <span className="text-xs px-2 py-0.5 bg-success-soft text-[var(--success)] rounded-full">
                      Después: {emotionAfter.emotion} · {emotionAfter.energy}
                    </span>
                  )}
                </div>

                {isRecurring && !expanded && !isCompleted && (
                  <button
                    type="button"
                    onClick={() => setExpanded(true)}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-[var(--accent-hover)] hover:bg-accent-soft px-2 py-1 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Añadir subtareas del día
                  </button>
                )}
              </div>

              {task.project && (
                <div className="hidden md:flex items-center gap-1 text-xs text-text-subtle flex-shrink-0">
                  {projectTypeLabel(task.project.type)}
                </div>
              )}
            </div>

            {isActive && (
              <div className="mt-3 pt-3 border-t border-border">
                <TaskTimer
                  baseSeconds={task.total_seconds}
                  activeSessionStartedAt={activeSessionStartedAt}
                  status={timerStatus}
                  onStart={() => onStartTimer(task.id)}
                  onPause={() => onPauseTimer(task.id)}
                  onResume={() => onResumeTimer(task.id)}
                  onReset={handleResetRequest}
                  disabled={timerBusy}
                />
              </div>
            )}

            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  key="expanded"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  <SubtaskList
                    subtasks={task.subtasks}
                    onToggleStatus={onToggleSubtask}
                    onAddSubtask={onAddSubtask ? (title) => onAddSubtask(task.id, title) : undefined}
                    onUpdateSubtask={
                      onUpdateSubtask ? (subtaskId, data) => onUpdateSubtask(task.id, subtaskId, data) : undefined
                    }
                  />
                  <TaskComments taskId={task.task_id} recurringTaskId={task.recurring_task_id} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="hidden md:flex flex-col gap-2 flex-shrink-0">
            {actionButtons}
          </div>
        </div>

        {/* Mobile-only actions row */}
        <div className="md:hidden mt-3 flex flex-row flex-wrap gap-2">
          {actionButtons}
        </div>
      </div>

      <Modal isOpen={descriptionOpen} onClose={closeDescription} maxWidth="max-w-2xl">
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-text-subtle mb-1">
                <FileText className="w-3.5 h-3.5" />
                Descripción
              </div>
              <h2 className="text-lg font-semibold text-text truncate">{task.title_snapshot}</h2>
            </div>
            <button
              onClick={closeDescription}
              className="p-1.5 text-text-subtle hover:text-text hover:bg-bg-muted rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {descriptionEditing ? (
            <textarea
              value={descriptionDraft}
              onChange={(e) => setDescriptionDraft(e.target.value)}
              placeholder="Escribe una descripción para esta tarea..."
              rows={10}
              className="w-full text-sm px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-bg-elevated text-text placeholder:text-text-subtle resize-y max-h-[60vh]"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSaveDescription()
                if (e.key === 'Escape') {
                  if (hasDescription) {
                    setDescriptionEditing(false)
                    setDescriptionDraft(task.description ?? '')
                  } else {
                    closeDescription()
                  }
                }
              }}
            />
          ) : hasDescription ? (
            <div className="text-sm text-text-muted whitespace-pre-wrap max-h-[60vh] overflow-y-auto">
              {task.description}
            </div>
          ) : (
            <p className="text-sm text-text-subtle italic">Esta tarea no tiene descripción.</p>
          )}

          <div className="flex items-center justify-end gap-2 mt-5">
            {descriptionEditing ? (
              <>
                <button
                  onClick={() => {
                    if (hasDescription) {
                      setDescriptionEditing(false)
                      setDescriptionDraft(task.description ?? '')
                    } else {
                      closeDescription()
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text hover:bg-bg-muted rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveDescription}
                  disabled={descriptionSaving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-accent text-accent-fg text-sm font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-60"
                >
                  {descriptionSaving ? 'Guardando...' : 'Guardar'}
                </button>
              </>
            ) : (
              canEditDescription && (
                <button
                  onClick={() => {
                    setDescriptionDraft(task.description ?? '')
                    setDescriptionEditing(true)
                  }}
                  className="px-4 py-2 text-sm font-medium text-accent hover:bg-accent-soft rounded-lg transition-colors"
                >
                  {hasDescription ? 'Editar' : 'Añadir descripción'}
                </button>
              )
            )}
          </div>
        </div>
      </Modal>

      <Modal isOpen={resetConfirmOpen} onClose={() => setResetConfirmOpen(false)} maxWidth="max-w-sm">
        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-warning-soft flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-[var(--warning)]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-text">¿Reiniciar el conteo?</h2>
              <p className="text-sm text-text-muted mt-1">
                Se perderá el tiempo registrado{(() => { const s = task.live_total_seconds ?? task.total_seconds; return s > 0 ? ` (${formatDuration(s)})` : '' })()}. Esta acción no se puede deshacer.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 mt-5">
            <button
              onClick={() => setResetConfirmOpen(false)}
              className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text hover:bg-bg-muted rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleResetConfirm}
              disabled={timerBusy}
              className="flex items-center gap-1.5 px-4 py-2 bg-danger-soft text-[var(--danger)] text-sm font-medium rounded-lg hover:bg-[var(--danger)] hover:text-[var(--danger-fg)] transition-colors disabled:opacity-60"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reiniciar
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  )
}
