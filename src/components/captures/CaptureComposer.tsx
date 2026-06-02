'use client'

import { useState, useRef, useCallback } from 'react'
import { Send, Link2, ImagePlus, Mic } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { VoiceRecorder } from './VoiceRecorder'
import type { Capture, CaptureCreate } from '@/lib/types'

interface CaptureComposerProps {
  onCaptureCreated: (capture: Capture) => void
}

export function CaptureComposer({ onCaptureCreated }: CaptureComposerProps) {
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showVoice, setShowVoice] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const detectedUrl = content.match(/https?:\/\/[^\s]+/)?.[0] || null

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    if (file.size > 8 * 1024 * 1024) {
      setError('La imagen no puede superar 8MB')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setError(null)
  }

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleVoiceComplete = useCallback((file: File) => {
    setImageFile(file)
    setImagePreview(null)
    setError(null)
  }, [])

  const handleSubmit = async () => {
    if (!content.trim() && !imageFile && !title.trim()) return
    setSaving(true)
    setError(null)
    try {
      const isUrlOnly = detectedUrl && !content.trim().replace(detectedUrl, '').trim()
      const createData: CaptureCreate = {
        title: title.trim() || null,
        content: content.trim() || null,
        source_url: detectedUrl,
        capture_type: isUrlOnly ? 'url' : imageFile ? (imageFile.type.startsWith('audio') ? 'voice' : 'mixed') : detectedUrl ? 'url' : 'text',
      }
      const capture = await api.captures.create(createData)

      if (imageFile) {
        try {
          await api.captures.uploadAttachment(capture.id, imageFile)
        } catch (err) {
          console.error('Failed to upload attachment:', err)
        }
      }

      const refreshed = await api.captures.get(capture.id)
      onCaptureCreated(refreshed)
      setContent('')
      setTitle('')
      removeImage()
      setShowVoice(false)
    } catch (err) {
      console.error('Failed to create capture:', err)
      setError(err instanceof Error ? err.message : 'No se pudo guardar la captura')
    } finally {
      setSaving(false)
    }
  }

  const canSubmit = (content.trim() || imageFile || title.trim()) && !saving

  return (
    <div className="bg-bg-elevated border border-border rounded-2xl p-4 md:p-5 space-y-3">
      <input
        type="text"
        placeholder="Título (opcional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full px-0 py-1 text-base font-semibold bg-transparent text-text placeholder:text-text-muted focus:outline-none"
      />
      <textarea
        placeholder="¿Qué apareció en tu cabeza?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        className="w-full px-0 py-1 text-sm bg-transparent text-text placeholder:text-text-muted focus:outline-none resize-none"
      />

      {detectedUrl && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-accent-soft/50">
          <Link2 className="w-4 h-4 text-accent flex-shrink-0" />
          <a
            href={detectedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent hover:underline truncate"
          >
            {detectedUrl}
          </a>
        </div>
      )}

      {imagePreview && !imageFile?.type.startsWith('audio') && (
        <div className="relative rounded-xl overflow-hidden border border-border">
          <img src={imagePreview} alt="Preview" className="w-full max-h-48 object-cover" />
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {error && (
        <div role="alert" className="p-2 rounded-lg border border-danger-soft bg-danger-soft/40 text-xs text-[var(--danger)]">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-bg-muted transition-colors"
            title="Agregar imagen"
          >
            <ImagePlus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowVoice(!showVoice)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              showVoice ? 'text-accent bg-accent-soft' : 'text-text-muted hover:text-text hover:bg-bg-muted'
            )}
            title="Grabar nota de voz"
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
            canSubmit
              ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg hover:shadow-xl active:scale-95'
              : 'bg-bg-muted text-text-muted cursor-not-allowed'
          )}
        >
          <Send className="w-4 h-4" />
          <span>Capturar</span>
        </button>
      </div>

      {showVoice && (
        <div className="pt-2 border-t border-border">
          <VoiceRecorder onRecordingComplete={handleVoiceComplete} />
        </div>
      )}
    </div>
  )
}
