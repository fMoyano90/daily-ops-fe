import { cn, statusColor, statusLabel } from '@/lib/utils'
import { DailyTaskStatus } from '@/lib/types'
import { Circle, Play, Pause, CheckCircle2, RotateCw, SkipForward } from 'lucide-react'

interface StatusBadgeProps {
  status: DailyTaskStatus
}

const statusIcons: Record<DailyTaskStatus, typeof Circle> = {
  planned: Circle,
  in_progress: Play,
  paused: Pause,
  completed: CheckCircle2,
  rolled_over: RotateCw,
  skipped: SkipForward,
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const Icon = statusIcons[status]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
        statusColor(status)
      )}
    >
      <Icon className="w-3 h-3" />
      {statusLabel(status)}
    </span>
  )
}
