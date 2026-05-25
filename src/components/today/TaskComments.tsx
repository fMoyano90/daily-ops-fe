'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { TaskComment } from '@/lib/types'
import { api } from '@/lib/api'
import { MessageSquare, Plus, Pencil, Trash2, Check, X, Loader2 } from 'lucide-react'

interface TaskCommentsProps {
  taskId?: string | null
  recurringTaskId?: string | null
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleString('es-CL', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function TaskComments({ taskId, recurringTaskId }: TaskCommentsProps) {
  const [comments, setComments] = useState<TaskComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const canPersist = !!taskId || !!recurringTaskId

  useEffect(() => {
    if (!canPersist) {
      setComments([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    const loader = taskId
      ? api.taskComments.listForTask(taskId)
      : api.taskComments.listForRecurring(recurringTaskId as string)
    loader
      .then((data) => {
        if (!cancelled) setComments(data)
      })
      .catch((err) => {
        console.error('Failed to load comments:', err)
        if (!cancelled) setError('No se pudieron cargar los comentarios')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [taskId, recurringTaskId, canPersist])

  const handleAdd = async () => {
    const content = newContent.trim()
    if (!content || !canPersist || saving) return
    setSaving(true)
    try {
      const created = taskId
        ? await api.taskComments.createForTask(taskId, content)
        : await api.taskComments.createForRecurring(recurringTaskId as string, content)
      setComments((prev) => [created, ...prev])
      setNewContent('')
      setIsAdding(false)
    } catch (err) {
      console.error('Failed to add comment:', err)
      setError('No se pudo guardar el comentario')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (comment: TaskComment) => {
    setEditingId(comment.id)
    setEditContent(comment.content)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditContent('')
  }

  const handleSaveEdit = async () => {
    if (!editingId) return
    const content = editContent.trim()
    if (!content) return
    setSaving(true)
    try {
      const updated = await api.taskComments.update(editingId, content)
      setComments((prev) => prev.map((c) => (c.id === editingId ? updated : c)))
      cancelEdit()
    } catch (err) {
      console.error('Failed to update comment:', err)
      setError('No se pudo actualizar el comentario')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('¿Eliminar este comentario?')) return
    const prev = comments
    setComments((curr) => curr.filter((c) => c.id !== commentId))
    try {
      await api.taskComments.delete(commentId)
    } catch (err) {
      console.error('Failed to delete comment:', err)
      setComments(prev)
      setError('No se pudo eliminar el comentario')
    }
  }

  if (!canPersist) {
    return (
      <div className="mt-3 pl-4 border-l-2 border-border">
        <p className="text-xs text-text-subtle italic py-2">
          Esta tarea no admite comentarios persistentes.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-4 pl-4 border-l-2 border-border space-y-2">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-text-subtle">
          <MessageSquare className="w-3.5 h-3.5" />
          Comentarios ({comments.length})
        </span>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 text-xs text-accent hover:text-[var(--accent-hover)] font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Añadir
          </button>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="space-y-2"
          >
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Escribe una observación..."
              rows={3}
              className="w-full text-sm px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-bg-elevated text-text placeholder:text-text-subtle resize-y"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAdd()
                if (e.key === 'Escape') {
                  setIsAdding(false)
                  setNewContent('')
                }
              }}
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false)
                  setNewContent('')
                }}
                className="px-3 py-1.5 text-xs text-text-subtle hover:text-text transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={!newContent.trim() || saving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-accent-fg text-xs font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Guardar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-text-subtle py-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Cargando comentarios...
        </div>
      ) : comments.length === 0 && !isAdding ? (
        <p className="text-xs text-text-subtle italic py-2">
          Sin comentarios aún.
        </p>
      ) : (
        <AnimatePresence initial={false}>
          {comments.map((comment) => (
            <motion.div
              key={comment.id}
              layout
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="group bg-bg-muted/40 hover:bg-bg-muted rounded-lg p-3 transition-colors"
            >
              {editingId === comment.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    className="w-full text-sm px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-bg-elevated text-text resize-y"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSaveEdit()
                      if (e.key === 'Escape') cancelEdit()
                    }}
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-3 py-1 text-xs text-text-subtle hover:text-text transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={!editContent.trim() || saving}
                      className="flex items-center gap-1.5 px-3 py-1 bg-accent text-accent-fg text-xs font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-60"
                    >
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Guardar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-text whitespace-pre-wrap">{comment.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-text-subtle">
                      {formatTimestamp(comment.created_at)}
                      {comment.updated_at !== comment.created_at && ' · editado'}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => startEdit(comment)}
                        className="p-1 text-text-subtle hover:text-accent transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(comment.id)}
                        className="p-1 text-text-subtle hover:text-danger transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  )
}
