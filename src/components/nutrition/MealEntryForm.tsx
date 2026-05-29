'use client'

import { FormEvent, useState } from 'react'
import { Plus } from 'lucide-react'

export function MealEntryForm({ saving = false, onSubmit }: { saving?: boolean; onSubmit: (description: string) => Promise<void> }) {
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
        <label htmlFor="meal-description" className="block text-sm font-medium text-text mb-1">Nueva comida</label>
        <textarea id="meal-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} maxLength={4000} required className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg-elevated text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent resize-y" placeholder="Ej: pan con jamón y café con 3 azúcares" />
      </div>
      <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-accent text-accent-fg text-sm font-semibold rounded-lg hover:bg-[var(--accent-hover)] disabled:opacity-60 transition-colors">
        <Plus className="w-4 h-4" aria-hidden="true" />
        Añadir comida
      </button>
    </form>
  )
}
