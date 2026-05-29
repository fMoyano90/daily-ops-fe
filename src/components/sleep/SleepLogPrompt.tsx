'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Moon, X } from 'lucide-react'
import { Modal } from '@/components/shared/Modal'
import { SleepLogForm } from '@/components/sleep/SleepLogForm'
import { api } from '@/lib/api'
import { SleepLog, SleepLogInput } from '@/lib/types'

function getLocalDateValue(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function SleepLogPrompt() {
  const [sleepLog, setSleepLog] = useState<SleepLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const today = getLocalDateValue()

  useEffect(() => {
    let cancelled = false
    api.sleepLogs.today()
      .then((log) => {
        if (!cancelled) setSleepLog(log)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleSave = async (data: SleepLogInput) => {
    setSaving(true)
    setError(null)
    try {
      const saved = await api.sleepLogs.create({ ...data, date: data.date || today })
      setSleepLog(saved)
      setOpen(false)
    } catch (err) {
      console.error('Failed to save sleep log:', err)
      setError(err instanceof Error ? err.message : 'No se pudo guardar el registro')
    } finally {
      setSaving(false)
    }
  }

  if (loading || sleepLog || dismissed) return null

  return (
    <>
      <div className="bg-info-soft border border-[var(--info-soft)] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="w-10 h-10 rounded-xl bg-bg-elevated/80 text-[var(--info)] flex items-center justify-center flex-shrink-0">
            <Moon className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-text">¿Cómo dormiste?</h3>
            <p className="text-sm text-text-muted mt-1">Registra horas, calidad, despertares y cansancio para cruzarlo con tu productividad.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/sleep" className="px-3 py-2 rounded-lg text-sm font-semibold text-[var(--info)] hover:bg-bg-elevated/70 transition-colors">
            Ver historial
          </Link>
          <button type="button" onClick={() => setOpen(true)} className="px-4 py-2 rounded-lg bg-accent text-accent-fg text-sm font-semibold hover:bg-[var(--accent-hover)] transition-colors">
            Registrar
          </button>
          <button type="button" onClick={() => setDismissed(true)} className="touch-target -m-2 text-text-subtle hover:text-text transition-colors" aria-label="Ocultar registro de sueño">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <Modal isOpen={open} onClose={() => setOpen(false)} maxWidth="max-w-xl">
        <div className="p-5">
          {error && <div role="alert" className="mb-4 p-3 rounded-xl border border-danger-soft bg-danger-soft/40 text-sm text-[var(--danger)]">{error}</div>}
          <SleepLogForm date={today} saving={saving} submitLabel="Guardar sueño" onSubmit={handleSave} onCancel={() => setOpen(false)} />
        </div>
      </Modal>
    </>
  )
}
