'use client'

import { differenceInDays, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Target, TrendingUp, CalendarDays } from 'lucide-react'
import { GoalSummary as GoalSummaryType } from '@/lib/types'

interface GoalSummaryCardsProps {
  summary: GoalSummaryType
}

const horizonConfig = {
  short: { label: 'Corto plazo', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  medium: { label: 'Mediano plazo', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  long: { label: 'Largo plazo', color: 'text-violet-500', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
}

export function GoalSummaryCards({ summary }: GoalSummaryCardsProps) {
  const renderCard = (key: 'short' | 'medium' | 'long', data: { count: number; avg_progress: number; nearest_deadline?: string; nearest_goal_title?: string }) => {
    const config = horizonConfig[key]
    const deadlineDate = data.nearest_deadline ? new Date(data.nearest_deadline) : null
    const daysLeft = deadlineDate ? differenceInDays(deadlineDate, new Date()) : null

    return (
      <div key={key} className={`bg-bg-elevated border ${config.border} rounded-xl p-4`}>
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
            <Target className={`w-4 h-4 ${config.color}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text">{config.label}</p>
            <p className="text-xs text-text-subtle">{data.count} meta{data.count !== 1 ? 's' : ''} activa{data.count !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-text-muted flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Progreso promedio
          </span>
          <span className="text-lg font-bold text-text">{Math.round(data.avg_progress)}%</span>
        </div>

        <div className="h-1.5 bg-bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${config.color.replace('text-', 'bg-')}`}
            style={{ width: `${data.avg_progress}%` }}
          />
        </div>

        {data.nearest_deadline && data.nearest_goal_title && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-text-muted flex items-center gap-1">
              <CalendarDays className="w-3 h-3" />
              Próxima fecha límite
            </p>
            <p className="text-xs font-medium text-text mt-0.5 truncate">
              {data.nearest_goal_title}
            </p>
            <p className="text-xs text-text-subtle mt-0.5">
              {daysLeft !== null && daysLeft > 0 && deadlineDate
                ? `Faltan ${daysLeft}d · ${format(deadlineDate, 'd MMM', { locale: es })}`
                : daysLeft === 0
                  ? 'Vence hoy'
                  : daysLeft !== null && daysLeft < 0
                    ? `Vencida hace ${Math.abs(daysLeft)}d`
                    : null}
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {renderCard('short', summary.short)}
      {renderCard('medium', summary.medium)}
      {renderCard('long', summary.long)}
    </div>
  )
}
