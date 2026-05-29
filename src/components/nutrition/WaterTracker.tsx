'use client'

import { Droplets, Minus, Plus } from 'lucide-react'

export function WaterTracker({ waterMl, glassMl, updating = false, onDelta }: { waterMl: number; glassMl: number; updating?: boolean; onDelta: (delta: number) => Promise<void> }) {
  const glasses = Math.round(waterMl / glassMl)

  return (
    <section aria-labelledby="water-title" className="bg-bg-elevated border border-border rounded-2xl p-4 md:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-info-soft text-[var(--info)] flex items-center justify-center">
            <Droplets className="w-5 h-5" aria-hidden="true" />
          </span>
          <div>
            <h2 id="water-title" className="text-base font-semibold text-text">Agua</h2>
            <p className="text-sm text-text-muted">{glassMl} ml por vaso</p>
          </div>
        </div>
        <p className="text-right"><strong className="block text-2xl font-bold text-text">{glasses}</strong><span className="text-xs text-text-muted">{waterMl} ml</span></p>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <button type="button" onClick={() => onDelta(-1)} disabled={updating || waterMl <= 0} className="touch-target flex-1 inline-flex items-center justify-center rounded-lg border border-border text-text-muted hover:text-text hover:bg-bg-muted disabled:opacity-40 transition-colors" aria-label="Restar un vaso de agua">
          <Minus className="w-4 h-4" aria-hidden="true" />
        </button>
        <button type="button" onClick={() => onDelta(1)} disabled={updating} className="touch-target flex-1 inline-flex items-center justify-center rounded-lg bg-info-soft text-[var(--info)] hover:bg-info-soft/80 disabled:opacity-60 transition-colors" aria-label="Sumar un vaso de agua">
          <Plus className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}
