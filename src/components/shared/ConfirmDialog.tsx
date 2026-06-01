'use client'

import { Modal } from './Modal'
import { Trash2, AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'danger' | 'default'
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  variant = 'default',
}: ConfirmDialogProps) {
  const isDanger = variant === 'danger'
  const btnClass = isDanger
    ? 'px-4 py-2.5 bg-[var(--danger)] text-[var(--danger-fg)] text-sm font-medium rounded-lg hover:bg-[var(--danger)]/90 transition-colors'
    : 'px-4 py-2.5 bg-accent text-accent-fg text-sm font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors'

  return (
    <Modal open={open} onClose={onCancel} size="sm">
      <div className="px-6 py-6">
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isDanger ? 'bg-[var(--danger)]/10' : 'bg-accent-soft'}`}>
            {isDanger ? (
              <AlertTriangle className={`w-5 h-5 ${isDanger ? 'text-[var(--danger)]' : 'text-accent'}`} />
            ) : (
              <Trash2 className="w-5 h-5 text-accent" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-text">{title}</h3>
            <p className="text-sm text-text-muted mt-1">{message}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 border border-border text-text-muted text-sm font-medium rounded-lg hover:bg-bg-muted transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={btnClass}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
