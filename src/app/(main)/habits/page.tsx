'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, X } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { EmptyState } from '@/components/shared/EmptyState'
import { SkeletonCard } from '@/components/shared/Skeleton'
import { PullToRefreshIndicator } from '@/components/shared/PullToRefreshIndicator'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { Modal } from '@/components/shared/Modal'
import { HabitCard } from '@/components/habits/HabitCard'
import { HabitForm } from '@/components/habits/HabitForm'
import { api } from '@/lib/api'
import { Habit, HabitCreate, HabitSummary } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { Sprout } from 'lucide-react'

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 28 } },
}

export default function HabitsPage() {
  const router = useRouter()
  const [habits, setHabits] = useState<Habit[]>([])
  const [summaries, setSummaries] = useState<Record<string, HabitSummary>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const loadHabits = useCallback(async () => {
    setError(null)
    try {
      const data = await api.habits.list({ status: 'active' })
      setHabits(data)
      const summaryResults = await Promise.allSettled(data.map((h) => api.habits.summary(h.id)))
      const map: Record<string, HabitSummary> = {}
      summaryResults.forEach((r, i) => {
        if (r.status === 'fulfilled') map[data[i].id] = r.value
      })
      setSummaries(map)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los hábitos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadHabits()
  }, [loadHabits])

  const { pull, refreshing, progress } = usePullToRefresh({ onRefresh: loadHabits })

  async function handleCreate(data: HabitCreate) {
    await api.habits.create(data)
    setShowForm(false)
    await loadHabits()
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Hábitos" subtitle="Cambio de conductas" />
      <PullToRefreshIndicator pull={pull} refreshing={refreshing} progress={progress} />

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <div className="max-w-lg mx-auto pt-4">
          {/* New habit button */}
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border text-text-muted hover:border-accent hover:text-accent transition-colors mb-5 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Agregar conducta a trabajar
          </button>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-danger-soft text-[var(--danger)] text-sm flex items-start gap-2">
              <span className="flex-1">{error}</span>
              <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              <SkeletonCard /><SkeletonCard /><SkeletonCard />
            </div>
          ) : habits.length === 0 ? (
            <EmptyState
              icon={<Sprout className="w-7 h-7" />}
              title="Sin hábitos activos"
              description="Agregá una conducta que querás cambiar para empezar a trabajarla."
              action={
                <button onClick={() => setShowForm(true)} className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors">
                  Agregar hábito
                </button>
              }
            />
          ) : (
            <motion.ul variants={listVariants} initial="hidden" animate="show" className="space-y-3">
              {habits.map((h) => (
                <motion.li key={h.id} variants={itemVariants}>
                  <HabitCard
                    habit={h}
                    streakDays={summaries[h.id]?.metrics.current_streak_days}
                    onClick={() => router.push(`/habits/${h.id}`)}
                  />
                </motion.li>
              ))}
            </motion.ul>
          )}
        </div>
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nuevo hábito">
        <HabitForm onSave={(data) => handleCreate(data as HabitCreate)} onCancel={() => setShowForm(false)} />
      </Modal>
    </div>
  )
}
