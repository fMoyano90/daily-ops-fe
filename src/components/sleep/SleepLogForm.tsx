'use client'

import { FormEvent, useState } from 'react'
import { Moon, Save } from 'lucide-react'
import { SleepLog, SleepLogInput } from '@/lib/types'

type SleepLogFormState = {
  hours_slept: number
  sleep_quality: number
  bedtime: string
  wake_time: string
  wakeups: number
  tiredness_on_wake: number
  tiredness_during_day: number
  note: string
}

interface SleepLogFormProps {
  date: string
  initialLog?: SleepLog | null
  saving?: boolean
  submitLabel?: string
  onSubmit: (data: SleepLogInput) => Promise<void>
  onCancel?: () => void
}

function initialState(log?: SleepLog | null): SleepLogFormState {
  return {
    hours_slept: log?.hours_slept ?? 7.5,
    sleep_quality: log?.sleep_quality ?? 7,
    bedtime: log?.bedtime?.slice(0, 5) ?? '23:30',
    wake_time: log?.wake_time?.slice(0, 5) ?? '07:00',
    wakeups: log?.wakeups ?? 0,
    tiredness_on_wake: log?.tiredness_on_wake ?? 4,
    tiredness_during_day: log?.tiredness_during_day ?? 4,
    note: log?.note ?? '',
  }
}

export function SleepLogForm({ date, initialLog, saving = false, submitLabel, onSubmit, onCancel }: SleepLogFormProps) {
  const [form, setForm] = useState<SleepLogFormState>(() => initialState(initialLog))

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await onSubmit({
      ...form,
      date,
      note: form.note.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-xl bg-info-soft text-[var(--info)] flex items-center justify-center flex-shrink-0">
          <Moon className="w-5 h-5" />
        </span>
        <div>
          <h3 className="text-base font-semibold text-text">Registro del sueño</h3>
          <p className="text-sm text-text-muted mt-1">Captura cómo dormiste para detectar patrones de energía y foco.</p>
        </div>
      </div>

      <div>
        <label htmlFor="hours-slept" className="flex items-center justify-between text-sm font-medium text-text mb-2">
          Horas dormidas
          <span className="font-mono text-accent">{form.hours_slept}h</span>
        </label>
        <input
          id="hours-slept"
          type="range"
          min="0"
          max="12"
          step="0.5"
          value={form.hours_slept}
          onChange={(e) => setForm((prev) => ({ ...prev, hours_slept: Number(e.target.value) }))}
          className="w-full accent-[var(--accent)]"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="bedtime" className="block text-xs font-medium text-text-subtle mb-1">Hora de dormir</label>
          <input
            id="bedtime"
            type="time"
            value={form.bedtime}
            onChange={(e) => setForm((prev) => ({ ...prev, bedtime: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg-elevated text-text focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div>
          <label htmlFor="wake-time" className="block text-xs font-medium text-text-subtle mb-1">Hora de despertar</label>
          <input
            id="wake-time"
            type="time"
            value={form.wake_time}
            onChange={(e) => setForm((prev) => ({ ...prev, wake_time: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg-elevated text-text focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <RatingField id="sleep-quality" label="Calidad del sueño" value={form.sleep_quality} onChange={(value) => setForm((prev) => ({ ...prev, sleep_quality: value }))} />
        <div>
          <label htmlFor="wakeups" className="block text-sm font-medium text-text mb-2">Despertares</label>
          <input
            id="wakeups"
            type="number"
            min="0"
            max="50"
            value={form.wakeups}
            onChange={(e) => setForm((prev) => ({ ...prev, wakeups: Number(e.target.value) }))}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg-elevated text-text focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      <RatingField id="tiredness-on-wake" label="Cansancio al despertar" value={form.tiredness_on_wake} onChange={(value) => setForm((prev) => ({ ...prev, tiredness_on_wake: value }))} />
      <RatingField id="tiredness-day" label="Cansancio durante el día" value={form.tiredness_during_day} onChange={(value) => setForm((prev) => ({ ...prev, tiredness_during_day: value }))} />

      <div>
        <label htmlFor="sleep-note" className="block text-sm font-medium text-text mb-1">Nota opcional</label>
        <textarea
          id="sleep-note"
          value={form.note}
          onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
          rows={3}
          maxLength={1000}
          className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg-elevated text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent resize-none"
          placeholder="Ej: desperté varias veces, tomé café tarde, me costó dormir..."
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={saving} className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text hover:bg-bg-muted rounded-lg transition-colors disabled:opacity-60">
            Cancelar
          </button>
        )}
        <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-accent text-accent-fg text-sm font-semibold rounded-lg hover:bg-[var(--accent-hover)] disabled:opacity-60 transition-colors">
          {saving ? <span className="w-4 h-4 border-2 border-accent-fg/40 border-t-accent-fg rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Guardando...' : submitLabel || (initialLog ? 'Actualizar registro' : 'Guardar registro')}
        </button>
      </div>
    </form>
  )
}

function RatingField({ id, label, value, onChange }: { id: string; label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div>
      <label htmlFor={id} className="flex items-center justify-between text-sm font-medium text-text mb-2">
        {label}
        <span className="font-mono text-accent">{value}/10</span>
      </label>
      <input
        id={id}
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--accent)]"
      />
    </div>
  )
}
