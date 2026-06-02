'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import {
  FileText,
  Link2,
  Image,
  Mic,
  Layers,
  CheckCircle2,
  Archive,
  Trash2,
  ExternalLink,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { AttachmentPreview } from './AttachmentPreview'
import type { Capture, CaptureType, CaptureStatus } from '@/lib/types'

interface CaptureCardProps {
  capture: Capture
  onUpdate: (capture: Capture) => void
  onDelete: (capture: Capture) => void
  onConvertToTask: (capture: Capture) => void
}

const TYPE_ICONS: Record<CaptureType, typeof FileText> = {
  text: FileText,
  url: Link2,
  image: Image,
  voice: Mic,
  mixed: Layers,
}

const STATUS_BADGES: Record<CaptureStatus, { label: string; className: string }> = {
  inbox: { label: 'Inbox', className: 'bg-warning-soft text-[var(--warning)]' },
  reviewed: { label: 'Revisada', className: 'bg-info-soft text-[var(--info)]' },
  converted: { label: 'Convertida', className: 'bg-success-soft text-[var(--success)]' },
  archived: { label: 'Archivada', className: 'bg-bg-muted text-text-muted' },
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function CaptureCard({ capture, onUpdate, onDelete, onConvertToTask }: CaptureCardProps) {
  const [showActions, setShowActions] = useState(false)
  const [loading, setLoading] = useState(false)
  const Icon = TYPE_ICONS[capture.capture_type] || FileText
  const badge = STATUS_BADGES[capture.status]

  const handleAction = async (action: () => Promise<Capture | void>) => {
    setLoading(true)
    try {
      const result = await action()
      if (result) onUpdate(result as Capture)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setShowActions(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className={cn(
        'bg-bg-elevated border border-border rounded-2xl p-4 transition-colors',
        capture.status === 'archived' && 'opacity-60',
        capture.status === 'converted' && 'border-success-soft/40'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'p-2 rounded-xl flex-shrink-0',
          capture.capture_type === 'url' && 'bg-info-soft text-[var(--info)]',
          capture.capture_type === 'image' && 'bg-accent-soft text-accent',
          capture.capture_type === 'voice' && 'bg-warning-soft text-[var(--warning)]',
          capture.capture_type === 'mixed' && 'bg-purple-500/10 text-purple-500',
          capture.capture_type === 'text' && 'bg-bg-muted text-text-muted'
        )}>
          <Icon className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {capture.title && (
                <h3 className="text-base font-semibold text-text truncate">{capture.title}</h3>
              )}
              {capture.content && (
                <p className="text-sm text-text mt-0.5 whitespace-pre-wrap break-words">{capture.content}</p>
              )}
              {capture.source_url && (
                <a
                  href={capture.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-1 text-xs text-accent hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="truncate max-w-xs">{capture.source_url}</span>
                </a>
              )}
              {capture.transcript && (
                <p className="text-xs text-text-muted mt-1 italic line-clamp-2">{capture.transcript}</p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', badge.className)}>
                {badge.label}
              </span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowActions(!showActions)}
                  className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-bg-muted transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {showActions && (
                  <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-border bg-bg-elevated shadow-xl z-10 overflow-hidden">
                    {capture.status === 'inbox' && (
                      <button
                        type="button"
                        onClick={() => handleAction(() => api.captures.review(capture.id))}
                        disabled={loading}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-bg-muted"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Marcar revisada
                      </button>
                    )}
                    {capture.status !== 'converted' && (
                      <button
                        type="button"
                        onClick={() => onConvertToTask(capture)}
                        disabled={loading}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-bg-muted"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Convertir a tarea
                      </button>
                    )}
                    {capture.status !== 'archived' && (
                      <button
                        type="button"
                        onClick={() => handleAction(() => api.captures.archive(capture.id))}
                        disabled={loading}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-bg-muted"
                      >
                        <Archive className="w-4 h-4" />
                        Archivar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDelete(capture)}
                      disabled={loading}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger-soft/40"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {capture.attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {capture.attachments.map((att) => (
                <AttachmentPreview key={att.id} attachment={att} captureId={capture.id} />
              ))}
            </div>
          )}

          {capture.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {capture.tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded-md bg-bg-muted text-xs text-text-muted">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <p className="text-xs text-text-muted mt-2">{formatDate(capture.created_at)}</p>
        </div>
      </div>
    </motion.div>
  )
}
