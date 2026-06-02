'use client'

import { useState, useCallback } from 'react'
import { Search, Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CaptureFiltersProps {
  statusFilter?: string
  typeFilter?: string
  search?: string
  onStatusChange: (status: string | undefined) => void
  onTypeChange: (type: string | undefined) => void
  onSearchChange: (search: string | undefined) => void
}

const STATUS_OPTIONS = [
  { value: 'inbox', label: 'Inbox' },
  { value: 'reviewed', label: 'Revisadas' },
  { value: 'converted', label: 'Convertidas' },
  { value: 'archived', label: 'Archivadas' },
]

const TYPE_OPTIONS = [
  { value: 'text', label: 'Texto' },
  { value: 'url', label: 'URLs' },
  { value: 'image', label: 'Imágenes' },
  { value: 'voice', label: 'Voz' },
  { value: 'mixed', label: 'Mixtas' },
]

export function CaptureFilters({
  statusFilter,
  typeFilter,
  search,
  onStatusChange,
  onTypeChange,
  onSearchChange,
}: CaptureFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)
  const hasActiveFilters = statusFilter || typeFilter || search

  const clearAll = useCallback(() => {
    onStatusChange(undefined)
    onTypeChange(undefined)
    onSearchChange(undefined)
  }, [onStatusChange, onTypeChange, onSearchChange])

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar capturas..."
            value={search || ''}
            onChange={(e) => onSearchChange(e.target.value || undefined)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-bg-elevated text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors',
            showFilters || hasActiveFilters
              ? 'border-accent/40 bg-accent-soft text-accent'
              : 'border-border bg-bg-elevated text-text-muted hover:text-text'
          )}
        >
          <Filter className="w-4 h-4" />
          {hasActiveFilters && (
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          )}
        </button>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 px-2 py-2 rounded-xl text-sm text-text-muted hover:text-text transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showFilters && (
        <div className="space-y-3 p-3 rounded-xl border border-border bg-bg-elevated">
          <div>
            <p className="text-xs font-medium text-text-muted mb-2">Estado</p>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onStatusChange(statusFilter === opt.value ? undefined : opt.value)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                    statusFilter === opt.value
                      ? 'bg-accent-soft text-accent'
                      : 'bg-bg-muted text-text-muted hover:text-text'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-text-muted mb-2">Tipo</p>
            <div className="flex flex-wrap gap-1.5">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onTypeChange(typeFilter === opt.value ? undefined : opt.value)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                    typeFilter === opt.value
                      ? 'bg-accent-soft text-accent'
                      : 'bg-bg-muted text-text-muted hover:text-text'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
