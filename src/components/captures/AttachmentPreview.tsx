'use client'

import { useState, useEffect } from 'react'
import { Image, AudioLines, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import type { CaptureAttachment } from '@/lib/types'

interface AttachmentPreviewProps {
  attachment: CaptureAttachment
  captureId: string
  onRemove?: () => void
}

export function AttachmentPreview({ attachment, captureId, onRemove }: AttachmentPreviewProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    api.captures
      .getAttachmentUrl(captureId, attachment.id)
      .then((res) => {
        if (!cancelled) {
          console.log('Attachment URL loaded:', res.url)
          setUrl(res.url)
        }
      })
      .catch((err) => {
        console.error('Failed to load attachment URL:', err)
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [captureId, attachment.id])

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl border border-border bg-bg-muted">
        <Loader2 className="w-4 h-4 animate-spin text-text-muted" />
        <span className="text-sm text-text-muted">Cargando...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl border border-danger-soft/40 bg-danger-soft/20">
        <Image className="w-4 h-4 text-danger flex-shrink-0" />
        <span className="text-sm text-danger truncate">{attachment.file_name}</span>
        <span className="text-xs text-danger/70 ml-auto">Error al cargar</span>
      </div>
    )
  }

  if (attachment.kind === 'image' && url) {
    return (
      <div className="relative group rounded-xl overflow-hidden border border-border bg-bg-muted">
        <img
          src={url}
          alt={attachment.file_name}
          className="w-full max-h-80 object-contain cursor-pointer"
          onClick={() => window.open(url, '_blank')}
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
            const parent = target.parentElement
            if (parent) {
              parent.classList.add('flex', 'items-center', 'gap-2', 'p-3')
              const icon = document.createElement('div')
              icon.className = 'flex-shrink-0'
              icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-text-muted"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>'
              const text = document.createElement('span')
              text.className = 'text-sm text-text truncate'
              text.textContent = attachment.file_name
              parent.appendChild(icon)
              parent.appendChild(text)
            }
          }}
        />
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    )
  }

  if (attachment.kind === 'audio' && url) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-bg-muted">
        <AudioLines className="w-5 h-5 text-accent flex-shrink-0" />
        <audio src={url} controls className="flex-1 h-8" />
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1 rounded-full text-text-muted hover:text-danger transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 p-3 rounded-xl border border-border bg-bg-muted">
      {attachment.kind === 'image' ? (
        <Image className="w-4 h-4 text-text-muted" />
      ) : (
        <AudioLines className="w-4 h-4 text-text-muted" />
      )}
      <span className="text-sm text-text-muted truncate">{attachment.file_name}</span>
    </div>
  )
}
