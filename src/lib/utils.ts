import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeExternalUrl(value: string | null | undefined): string | null {
  const cleaned = value?.trim()
  if (!cleaned || /[\r\n\t]/.test(cleaned) || !/^https?:\/\//i.test(cleaned)) return null

  try {
    const url = new URL(cleaned)
    return url.protocol === 'http:' || url.protocol === 'https:' ? cleaned : null
  } catch {
    return null
  }
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function formatTimerDisplay(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function formatDateFull(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export function getTodayStr(): string {
  return toLocalDateStr(new Date())
}

export function toLocalDateStr(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function priorityColor(priority: string): string {
  switch (priority) {
    case 'critical': return 'bg-[var(--priority-critical-bg)] text-[var(--priority-critical-text)] border-[var(--priority-critical-border)]'
    case 'high': return 'bg-[var(--priority-high-bg)] text-[var(--priority-high-text)] border-[var(--priority-high-border)]'
    case 'medium': return 'bg-[var(--priority-medium-bg)] text-[var(--priority-medium-text)] border-[var(--priority-medium-border)]'
    case 'low': return 'bg-[var(--priority-low-bg)] text-[var(--priority-low-text)] border-[var(--priority-low-border)]'
    default: return 'bg-bg-muted text-text-muted border-border'
  }
}

export function statusColor(status: string): string {
  switch (status) {
    case 'planned': return 'bg-bg-muted text-text-muted'
    case 'in_progress': return 'bg-[var(--info-soft)] text-[var(--info)]'
    case 'paused': return 'bg-[var(--warning-soft)] text-[var(--warning)]'
    case 'completed': return 'bg-[var(--success-soft)] text-[var(--success)]'
    case 'rolled_over': return 'bg-accent-soft text-accent'
    case 'skipped': return 'bg-bg-muted text-text-subtle'
    default: return 'bg-bg-muted text-text-muted'
  }
}

export function statusLabel(status: string): string {
  switch (status) {
    case 'planned': return 'Planeada'
    case 'in_progress': return 'En curso'
    case 'paused': return 'Pausada'
    case 'completed': return 'Finalizada'
    case 'rolled_over': return 'Reenviada'
    case 'skipped': return 'Saltada'
    default: return status
  }
}

export function sourceLabel(source: string): string {
  switch (source) {
    case 'jira': return 'Jira'
    case 'manual': return 'Manual'
    default: return source
  }
}

export function projectTypeLabel(type: string): string {
  switch (type) {
    case 'work': return 'Trabajo'
    case 'business': return 'Negocio'
    case 'partner': return 'Socio'
    case 'personal': return 'Personal'
    default: return type
  }
}
