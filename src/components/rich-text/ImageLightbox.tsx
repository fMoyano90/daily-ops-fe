'use client'

import { useEffect, useState } from 'react'
import { X, ZoomIn, ZoomOut } from 'lucide-react'

interface ImageLightboxProps {
  src: string | null
  alt?: string
  onClose: () => void
}

export function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(z + 0.25, 4))
      if (e.key === '-') setZoom((z) => Math.max(z - 0.25, 0.25))
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!src) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute -top-12 right-0 flex items-center gap-2">
          <button
            type="button"
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            onClick={() => setZoom((z) => Math.min(z + 0.25, 4))}
            title="Zoom in"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            onClick={() => setZoom((z) => Math.max(z - 0.25, 0.25))}
            title="Zoom out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            onClick={onClose}
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <img
          src={src}
          alt={alt || ''}
          className="rounded-lg shadow-2xl transition-transform duration-200"
          style={{
            maxWidth: '90vw',
            maxHeight: '85vh',
            objectFit: 'contain',
            transform: `scale(${zoom})`,
          }}
        />
        {alt && (
          <p className="text-white/70 text-sm text-center max-w-lg">{alt}</p>
        )}
      </div>
    </div>
  )
}
