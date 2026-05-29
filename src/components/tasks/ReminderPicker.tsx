'use client'

import { useState } from 'react'
import { Bell, BellOff } from 'lucide-react'

export const REMINDER_OPTIONS = [
  { label: 'Sin recordatorio', value: null },
  { label: 'A la hora', value: 0 },
  { label: '15 min antes', value: 15 },
  { label: '30 min antes', value: 30 },
  { label: '1 hora antes', value: 60 },
  { label: '3 horas antes', value: 180 },
] as const

interface ReminderPickerProps {
  value?: number | null
  onChange: (value: number | null) => void
  compact?: boolean
}

export function ReminderPicker({ value, onChange, compact = false }: ReminderPickerProps) {
  const [open, setOpen] = useState(false)

  const selected = REMINDER_OPTIONS.find((o) => o.value === value) ?? REMINDER_OPTIONS[0]
  const hasReminder = value !== null && value !== undefined

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md transition-colors ${
            hasReminder
              ? 'text-[var(--warning)] bg-warning-soft hover:bg-[var(--warning)]/20'
              : 'text-text-subtle hover:text-text-muted hover:bg-bg-muted'
          }`}
          title={selected.label}
        >
          {hasReminder ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
        </button>
        {open && (
          <div className="absolute z-50 mt-1 bg-bg-elevated border border-border rounded-lg shadow-[var(--shadow-lg)] p-1 min-w-[160px]">
            {REMINDER_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                className={`w-full text-left px-2 py-1 text-xs rounded-md transition-colors ${
                  value === opt.value
                    ? 'bg-accent-soft text-accent font-medium'
                    : 'text-text hover:bg-bg-muted'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <label className="block text-sm font-medium text-text-muted mb-1.5">
        Recordatorio
      </label>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        className="w-full px-4 py-2.5 border border-border rounded-lg text-sm bg-bg-elevated text-text focus:outline-none focus:ring-2 focus:ring-accent"
      >
        {REMINDER_OPTIONS.map((opt) => (
          <option key={opt.label} value={opt.value ?? ''}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
