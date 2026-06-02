'use client'

import { useState, useRef, useCallback } from 'react'
import { Mic, Square, Play, Pause, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VoiceRecorderProps {
  onRecordingComplete: (blob: File, duration: number) => void
  disabled?: boolean
}

export function VoiceRecorder({ onRecordingComplete, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }, [previewUrl])

  const startRecording = async () => {
    setError(null)
    cleanup()
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Tu navegador no soporta grabación de voz')
        return
      }
      
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      if (permission.state === 'denied') {
        setError('Permiso de micrófono denegado. Habilítalo en la configuración del navegador.')
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const recorder = new MediaRecorder(stream, { mimeType })
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: mimeType })
        onRecordingComplete(file, duration)
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
      setDuration(0)
      timerRef.current = window.setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Microphone error:', err)
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Permiso de micrófono denegado. Habilítalo en la configuración del navegador.')
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        setError('No se encontró micrófono en este dispositivo')
      } else {
        setError('No se pudo acceder al micrófono')
      }
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
    cleanup()
  }

  const togglePlayback = () => {
    if (!previewUrl) return
    if (!audioRef.current) {
      audioRef.current = new Audio(previewUrl)
      audioRef.current.onended = () => setIsPlaying(false)
    }
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const discardRecording = () => {
    stopRecording()
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setIsPlaying(false)
    setPreviewUrl(null)
    setDuration(0)
    cleanup()
  }

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center gap-2">
      {!previewUrl ? (
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            isRecording
              ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
              : 'bg-bg-muted text-text-muted hover:bg-bg-hover hover:text-text',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isRecording ? (
            <>
              <Square className="w-4 h-4" />
              <span>{formatDuration(duration)}</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              <span>Grabar voz</span>
            </>
          )}
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlayback}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-bg-muted text-text-muted hover:bg-bg-hover hover:text-text transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{formatDuration(duration)}</span>
          </button>
          <button
            type="button"
            onClick={discardRecording}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-danger hover:bg-danger-soft/40 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
      {error && <span className="text-xs text-[var(--danger)]">{error}</span>}
    </div>
  )
}
