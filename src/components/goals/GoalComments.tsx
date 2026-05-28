'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { MessageSquare, Trash2, Edit2, Send } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { GoalComment as GoalCommentType } from '@/lib/types'
import { cn } from '@/lib/utils'

interface GoalCommentsProps {
  comments: GoalCommentType[]
  onAdd: (content: string) => Promise<void>
  onUpdate: (commentId: string, content: string) => Promise<void>
  onDelete: (commentId: string) => Promise<void>
}

export function GoalComments({ comments, onAdd, onUpdate, onDelete }: GoalCommentsProps) {
  const [newComment, setNewComment] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleAdd = async () => {
    if (!newComment.trim()) return
    setSubmitting(true)
    try {
      await onAdd(newComment.trim())
      setNewComment('')
    } catch (err) {
      console.error('Failed to add comment:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return
    try {
      await onUpdate(commentId, editContent.trim())
      setEditingId(null)
      setEditContent('')
    } catch (err) {
      console.error('Failed to update comment:', err)
    }
  }

  const sortedComments = [...comments].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const inputClass = 'w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-bg-elevated text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent'

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-text flex items-center gap-2">
        <MessageSquare className="w-4 h-4" />
        Comentarios y notas ({comments.length})
      </h3>

      <div className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Añadir una nota..."
          className={cn(inputClass, 'flex-1')}
        />
        <button
          onClick={handleAdd}
          disabled={submitting || !newComment.trim()}
          className="px-3 py-2.5 bg-accent text-accent-fg rounded-lg hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {sortedComments.map((comment) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-bg-muted rounded-lg"
            >
              {editingId === comment.id ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEdit(comment.id)
                      if (e.key === 'Escape') { setEditingId(null); setEditContent('') }
                    }}
                    className="flex-1 px-2 py-1 border border-accent rounded text-sm bg-bg-elevated text-text focus:outline-none focus:ring-2 focus:ring-accent"
                    autoFocus
                  />
                  <button onClick={() => handleEdit(comment.id)} className="px-2 py-1 bg-accent text-accent-fg text-xs font-medium rounded">Guardar</button>
                  <button onClick={() => { setEditingId(null); setEditContent('') }} className="px-2 py-1 border border-border text-text-muted text-xs font-medium rounded">Cancelar</button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-text">{comment.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-text-subtle">
                      {formatDistanceToNow(new Date(comment.created_at), { locale: es, addSuffix: true })}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditingId(comment.id); setEditContent(comment.content) }}
                        className="p-1 text-text-subtle hover:text-text transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onDelete(comment.id)}
                        className="p-1 text-text-subtle hover:text-danger transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
