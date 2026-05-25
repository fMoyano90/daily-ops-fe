import { cn, priorityColor } from '@/lib/utils'
import { Priority } from '@/lib/types'
import { AlertCircle, ArrowUp, Minus, ArrowDown } from 'lucide-react'

interface PriorityBadgeProps {
  priority: Priority
  size?: 'sm' | 'md'
}

const priorityIcons: Record<Priority, typeof AlertCircle> = {
  critical: AlertCircle,
  high: ArrowUp,
  medium: Minus,
  low: ArrowDown,
}

const priorityLabels: Record<Priority, string> = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
}

export function PriorityBadge({ priority, size = 'sm' }: PriorityBadgeProps) {
  const Icon = priorityIcons[priority]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium border rounded-full transition-all',
        priorityColor(priority),
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        priority === 'critical' && 'shadow-[0_0_10px_var(--priority-critical-border)]'
      )}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      {priorityLabels[priority]}
    </span>
  )
}
