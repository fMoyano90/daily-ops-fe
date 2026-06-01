'use client'

import { ExerciseSet } from '@/lib/types'

interface ExerciseSetDotsProps {
  totalSets: number
  setsData?: ExerciseSet[] | null
  activeSetIndex?: number
}

export function ExerciseSetDots({ totalSets, setsData, activeSetIndex }: ExerciseSetDotsProps) {
  if (!totalSets || totalSets <= 0) return null

  return (
    <div className="flex items-center gap-1.5" aria-label={`Progreso: ${setsData?.filter((s) => s.completed).length ?? 0} de ${totalSets} series`}>
      {Array.from({ length: totalSets }, (_, i) => {
        const isCompleted = setsData?.[i]?.completed === true
        const isActive = i === activeSetIndex
        return (
          <span
            key={i}
            className={
              isCompleted
                ? 'w-2.5 h-2.5 rounded-full bg-[var(--success)]'
                : isActive
                ? 'w-2.5 h-2.5 rounded-full bg-accent ring-2 ring-accent/40'
                : 'w-2.5 h-2.5 rounded-full bg-bg-muted border border-border'
            }
          />
        )
      })}
    </div>
  )
}
