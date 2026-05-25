export const TASK_CATEGORIES = [
  'Reunión',
  'Desarrollo',
  'Bug',
  'Investigación',
  'Documentación',
  'Admin',
] as const

export type TaskCategory = (typeof TASK_CATEGORIES)[number]

export const MEETING_CATEGORY = 'Reunión'

export function isMeetingCategory(category: string | null | undefined): boolean {
  return category === MEETING_CATEGORY
}

export function categoryColor(category: string | null | undefined): string {
  switch (category) {
    case 'Reunión':
      return 'bg-[var(--info-soft)] text-[var(--info)] border-[var(--info)]/30'
    case 'Desarrollo':
      return 'bg-accent-soft text-accent border-accent/30'
    case 'Bug':
      return 'bg-danger-soft text-[var(--danger)] border-[var(--danger)]/30'
    case 'Investigación':
      return 'bg-warning-soft text-[var(--warning)] border-[var(--warning)]/30'
    case 'Documentación':
      return 'bg-[var(--success-soft)] text-[var(--success)] border-[var(--success)]/30'
    case 'Admin':
      return 'bg-bg-muted text-text-muted border-border'
    default:
      return 'bg-bg-muted text-text-muted border-border-strong/40'
  }
}
