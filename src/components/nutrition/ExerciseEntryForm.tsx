'use client'

import { FormEvent, useState } from 'react'
import { Plus } from 'lucide-react'

export function ExerciseEntryForm({ saving = false, onSubmit }: { saving?: boolean; onSubmit: (description: string) => Promise<void> }) {
  const [description, setDescription] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const cleaned = description.trim()
    if (!cleaned) return
    await onSubmit(cleaned)
    setDescription('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="exercise-description" className="block text-sm font-medium text-text mb-1">Nuevo ejercicio</label>
        <textarea id="exercise-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} maxLength={4000} required className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg-elevated text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent resize-y" placeholder="Ej: trote lento 15 min o 4 series de 15 flexiones" />
      </div>
      <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-bg-muted text-text text-sm font-semibold rounded-lg hover:bg-border disabled:opacity-60 transition-colors">
        <Plus className="w-4 h-4" aria-hidden="true" />
        Añadir ejercicio
      </button>
    </form>
  )
}
