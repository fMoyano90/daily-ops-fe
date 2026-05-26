'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Header } from '@/components/layout/Header'
import { PriorityBadge } from '@/components/tasks/PriorityBadge'
import { ProjectBadge } from '@/components/tasks/ProjectBadge'
import { SkeletonStats, SkeletonCard } from '@/components/shared/Skeleton'
import { api } from '@/lib/api'
import { formatDate, formatDuration } from '@/lib/utils'
import { HistoryDay as HistoryDayType } from '@/lib/types'
import { ChevronDown, ChevronRight, CheckCircle2, RotateCw, Clock, RotateCcw, AlertTriangle } from 'lucide-react'

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 28 } },
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryDayType[]>([])
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [reopeningId, setReopeningId] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState<string | null>(null)

  useEffect(() => {
    api.history
      .list({ limit: '30' })
      .then((data) => setHistory(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const totalCompleted = history.reduce((acc, d) => acc + d.completed_tasks, 0)
  const totalRolledOver = history.reduce((acc, d) => acc + d.rolled_over_tasks, 0)
  const totalSeconds = history.reduce((acc, d) => acc + d.total_seconds, 0)

  const toggleDay = (date: string) => {
    setExpandedDay(expandedDay === date ? null : date)
    setShowConfirm(null)
  }

  const handleReopen = async (planId: string) => {
    setReopeningId(planId)
    try {
      await api.dailyPlans.reopen(planId)
      setHistory((prev) => prev.filter((d) => d.plan_id !== planId))
      setExpandedDay(null)
      setShowConfirm(null)
    } catch (err) {
      console.error('Failed to reopen day:', err)
      alert('Error al reabrir el día')
    } finally {
      setReopeningId(null)
    }
  }

  if (loading) {
    return (
      <div>
        <Header title="History" subtitle="Cargando historial..." />
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
          <SkeletonStats />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header title="History" subtitle="Revisa tu progreso y tiempo trabajado" />

      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="bg-bg-elevated p-4 rounded-xl border border-border">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
              <span className="text-xs font-medium text-text-subtle">Completadas</span>
            </div>
            <p className="text-2xl font-bold text-[var(--success)]">{totalCompleted}</p>
          </div>

          <div className="bg-bg-elevated p-4 rounded-xl border border-border">
            <div className="flex items-center gap-2 mb-2">
              <RotateCw className="w-4 h-4 text-accent" />
              <span className="text-xs font-medium text-text-subtle">Reenviadas</span>
            </div>
            <p className="text-2xl font-bold text-accent">{totalRolledOver}</p>
          </div>

          <div className="bg-bg-elevated p-4 rounded-xl border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-[var(--info)]" />
              <span className="text-xs font-medium text-text-subtle">Tiempo total</span>
            </div>
            <p className="text-2xl font-bold text-[var(--info)]">{formatDuration(totalSeconds)}</p>
          </div>
        </motion.div>

        {history.length === 0 ? (
          <div className="text-center py-12 animate-fade-in">
            <div className="w-16 h-16 bg-accent-soft rounded-2xl flex items-center justify-center mx-auto mb-4 text-accent animate-float">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-text mb-1">Sin historial aún</h3>
            <p className="text-sm text-text-muted">Cierra tu primer día para ver el historial aquí</p>
          </div>
        ) : (
          <motion.div className="space-y-3" variants={listVariants} initial="hidden" animate="show">
            {history.map((day) => {
              const isExpanded = expandedDay === day.date
              const completedTasks = day.tasks.filter((t) => t.status === 'completed')
              const rolledTasks = day.tasks.filter((t) => t.status === 'rolled_over')

              return (
                <motion.div
                  key={day.date}
                  variants={itemVariants}
                  className="bg-bg-elevated border border-border rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => toggleDay(day.date)}
                    className="w-full flex items-center justify-between p-4 hover:bg-bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <motion.span animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronRight className="w-4 h-4 text-text-subtle" />
                      </motion.span>
                      <div className="text-left">
                        <h3 className="font-semibold text-text capitalize">{formatDate(day.date)}</h3>
                        <p className="text-xs text-text-subtle mt-0.5">{day.total_tasks} tareas planificadas</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-lg font-bold text-[var(--success)]">{day.completed_tasks}</p>
                        <p className="text-xs text-text-subtle">Completadas</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-accent">{day.rolled_over_tasks}</p>
                        <p className="text-xs text-text-subtle">Reenviadas</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-[var(--info)]">{formatDuration(day.total_seconds)}</p>
                        <p className="text-xs text-text-subtle">Tiempo</p>
                      </div>
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden border-t border-border"
                      >
                        {showConfirm === day.plan_id && (
                          <div className="p-4 bg-warning-soft border-b border-[var(--warning-soft)]">
                            <div className="flex items-start gap-3 mb-3">
                              <AlertTriangle className="w-5 h-5 text-[var(--warning)] flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-[var(--warning)]">¿Reabrir este día?</p>
                                <p className="text-xs text-[var(--warning)] opacity-80 mt-0.5">
                                  Las tareas reenviadas y saltadas volverán a estado "planificadas". Las completadas no se modifican.
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => setShowConfirm(null)}
                                className="px-3 py-1.5 text-sm font-medium text-text-muted hover:bg-bg-muted rounded-lg transition-colors"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => handleReopen(day.plan_id)}
                                disabled={reopeningId === day.plan_id}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[var(--warning)] bg-[var(--warning-soft)] hover:bg-[var(--warning)] hover:text-[var(--warning-fg)] rounded-lg transition-colors disabled:opacity-50"
                              >
                                {reopeningId === day.plan_id ? (
                                  <span className="w-3 h-3 border-2 border-warning/40 border-t-warning rounded-full animate-spin" />
                                ) : (
                                  <RotateCcw className="w-3.5 h-3.5" />
                                )}
                                Reabrir día
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="p-4 space-y-4">
                          <div className="flex justify-end">
                            <button
                              onClick={(e) => { e.stopPropagation(); setShowConfirm(day.plan_id) }}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-text-muted hover:text-[var(--warning)] hover:bg-warning-soft rounded-lg transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Reabrir día
                            </button>
                          </div>

                          {completedTasks.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-[var(--success)] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Completadas ({completedTasks.length})
                              </h4>
                              <div className="space-y-2">
                                {completedTasks.map((task) => (
                                  <div key={task.id} className="flex items-center gap-3 p-3 bg-success-soft/50 rounded-lg">
                                    <CheckCircle2 className="w-4 h-4 text-[var(--success)] flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-text-subtle line-through">{task.title_snapshot}</p>
                                      {task.project && (
                                        <div className="flex items-center gap-2 mt-1">
                                          <ProjectBadge project={task.project} size="sm" />
                                          <PriorityBadge priority={task.priority} size="sm" />
                                        </div>
                                      )}
                                    </div>
                                    <span className="text-xs font-mono text-text-subtle flex-shrink-0">{formatDuration(task.total_seconds)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {rolledTasks.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-accent uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                <RotateCw className="w-3.5 h-3.5" />
                                Reenviadas ({rolledTasks.length})
                              </h4>
                              <div className="space-y-2">
                                {rolledTasks.map((task) => (
                                  <div key={task.id} className="flex items-center gap-3 p-3 bg-accent-soft/50 rounded-lg">
                                    <RotateCw className="w-4 h-4 text-accent flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-text-muted">{task.title_snapshot}</p>
                                      {task.project && (
                                        <div className="flex items-center gap-2 mt-1">
                                          <ProjectBadge project={task.project} size="sm" />
                                          <PriorityBadge priority={task.priority} size="sm" />
                                        </div>
                                      )}
                                    </div>
                                    <span className="text-xs font-mono text-text-subtle flex-shrink-0">{formatDuration(task.total_seconds)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {day.tasks.length === 0 && (
                            <p className="text-sm text-text-subtle text-center py-4">No hay detalles disponibles para este día</p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
    </div>
  )
}
