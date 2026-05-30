'use client'

import { FormEvent, useState } from 'react'
import { cn } from '@/lib/utils'
import { Habit, HabitCategory, HabitCreate, HabitTrackingMode, HabitUpdate } from '@/lib/types'
import { X, Plus } from 'lucide-react'

const categories: { value: HabitCategory; label: string; description: string }[] = [
  { value: 'substance', label: 'Sustancia', description: 'Alcohol, tabaco, otras' },
  { value: 'behavior', label: 'Conducta', description: 'Celos, gasto impulsivo, conflictos' },
  { value: 'digital', label: 'Digital', description: 'Redes, juegos, pantallas' },
  { value: 'other', label: 'Otro', description: 'Cualquier otra conducta' },
]

interface Props {
  initial?: Partial<Habit>
  onSave: (data: HabitCreate | HabitUpdate) => Promise<void>
  onCancel: () => void
}

export function HabitForm({ initial, onSave, onCancel }: Props) {
  const [saving, setSaving] = useState(false)
  const [triggerInput, setTriggerInput] = useState('')
  const [strategyInput, setStrategyInput] = useState('')
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    category: initial?.category ?? ('other' as HabitCategory),
    tracking_mode: initial?.tracking_mode ?? ('abstinence' as HabitTrackingMode),
    motivation: initial?.motivation ?? '',
    triggers: initial?.triggers ?? ([] as string[]),
    coping_strategies: initial?.coping_strategies ?? ([] as string[]),
    action_plan: initial?.action_plan ?? '',
  })

  function addItem(field: 'triggers' | 'coping_strategies', value: string) {
    const trimmed = value.trim()
    if (!trimmed) return
    setForm((p) => ({ ...p, [field]: [...p[field], trimmed] }))
  }

  function removeItem(field: 'triggers' | 'coping_strategies', index: number) {
    setForm((p) => ({ ...p, [field]: p[field].filter((_, i) => i !== index) }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await onSave({
        name: form.name,
        category: form.category,
        tracking_mode: form.tracking_mode,
        motivation: form.motivation || undefined,
        triggers: form.triggers,
        coping_strategies: form.coping_strategies,
        action_plan: form.action_plan || undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-h-[calc(100dvh-8rem)] flex-col sm:max-h-[75vh]">
      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scroll-pb-6">
        {/* Name */}
        <div>
        <label className="text-sm font-medium text-text-muted block mb-1.5">¿Qué conducta querés cambiar? *</label>
        <input
          value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          placeholder="Ej: Dejar de fumar, controlar los celos..."
          required
          className="w-full rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent"
        />
      </div>

        {/* Category */}
        <div>
        <label className="text-sm font-medium text-text-muted block mb-1.5">Categoría</label>
        <div className="grid grid-cols-2 gap-2">
          {categories.map((c) => (
            <button key={c.value} type="button" onClick={() => setForm((p) => ({ ...p, category: c.value }))}
              className={cn('text-left p-3 rounded-xl border transition-colors', form.category === c.value ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50')}>
              <p className={cn('text-sm font-medium', form.category === c.value ? 'text-accent' : 'text-text')}>{c.label}</p>
              <p className="text-xs text-text-muted mt-0.5">{c.description}</p>
            </button>
          ))}
        </div>
      </div>

        {/* Tracking mode */}
        <div>
        <label className="text-sm font-medium text-text-muted block mb-1.5">¿Cómo querés medirlo?</label>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setForm((p) => ({ ...p, tracking_mode: 'abstinence' }))}
            className={cn('text-left p-3 rounded-xl border transition-colors', form.tracking_mode === 'abstinence' ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50')}>
            <p className={cn('text-sm font-medium', form.tracking_mode === 'abstinence' ? 'text-accent' : 'text-text')}>Abstinencia</p>
            <p className="text-xs text-text-muted mt-0.5">Racha de días sin recaer</p>
          </button>
          <button type="button" onClick={() => setForm((p) => ({ ...p, tracking_mode: 'control' }))}
            className={cn('text-left p-3 rounded-xl border transition-colors', form.tracking_mode === 'control' ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50')}>
            <p className={cn('text-sm font-medium', form.tracking_mode === 'control' ? 'text-accent' : 'text-text')}>Control</p>
            <p className="text-xs text-text-muted mt-0.5">Reducir episodios e intensidad</p>
          </button>
        </div>
      </div>

        {/* Motivation */}
        <div>
        <label className="text-sm font-medium text-text-muted block mb-1.5">¿Por qué querés cambiar esto?</label>
        <textarea
          rows={2} value={form.motivation} onChange={(e) => setForm((p) => ({ ...p, motivation: e.target.value }))}
          placeholder="Tu motivación profunda — esto te ayudará en los momentos difíciles"
          className="w-full rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm text-text placeholder-text-muted resize-none focus:outline-none focus:border-accent"
        />
      </div>

        {/* Triggers */}
        <div>
        <label className="text-sm font-medium text-text-muted block mb-1.5">Gatillantes conocidos</label>
        <div className="flex gap-2 mb-2">
          <input value={triggerInput} onChange={(e) => setTriggerInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem('triggers', triggerInput); setTriggerInput('') } }}
            placeholder="Ej: estrés laboral, fines de semana..." className="flex-1 rounded-lg border border-border bg-bg-subtle px-3 py-1.5 text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent" />
          <button type="button" onClick={() => { addItem('triggers', triggerInput); setTriggerInput('') }}
            className="p-1.5 rounded-lg border border-border hover:border-accent text-text-muted hover:text-accent transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {form.triggers.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {form.triggers.map((t, i) => (
              <span key={i} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-warning-soft text-[var(--warning)]">
                {t}
                <button type="button" onClick={() => removeItem('triggers', i)}><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        )}
      </div>

        {/* Coping strategies */}
        <div>
        <label className="text-sm font-medium text-text-muted block mb-1.5">Estrategias que te ayudan</label>
        <div className="flex gap-2 mb-2">
          <input value={strategyInput} onChange={(e) => setStrategyInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem('coping_strategies', strategyInput); setStrategyInput('') } }}
            placeholder="Ej: caminar, llamar a alguien..." className="flex-1 rounded-lg border border-border bg-bg-subtle px-3 py-1.5 text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent" />
          <button type="button" onClick={() => { addItem('coping_strategies', strategyInput); setStrategyInput('') }}
            className="p-1.5 rounded-lg border border-border hover:border-accent text-text-muted hover:text-accent transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {form.coping_strategies.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {form.coping_strategies.map((s, i) => (
              <span key={i} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-success-soft text-[var(--success)]">
                {s}
                <button type="button" onClick={() => removeItem('coping_strategies', i)}><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        )}
      </div>

        {/* Action plan */}
        <div>
        <label className="text-sm font-medium text-text-muted block mb-1.5">Plan de acción (opcional)</label>
        <textarea
          rows={3} value={form.action_plan} onChange={(e) => setForm((p) => ({ ...p, action_plan: e.target.value }))}
          placeholder="Los pasos concretos que vas a seguir, qué harás cuando aparezca el deseo..."
          className="w-full rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm text-text placeholder-text-muted resize-none focus:outline-none focus:border-accent"
        />
      </div>

      </div>

      <div className="flex flex-col gap-2 border-t border-border bg-bg-elevated px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-end sm:px-6 sm:py-4">
        <button type="submit" disabled={saving || !form.name.trim()}
          className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50 sm:w-auto sm:py-2.5">
          {saving ? 'Guardando...' : initial ? 'Guardar cambios' : 'Crear hábito'}
        </button>
        <button type="button" onClick={onCancel}
          className="w-full rounded-lg border border-border px-4 py-3 text-sm text-text-muted transition-colors hover:border-text-muted sm:w-auto sm:py-2.5">
          Cancelar
        </button>
      </div>
    </form>
  )
}
