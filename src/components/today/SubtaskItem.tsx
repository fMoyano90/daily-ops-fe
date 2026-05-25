'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { DailySubtask, Priority } from '@/lib/types'
import { PriorityBadge } from '@/components/tasks/PriorityBadge'
import { Check, Circle, Loader2, X, Pencil } from 'lucide-react'

interface SubtaskItemProps {
  subtask: DailySubtask
  onToggleStatus: () => void
  onUpdate?: (data: { title?: string; priority?: Priority }) => void
  onDelete?: () => void
}

const PRIORITIES: Priority[] = ['critical', 'high', 'medium', 'low']

export function SubtaskItem({ subtask, onToggleStatus, onUpdate, onDelete }: SubtaskItemProps) {
  const isCompleted = subtask.status === 'completed'
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(subtask.title)
  const [priorityOpen, setPriorityOpen] = useState(false)
  const priorityRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setEditTitle(subtask.title)
  }, [subtask.title])

  useEffect(() => {
    if (!priorityOpen) return
    const onClick = (e: MouseEvent) => {
      if (priorityRef.current && !priorityRef.current.contains(e.target as Node)) {
        setPriorityOpen(false)
      }
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [priorityOpen])

  const commitTitle = () => {
    const trimmed = editTitle.trim()
    if (trimmed && trimmed !== subtask.title && onUpdate) {
      onUpdate({ title: trimmed })
    } else {
      setEditTitle(subtask.title)
    }
    setIsEditing(false)
  }

  const cancelEdit = () => {
    setEditTitle(subtask.title)
    setIsEditing(false)
  }

  const changePriority = (priority: Priority) => {
    setPriorityOpen(false)
    if (priority !== subtask.priority && onUpdate) {
      onUpdate({ priority })
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8, height: 0, marginBottom: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="flex items-center gap-3 py-2 px-3 hover:bg-bg-muted rounded-lg group transition-colors"
    >
      <motion.button
        onClick={onToggleStatus}
        whileTap={{ scale: 0.85 }}
        whileHover={{ scale: 1.15 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className="flex-shrink-0"
      >
        <AnimatePresence mode="wait" initial={false}>
          {subtask.status === 'completed' ? (
            <motion.span
              key="check"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            >
              <Check className="w-4 h-4 text-[var(--success)]" />
            </motion.span>
          ) : subtask.status === 'in_progress' ? (
            <motion.span key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Loader2 className="w-4 h-4 text-[var(--info)] animate-spin" />
            </motion.span>
          ) : (
            <motion.span key="circle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Circle className="w-4 h-4 text-text-subtle" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {isEditing ? (
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitTitle()
            if (e.key === 'Escape') cancelEdit()
          }}
          className="flex-1 text-sm px-2 py-1 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-bg-elevated text-text"
          autoFocus
        />
      ) : (
        <button
          type="button"
          onClick={() => onUpdate && setIsEditing(true)}
          disabled={!onUpdate}
          className={`flex-1 text-left text-sm transition-colors ${
            isCompleted ? 'text-text-subtle line-through' : 'text-text-muted'
          } ${onUpdate ? 'hover:text-text cursor-text' : 'cursor-default'}`}
        >
          {subtask.title}
        </button>
      )}

      {onUpdate && !isEditing && (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="opacity-0 group-hover:opacity-100 p-1 text-text-subtle hover:text-accent transition-all"
          title="Editar título"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}

      <div className="relative" ref={priorityRef}>
        <button
          type="button"
          onClick={() => onUpdate && setPriorityOpen((v) => !v)}
          disabled={!onUpdate}
          className={onUpdate ? 'cursor-pointer' : 'cursor-default'}
          title={onUpdate ? 'Cambiar prioridad' : undefined}
        >
          <PriorityBadge priority={subtask.priority} size="sm" />
        </button>
        <AnimatePresence>
          {priorityOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.96 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-full mt-1 z-20 bg-bg-elevated border border-border rounded-lg shadow-[var(--shadow-md)] p-1 min-w-[120px]"
            >
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => changePriority(p)}
                  className={`w-full flex items-center px-2 py-1 rounded-md hover:bg-bg-muted transition-colors ${
                    p === subtask.priority ? 'bg-bg-muted' : ''
                  }`}
                >
                  <PriorityBadge priority={p} size="sm" />
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {onDelete && (
        <motion.button
          onClick={onDelete}
          initial={{ opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          className="opacity-0 group-hover:opacity-100 p-1 text-text-subtle hover:text-danger transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </motion.button>
      )}
    </motion.div>
  )
}
