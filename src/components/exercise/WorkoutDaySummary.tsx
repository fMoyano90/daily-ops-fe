'use client'

import { Flame, MessageCircle, Timer } from 'lucide-react'
import { WorkoutDay } from '@/lib/types'

interface WorkoutDaySummaryProps {
  day: WorkoutDay
  generatingCoach?: boolean
  onCoachMessage: () => Promise<void>
}

export function WorkoutDaySummary({ day, generatingCoach = false, onCoachMessage }: WorkoutDaySummaryProps) {
  if (day.status !== 'completed') return null

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-bg p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Flame className="w-4 h-4 text-[var(--warning)]" aria-hidden="true" />
            <span className="text-xs text-text-muted font-medium">Calorías</span>
          </div>
          <p className="text-2xl font-bold text-text">
            {day.total_calories_burned != null ? day.total_calories_burned : '—'}
          </p>
          <p className="text-xs text-text-subtle">kcal quemadas</p>
        </div>
        <div className="rounded-xl border border-border bg-bg p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Timer className="w-4 h-4 text-accent" aria-hidden="true" />
            <span className="text-xs text-text-muted font-medium">Duración</span>
          </div>
          <p className="text-2xl font-bold text-text">
            {day.total_duration_min != null ? day.total_duration_min : '—'}
          </p>
          <p className="text-xs text-text-subtle">minutos</p>
        </div>
      </div>

      {day.rpe != null && (
        <div className="rounded-xl border border-border bg-bg px-3 py-2 flex items-center justify-between text-sm">
          <span className="text-text-muted">Esfuerzo percibido</span>
          <span className="font-bold text-text">{day.rpe} / 10</span>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCoachMessage}
          disabled={generatingCoach}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-muted text-text text-sm font-medium hover:bg-border disabled:opacity-60 transition-colors"
        >
          <MessageCircle className="w-4 h-4" aria-hidden="true" />
          {generatingCoach ? 'Generando...' : 'Mensaje del coach'}
        </button>
      </div>

      {day.coach_notes && (
        <div className="rounded-xl border border-accent/30 bg-accent-soft p-3">
          <p className="text-sm text-text-muted italic">{day.coach_notes}</p>
        </div>
      )}
    </div>
  )
}
