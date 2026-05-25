'use client'

import { useState } from 'react'
import { Modal } from '@/components/shared/Modal'
import { Project, ProjectType } from '@/lib/types'
import { projectTypeLabel } from '@/lib/utils'
import { api } from '@/lib/api'
import { X, FolderPlus, Loader2 } from 'lucide-react'

const PROJECT_TYPES: ProjectType[] = ['work', 'business', 'partner', 'personal']

const COLOR_PRESETS = [
  '#7c3aed',
  '#6366f1',
  '#3b82f6',
  '#0ea5e9',
  '#14b8a6',
  '#22c55e',
  '#eab308',
  '#f97316',
  '#ef4444',
  '#ec4899',
]

interface NewProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (project: Project) => void
}

export function NewProjectModal({ isOpen, onClose, onCreated }: NewProjectModalProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<ProjectType>('work')
  const [color, setColor] = useState(COLOR_PRESETS[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setName('')
    setType('work')
    setColor(COLOR_PRESETS[0])
    setError(null)
  }

  const handleClose = () => {
    if (saving) return
    reset()
    onClose()
  }

  const handleSubmit = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('El nombre es obligatorio')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const created = await api.projects.create({ name: trimmed, type, color })
      onCreated(created)
      reset()
      onClose()
    } catch (err) {
      console.error('Failed to create project:', err)
      setError(err instanceof Error ? err.message : 'No se pudo crear el proyecto')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-md">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-accent-soft flex items-center justify-center">
              <FolderPlus className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text">Nuevo proyecto</h2>
              <p className="text-xs text-text-subtle">Crea un proyecto o área</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={saving}
            className="p-1.5 text-text-subtle hover:text-text hover:bg-bg-muted rounded-lg transition-colors disabled:opacity-60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit()
              }}
              placeholder="Ej: SubTech Solutions"
              maxLength={120}
              className="w-full text-sm px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-bg-elevated text-text placeholder:text-text-subtle"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Tipo</label>
            <div className="grid grid-cols-2 gap-1.5">
              {PROJECT_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                    type === t
                      ? 'bg-accent-soft text-accent border-accent'
                      : 'bg-bg-elevated text-text-muted border-border hover:border-border-strong'
                  }`}
                >
                  {projectTypeLabel(t)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-lg border-2 transition-transform ${
                    color === c ? 'border-text scale-110' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded-lg border border-border bg-bg-elevated cursor-pointer"
                title="Color personalizado"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-bg-muted/40 rounded-lg">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-[var(--shadow-sm)]"
              style={{ backgroundColor: color }}
            >
              {(name.trim() || '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text truncate">{name.trim() || 'Vista previa'}</p>
              <p className="text-xs text-text-muted">{projectTypeLabel(type)}</p>
            </div>
          </div>

          {error && <p className="text-xs text-danger">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text hover:bg-bg-muted rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !name.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent text-accent-fg text-sm font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-60"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Creando...' : 'Crear proyecto'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
