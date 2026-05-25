'use client'

import { useState } from 'react'
import confetti from 'canvas-confetti'
import { Modal } from '@/components/shared/Modal'
import { X, CheckCircle2, RotateCw, Clock } from 'lucide-react'

interface DayCloserProps {
  completedCount: number
  rolledOverCount: number
  totalSeconds: number
  onCloseDay: () => void
}

export function DayCloser({ completedCount, rolledOverCount, totalSeconds, onCloseDay }: DayCloserProps) {
  const [showModal, setShowModal] = useState(false)

  const formatHours = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${h}h ${m}m`
  }

  const handleConfirm = () => {
    confetti({
      particleCount: 160,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#7c3aed', '#a78bfa', '#34d399', '#60a5fa', '#fbbf24'],
    })
    setShowModal(false)
    setTimeout(onCloseDay, 600)
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full py-3 px-4 bg-gradient-to-r from-accent to-fuchsia-600 text-white font-medium rounded-xl hover:from-[var(--accent-hover)] hover:to-fuchsia-700 transition-all shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-glow)]"
      >
        Cerrar día
      </button>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-text">Cerrar día</h3>
            <button
              onClick={() => setShowModal(false)}
              className="p-1 text-text-subtle hover:text-text transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-sm text-text-muted mb-6">
            ¿Estás seguro de cerrar el día de hoy? Las tareas completadas pasarán al historial y las pendientes volverán al backlog.
          </p>

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between p-3 bg-success-soft rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[var(--success)]" />
                <span className="text-sm font-medium text-[var(--success)]">Completadas</span>
              </div>
              <span className="text-lg font-bold text-[var(--success)]">{completedCount}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-accent-soft rounded-lg">
              <div className="flex items-center gap-2">
                <RotateCw className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium text-accent">Reenviadas</span>
              </div>
              <span className="text-lg font-bold text-accent">{rolledOverCount}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-info-soft rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[var(--info)]" />
                <span className="text-sm font-medium text-[var(--info)]">Tiempo total</span>
              </div>
              <span className="text-lg font-bold text-[var(--info)]">{formatHours(totalSeconds)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowModal(false)}
              className="flex-1 py-2.5 px-4 border border-border text-text-muted font-medium rounded-lg hover:bg-bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-accent to-fuchsia-600 text-white font-medium rounded-lg hover:from-[var(--accent-hover)] hover:to-fuchsia-700 transition-colors"
            >
              Confirmar cierre
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
