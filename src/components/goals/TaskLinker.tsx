'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, X, ExternalLink, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { Task, Project } from '@/lib/types'
import { ProjectBadge } from '@/components/tasks/ProjectBadge'
import { PriorityBadge } from '@/components/tasks/PriorityBadge'
import { cn } from '@/lib/utils'

interface TaskLinkerProps {
  onLink: (taskId: string) => Promise<void>
  onClose: () => void
}

export function TaskLinker({ onLink, onClose }: TaskLinkerProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [linking, setLinking] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [tasksList, projectsList] = await Promise.all([
          api.tasks.list({ status: 'backlog' }),
          api.projects.list(),
        ])
        setTasks(tasksList)
        setProjects(projectsList)
      } catch (err) {
        console.error('Failed to load tasks:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = tasks.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  )

  const handleLink = async (task: Task) => {
    setLinking(task.id)
    try {
      await onLink(task.id)
    } finally {
      setLinking(null)
    }
  }

  const inputClass = 'w-full pl-9 pr-3 py-2.5 border border-border rounded-lg text-sm bg-bg-elevated text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-accent'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-text">Vincular tarea del backlog</h4>
        <button onClick={onClose} className="text-text-subtle hover:text-text">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar tareas..."
          className={inputClass}
          autoFocus
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 text-text-subtle animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-text-subtle text-center py-4">
          {search ? 'No se encontraron tareas' : 'No hay tareas en el backlog'}
        </p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          <AnimatePresence>
            {filtered.map((task) => {
              const project = projects.find((p) => p.id === task.project_id)
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-3 bg-bg-muted rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {project && <ProjectBadge project={project} />}
                      <PriorityBadge priority={task.priority} />
                      {task.external_key && (
                        <span className="text-xs text-accent flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                          {task.external_key}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleLink(task)}
                    disabled={linking === task.id}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                      linking === task.id
                        ? 'bg-accent-soft text-accent'
                        : 'bg-accent text-accent-fg hover:bg-[var(--accent-hover)]'
                    )}
                  >
                    {linking === task.id ? (
                      <span className="flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Vinculando...
                      </span>
                    ) : (
                      'Vincular'
                    )}
                  </button>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
