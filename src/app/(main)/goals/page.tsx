'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'motion/react'
import { Header } from '@/components/layout/Header'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { PullToRefreshIndicator } from '@/components/shared/PullToRefreshIndicator'
import { EmptyState } from '@/components/shared/EmptyState'
import { api } from '@/lib/api'
import { Goal, Project, GoalHorizon, GoalSummary as GoalSummaryType } from '@/lib/types'
import { GoalCard } from '@/components/goals/GoalCard'
import { GoalForm } from '@/components/goals/GoalForm'
import { GoalHorizonTabs } from '@/components/goals/GoalHorizonTabs'
import { GoalSummaryCards } from '@/components/goals/GoalSummaryCards'
import { Plus, ListFilter, Target } from 'lucide-react'

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}

const defaultSummary: GoalSummaryType = {
  short: { count: 0, avg_progress: 0 },
  medium: { count: 0, avg_progress: 0 },
  long: { count: 0, avg_progress: 0 },
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<GoalSummaryType>(defaultSummary)
  const [activeTab, setActiveTab] = useState<'all' | GoalHorizon>('all')
  const [filterProject, setFilterProject] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('active')
  const [formOpen, setFormOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setError(null)
    try {
      const projectsList = await api.projects.list()
      setProjects(projectsList)
    } catch (err) {
      console.error('Failed to load projects:', err)
      setError('No se pudieron cargar los proyectos')
    }
    try {
      const [goalsList, summaryData] = await Promise.all([
        api.goals.list(),
        api.goals.summary().catch(() => defaultSummary),
      ])
      setGoals(goalsList)
      setSummary(summaryData)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      console.error('Failed to load goals:', err)
      setError(`No se pudieron cargar las metas: ${msg}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const ptr = usePullToRefresh({ onRefresh: loadData })

  const filteredGoals = useMemo(() => {
    return goals.filter((goal) => {
      if (activeTab !== 'all' && goal.horizon !== activeTab) return false
      if (filterProject !== 'all' && goal.project_id !== filterProject) return false
      if (filterStatus !== 'all' && goal.status !== filterStatus) return false
      return true
    })
  }, [goals, activeTab, filterProject, filterStatus])

  const sortedGoals = useMemo(() => {
    return [...filteredGoals].sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1
      if (a.status !== 'active' && b.status === 'active') return 1
      return new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
    })
  }, [filteredGoals])

  const handleCreateGoal = async (data: Record<string, unknown>) => {
    await api.goals.create(data)
    await loadData()
  }

  const selectClass = 'w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg-elevated text-text focus:outline-none focus:ring-2 focus:ring-accent'

  if (loading) {
    return null
  }

  return (
    <div>
      <PullToRefreshIndicator pull={ptr.pull} refreshing={ptr.refreshing} progress={ptr.progress} />
      <Header title="Metas" subtitle="Tus metas y objetivos" />

      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        <GoalSummaryCards summary={summary} />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <GoalHorizonTabs active={activeTab} onChange={setActiveTab} />
          <button
            onClick={() => setFormOpen(true)}
            className="flex w-full items-center justify-center gap-2 px-4 py-2.5 bg-accent text-accent-fg text-sm font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors sm:w-auto sm:py-2"
          >
            <Plus className="w-4 h-4" />
            Nueva meta
          </button>
        </div>

        <div className="flex items-center gap-2">
          <ListFilter className="w-4 h-4 text-text-subtle" />
          <span className="text-sm font-medium text-text-muted">Filtros:</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-text-subtle mb-1">Proyecto</label>
            <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className={selectClass}>
              <option value="all">Todos</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-subtle mb-1">Estado</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={selectClass}>
              <option value="active">Activas</option>
              <option value="achieved">Logradas</option>
              <option value="paused">Pausadas</option>
              <option value="abandoned">Abandonadas</option>
              <option value="all">Todas</option>
            </select>
          </div>
        </div>

        <p className="text-sm text-text-subtle">
          {sortedGoals.length} meta{sortedGoals.length !== 1 ? 's' : ''}
        </p>

        {sortedGoals.length === 0 ? (
          <EmptyState
            icon={<Target className="w-8 h-8" />}
            title={goals.length === 0 ? 'No hay metas aún' : 'No hay metas que coincidan'}
            description={goals.length === 0 ? 'Crea tu primera meta para empezar a trackear tus objetivos' : 'Ajusta los filtros o crea una nueva meta'}
            action={
              <button onClick={() => setFormOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-accent text-accent-fg font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors">
                <Plus className="w-4 h-4" />
                Crear meta
              </button>
            }
          />
        ) : (
          <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-4" variants={listVariants} initial="hidden" animate="show">
            {sortedGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} projects={projects} />
            ))}
          </motion.div>
        )}
      </div>

      <GoalForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreateGoal}
        projects={projects}
      />
    </div>
  )
}
