'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { DailySubtask, Priority } from '@/lib/types'
import { SubtaskItem } from './SubtaskItem'
import { Plus } from 'lucide-react'

interface SubtaskListProps {
  subtasks: DailySubtask[]
  onToggleStatus: (subtaskId: string) => void
  onAddSubtask?: (title: string) => void
  onUpdateSubtask?: (subtaskId: string, data: { title?: string; priority?: Priority }) => void
}

export function SubtaskList({ subtasks, onToggleStatus, onAddSubtask, onUpdateSubtask }: SubtaskListProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const handleAdd = () => {
    if (newTitle.trim() && onAddSubtask) {
      onAddSubtask(newTitle.trim())
      setNewTitle('')
      setIsAdding(false)
    }
  }

  const completedCount = subtasks.filter((s) => s.status === 'completed').length
  const totalCount = subtasks.length

  if (totalCount === 0 && !onAddSubtask) return null

  return (
    <div className="mt-3 pl-4 border-l-2 border-border space-y-1">
      {totalCount > 0 && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-text-subtle">
            Subtareas ({completedCount}/{totalCount})
          </span>
          <div className="w-24 h-1.5 bg-bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[var(--success)] rounded-full"
              initial={false}
              animate={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            />
          </div>
        </div>
      )}

      <AnimatePresence initial={false}>
        {subtasks
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((subtask) => (
            <SubtaskItem
              key={subtask.id}
              subtask={subtask}
              onToggleStatus={() => onToggleStatus(subtask.id)}
              onUpdate={onUpdateSubtask ? (data) => onUpdateSubtask(subtask.id, data) : undefined}
            />
          ))}
      </AnimatePresence>

      {onAddSubtask && (
        <div className="pt-1">
          <AnimatePresence mode="wait">
            {isAdding ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAdd()
                    if (e.key === 'Escape') setIsAdding(false)
                  }}
                  placeholder="Nueva subtarea..."
                  className="flex-1 text-sm px-3 py-1.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-bg-elevated text-text placeholder:text-text-subtle"
                  autoFocus
                />
                <button
                  onClick={handleAdd}
                  className="px-3 py-1.5 bg-accent text-accent-fg text-xs font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors"
                >
                  Añadir
                </button>
                <button
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-text-subtle text-xs hover:text-text transition-colors"
                >
                  Cancelar
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="trigger"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-1.5 text-xs text-text-subtle hover:text-accent py-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Añadir subtarea
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
