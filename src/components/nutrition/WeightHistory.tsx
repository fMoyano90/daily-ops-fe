'use client'

import { useEffect, useState } from 'react'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { api } from '@/lib/api'
import { WeightEntry } from '@/lib/types'
import { cn } from '@/lib/utils'

interface WeightHistoryProps {
  refreshKey?: number
}

export function WeightHistory({ refreshKey }: WeightHistoryProps) {
  const [entries, setEntries] = useState<WeightEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.nutrition.getWeightHistory(60).then(setEntries).catch(console.error).finally(() => setLoading(false))
  }, [refreshKey])

  if (loading) return <p className="text-sm text-text-muted py-2">Cargando historial...</p>
  if (entries.length === 0) return null

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-text">Historial de peso</h3>
      <ol className="divide-y divide-border">
        {entries.map((entry, index) => {
          const prev = entries[index + 1]
          const delta = prev ? entry.weight_kg - prev.weight_kg : null
          return (
            <li key={entry.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-text-muted">
                {new Date(entry.recorded_at + 'T00:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-text">{entry.weight_kg} kg</span>
                {delta !== null && (
                  <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium',
                    delta < 0 ? 'text-[var(--success)]' : delta > 0 ? 'text-[var(--danger)]' : 'text-text-muted'
                  )}>
                    {delta < 0 ? <TrendingDown className="w-3 h-3" /> : delta > 0 ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
