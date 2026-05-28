'use client'

import { useState } from 'react'
import { AlertTriangle, Edit2, Save, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GoalAntiGoalsProps {
  content?: string
  onSave: (content: string) => Promise<void>
}

export function GoalAntiGoals({ content, onSave }: GoalAntiGoalsProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(content || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(value)
      setEditing(false)
    } catch (err) {
      console.error('Failed to save anti-goals:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setValue(content || '')
    setEditing(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-danger flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Anti-metas
        </h3>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-text-subtle hover:text-text transition-colors"
          >
            <Edit2 className="w-3 h-3" />
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Cosas que te alejarían de esta meta..."
            className={cn(
              'w-full px-3 py-2.5 border border-danger/30 rounded-lg text-sm bg-bg-elevated text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-danger resize-none',
            )}
            rows={3}
            autoFocus
          />
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 px-3 py-1.5 border border-border text-text-muted text-xs font-medium rounded-lg hover:bg-bg-muted transition-colors"
            >
              <X className="w-3 h-3" />
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 px-3 py-1.5 bg-danger text-white text-xs font-medium rounded-lg hover:bg-danger/80 transition-colors disabled:opacity-50"
            >
              <Save className="w-3 h-3" />
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      ) : content ? (
        <div className="p-3 bg-danger-soft/30 border border-danger/20 rounded-lg">
          <p className="text-sm text-text whitespace-pre-wrap">{content}</p>
        </div>
      ) : (
        <div className="p-4 bg-danger-soft/10 border border-danger/10 rounded-lg text-center">
          <p className="text-sm text-text-subtle">Define qué cosas te alejarían de esta meta</p>
          <p className="text-xs text-text-muted mt-1">Identificar distracciones te ayuda a mantenerte enfocado</p>
        </div>
      )}
    </div>
  )
}
