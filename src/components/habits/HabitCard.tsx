'use client'

import { motion } from 'motion/react'
import { Flame, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Habit } from '@/lib/types'

const categoryLabel: Record<string, string> = {
  substance: 'Sustancia',
  behavior: 'Conducta',
  digital: 'Digital',
  other: 'Otro',
}

const statusColor: Record<string, string> = {
  active: 'bg-success-soft text-[var(--success)]',
  paused: 'bg-warning-soft text-[var(--warning)]',
  achieved: 'bg-accent-soft text-accent',
  abandoned: 'bg-bg-muted text-text-muted',
}

interface Props {
  habit: Habit
  streakDays?: number
  onClick?: () => void
}

export function HabitCard({ habit, streakDays, onClick }: Props) {
  const isAbstinence = habit.tracking_mode === 'abstinence'

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className="w-full text-left bg-bg border border-border rounded-2xl p-4 hover:border-accent/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', statusColor[habit.status])}>
              {habit.status === 'active' ? 'Activo' : habit.status === 'paused' ? 'Pausado' : habit.status === 'achieved' ? 'Logrado' : 'Abandonado'}
            </span>
            <span className="text-xs text-text-muted">{categoryLabel[habit.category]}</span>
          </div>
          <h3 className="mt-1.5 font-semibold text-text truncate">{habit.name}</h3>
          {habit.motivation && (
            <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{habit.motivation}</p>
          )}
        </div>

        {/* Streak / counter */}
        {streakDays !== undefined && (
          <div className={cn('flex flex-col items-center rounded-xl px-3 py-2 min-w-[64px]', isAbstinence ? 'bg-success-soft' : 'bg-info-soft')}>
            {isAbstinence ? (
              <Flame className="w-4 h-4 text-[var(--success)] mb-0.5" />
            ) : (
              <TrendingDown className="w-4 h-4 text-[var(--info)] mb-0.5" />
            )}
            <span className={cn('text-2xl font-bold leading-none', isAbstinence ? 'text-[var(--success)]' : 'text-[var(--info)]')}>
              {streakDays}
            </span>
            <span className={cn('text-[10px] font-medium', isAbstinence ? 'text-[var(--success)]' : 'text-[var(--info)]')}>
              {isAbstinence ? 'días' : 'episod.'}
            </span>
          </div>
        )}
      </div>
    </motion.button>
  )
}
