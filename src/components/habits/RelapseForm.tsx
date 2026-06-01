'use client'

import { FormEvent, useState } from 'react'
import { cn } from '@/lib/utils'
import { HabitEventCreate, HabitTrackingMode } from '@/lib/types'

const emotionOptions = ['ansiedad', 'rabia', 'tristeza', 'soledad', 'aburrimiento', 'estrés', 'frustración', 'vacío', 'alegría', 'celebración']
const triggerOptions = ['trabajo', 'pareja', 'familia', 'soledad', 'alcohol-cerca', 'conversación', 'recuerdo', 'cansancio', 'celebración', 'fiesta']

interface Props {
  habitName: string
  trackingMode: HabitTrackingMode
  onSave: (data: HabitEventCreate) => Promise<void>
  onCancel: () => void
}

export function RelapseForm({ habitName, trackingMode, onSave, onCancel }: Props) {
  const isPositive = trackingMode === 'positive'
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    emotion: '',
    trigger: '',
    feeling_note: '',
    thought: '',
    action_taken: '',
    intensity: 5,
    note: '',
    mirror_to_emotions: false,
  })

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({
        event_type: 'relapse',
        emotion: form.emotion || undefined,
        trigger: form.trigger || undefined,
        feeling_note: form.feeling_note || undefined,
        thought: form.thought || undefined,
        action_taken: form.action_taken || undefined,
        intensity: form.intensity,
        resisted: false,
        note: form.note || undefined,
        mirror_to_emotions: form.mirror_to_emotions,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-bg rounded-2xl border border-border p-5 space-y-5">
      <div>
        <p className="text-xs text-text-muted uppercase tracking-wide font-medium">{isPositive ? 'Registro de pendiente' : 'Registro honesto'}</p>
        <h3 className="text-lg font-semibold text-text mt-0.5">{isPositive ? 'No ocurrió' : habitName}</h3>
        <p className="text-sm text-text-muted mt-1">
          {isPositive ? `Registra qué impidió ${habitName.toLowerCase()} para ajustar mañana.` : 'Esto es para entender, no para juzgar. Cada registro es información valiosa.'}
        </p>
      </div>

      {/* Intensity */}
      <div>
        <label className="text-sm font-medium text-text-muted block mb-1.5">
          {isPositive ? '¿Qué tan difícil fue hacerlo?' : '¿Cuánta intensidad tenía el deseo antes?'} <span className="text-accent font-semibold">{form.intensity}/10</span>
        </label>
        <input
          type="range" min={1} max={10} value={form.intensity}
          onChange={(e) => setForm((p) => ({ ...p, intensity: Number(e.target.value) }))}
          className="w-full accent-[var(--accent)]"
        />
      </div>

      {/* Emotion */}
      <div>
        <label className="text-sm font-medium text-text-muted block mb-1.5">¿Qué sentías en ese momento?</label>
        <div className="flex flex-wrap gap-2">
          {emotionOptions.map((e) => (
            <button type="button" key={e} onClick={() => setForm((p) => ({ ...p, emotion: p.emotion === e ? '' : e }))}
              className={cn('px-3 py-1 rounded-full text-sm border transition-colors',
                form.emotion === e ? 'bg-accent text-white border-accent' : 'border-border text-text-muted hover:border-accent')}>
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Trigger */}
      <div>
        <label className="text-sm font-medium text-text-muted block mb-1.5">{isPositive ? '¿Qué lo impidió?' : '¿Qué lo gatilló?'}</label>
        <div className="flex flex-wrap gap-2">
          {triggerOptions.map((t) => (
            <button type="button" key={t} onClick={() => setForm((p) => ({ ...p, trigger: p.trigger === t ? '' : t }))}
              className={cn('px-3 py-1 rounded-full text-sm border transition-colors',
                form.trigger === t ? 'bg-warning-soft text-[var(--warning)] border-[var(--warning)]' : 'border-border text-text-muted hover:border-border')}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Feeling note */}
      <div>
        <label className="text-sm font-medium text-text-muted block mb-1.5">{isPositive ? '¿Qué pasó?' : '¿Qué pasó por tu cabeza?'}</label>
        <textarea
          rows={2} value={form.feeling_note} onChange={(e) => setForm((p) => ({ ...p, feeling_note: e.target.value }))}
          placeholder={isPositive ? 'El contexto, la situación, lo que lo hizo difícil...' : 'El contexto, la situación, lo que sea que recuerdes...'}
          className="w-full rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm text-text placeholder-text-muted resize-none focus:outline-none focus:border-accent"
        />
      </div>

      {/* What would you do differently */}
      <div>
        <label className="text-sm font-medium text-text-muted block mb-1.5">{isPositive ? '¿Qué facilitaría hacerlo mañana?' : '¿Qué podrías hacer diferente la próxima vez?'}</label>
        <textarea
          rows={2} value={form.action_taken} onChange={(e) => setForm((p) => ({ ...p, action_taken: e.target.value }))}
          placeholder="Cualquier idea, grande o pequeña..."
          className="w-full rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm text-text placeholder-text-muted resize-none focus:outline-none focus:border-accent"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
        <input type="checkbox" checked={form.mirror_to_emotions} onChange={(e) => setForm((p) => ({ ...p, mirror_to_emotions: e.target.checked }))}
          className="accent-[var(--accent)]" />
        Guardar también en el diario emocional
      </label>

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving}
          className="flex-1 py-2.5 rounded-lg bg-accent text-white font-medium text-sm hover:bg-accent/90 transition-colors disabled:opacity-50">
          {saving ? 'Guardando...' : 'Guardar registro'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2.5 rounded-lg border border-border text-text-muted text-sm hover:border-text-muted transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  )
}
