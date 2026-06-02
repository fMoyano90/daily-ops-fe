'use client'

import { ReactNode, useCallback, useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Inbox, Sparkles, Archive, CheckCircle2, FileText } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { EmptyState } from '@/components/shared/EmptyState'
import { Skeleton } from '@/components/shared/Skeleton'
import { PullToRefreshIndicator } from '@/components/shared/PullToRefreshIndicator'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { api } from '@/lib/api'
import type { Capture } from '@/lib/types'
import { CaptureComposer } from '@/components/captures/CaptureComposer'
import { CaptureCard } from '@/components/captures/CaptureCard'
import { CaptureFilters } from '@/components/captures/CaptureFilters'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 28 } },
}

function groupByDate(captures: Capture[]) {
  const groups: { date: string; label: string; captures: Capture[] }[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const weekStart = new Date(today)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())

  for (const capture of captures) {
    const captureDate = new Date(capture.note_date + 'T00:00:00')
    captureDate.setHours(0, 0, 0, 0)
    let label: string
    if (captureDate.getTime() === today.getTime()) {
      label = 'Hoy'
    } else if (captureDate.getTime() === yesterday.getTime()) {
      label = 'Ayer'
    } else if (captureDate >= weekStart) {
      label = 'Esta semana'
    } else {
      label = captureDate.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })
    }
    const existing = groups.find((g) => g.label === label)
    if (existing) {
      existing.captures.push(capture)
    } else {
      groups.push({ date: capture.note_date, label, captures: [capture] })
    }
  }
  return groups
}

export default function CapturesPage() {
  const [captures, setCaptures] = useState<Capture[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [typeFilter, setTypeFilter] = useState<string | undefined>()
  const [search, setSearch] = useState<string | undefined>()
  const [stats, setStats] = useState<Record<string, number>>({})
  const [deleteTarget, setDeleteTarget] = useState<Capture | null>(null)

  const loadData = useCallback(async () => {
    setError(null)
    try {
      const params: Record<string, string> = { limit: '100' }
      if (statusFilter) params.status = statusFilter
      if (typeFilter) params.type = typeFilter
      if (search) params.q = search
      const [data, statsData] = await Promise.all([
        api.captures.list(params),
        api.captures.stats().catch(() => ({ by_status: {} })),
      ])
      setCaptures(data)
      setStats(statsData.by_status || {})
    } catch (err) {
      console.error('Failed to load captures:', err)
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las capturas')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, typeFilter, search])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadData])

  const ptr = usePullToRefresh({ onRefresh: loadData })

  const handleCaptureCreated = useCallback((capture: Capture) => {
    setCaptures((prev) => [capture, ...prev])
  }, [])

  const handleCaptureUpdate = useCallback((capture: Capture) => {
    setCaptures((prev) => prev.map((c) => (c.id === capture.id ? capture : c)))
  }, [])

  const handleCaptureDelete = useCallback(async (capture: Capture) => {
    setDeleteTarget(capture)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return
    try {
      await api.captures.delete(deleteTarget.id)
      setCaptures((prev) => prev.filter((c) => c.id !== deleteTarget.id))
    } catch (err) {
      console.error('Failed to delete capture:', err)
      setError(err instanceof Error ? err.message : 'No se pudo eliminar')
    } finally {
      setDeleteTarget(null)
    }
  }, [deleteTarget])

  const handleConvertToTask = useCallback(async (capture: Capture) => {
    setSaving(true)
    try {
      const taskTitle = capture.title || capture.content?.slice(0, 100) || 'Captura sin título'
      let description = ''
      if (capture.content && capture.content !== capture.title) {
        description += capture.content + '\n\n'
      }
      if (capture.source_url) {
        description += `URL: ${capture.source_url}\n\n`
      }
      if (capture.transcript) {
        description += `Transcripción: ${capture.transcript}\n\n`
      }
      if (capture.tags.length > 0) {
        description += `Tags: ${capture.tags.join(', ')}`
      }

      const task = await api.tasks.create({
        title: taskTitle,
        description: description.trim() || null,
        source: 'manual',
        priority: 'medium',
        external_url: capture.source_url,
      })

      await api.captures.update(capture.id, { status: 'converted' })
      setCaptures((prev) =>
        prev.map((c) => (c.id === capture.id ? { ...c, status: 'converted' as const, converted_task_id: task.id } : c))
      )
    } catch (err) {
      console.error('Failed to convert to task:', err)
      setError(err instanceof Error ? err.message : 'No se pudo convertir a tarea')
    } finally {
      setSaving(false)
    }
  }, [])

  const groups = groupByDate(captures)

  if (loading) {
    return (
      <div>
        <Header title="Capturas" subtitle="Ideas, URLs, imágenes y notas de voz" />
        <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-4">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div>
      <PullToRefreshIndicator pull={ptr.pull} refreshing={ptr.refreshing} progress={ptr.progress} />
      <Header title="Capturas" subtitle="Ideas, URLs, imágenes y notas de voz" />

      <main className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
        {stats.inbox > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-xl border border-warning-soft/40 bg-warning-soft/20">
            <Inbox className="w-5 h-5 text-[var(--warning)] flex-shrink-0" />
            <p className="text-sm text-text">
              <span className="font-semibold">{stats.inbox}</span> captura{stats.inbox !== 1 ? 's' : ''} sin procesar
            </p>
          </div>
        )}

        {error && (
          <div role="alert" className="p-3 rounded-xl border border-danger-soft bg-danger-soft/40 text-sm text-[var(--danger)]">
            {error}
          </div>
        )}

        <CaptureComposer onCaptureCreated={handleCaptureCreated} />

        <CaptureFilters
          statusFilter={statusFilter}
          typeFilter={typeFilter}
          search={search}
          onStatusChange={setStatusFilter}
          onTypeChange={setTypeFilter}
          onSearchChange={setSearch}
        />

        {captures.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-12 h-12" />}
            title="Sin capturas"
            description="Escribe una idea, pega una URL o graba una nota de voz"
          />
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <div key={group.date}>
                <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 px-1">
                  {group.label}
                </h2>
                <motion.div
                  variants={listVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-3"
                >
                  {group.captures.map((capture) => (
                    <motion.div key={capture.id} variants={itemVariants}>
                      <CaptureCard
                        capture={capture}
                        onUpdate={handleCaptureUpdate}
                        onDelete={handleCaptureDelete}
                        onConvertToTask={handleConvertToTask}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            ))}
          </div>
        )}
      </main>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar captura"
        message={`¿Eliminar "${deleteTarget?.title || 'esta captura'}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
