'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Header } from '@/components/layout/Header'
import { api } from '@/lib/api'
import { Project } from '@/lib/types'
import { projectTypeLabel } from '@/lib/utils'
import { Plus, Settings2, Link, Zap } from 'lucide-react'
import { Skeleton } from '@/components/shared/Skeleton'
import { JiraConnections } from '@/components/settings/JiraConnections'
import { NewProjectModal } from '@/components/settings/NewProjectModal'

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 28 } },
}

export default function SettingsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewProject, setShowNewProject] = useState(false)

  const handleProjectCreated = (project: Project) => {
    setProjects((prev) => [project, ...prev])
  }

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await api.projects.list()
        setProjects(data)
      } catch (err) {
        console.error('Failed to load projects:', err)
      } finally {
        setLoading(false)
      }
    }
    loadProjects()
  }, [])

  return (
    <div>
      <Header title="Settings" subtitle="Configuración de proyectos e integraciones" />

      <div className="p-8 max-w-4xl mx-auto space-y-8">
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-text-subtle" />
              <h3 className="text-lg font-semibold text-text">Proyectos y Áreas</h3>
            </div>
            <button
              onClick={() => setShowNewProject(true)}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-fg text-sm font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nuevo proyecto
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8 text-text-subtle">
              <p>No hay proyectos creados</p>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
              variants={listVariants}
              initial="hidden"
              animate="show"
            >
              {projects.map((project) => (
                <motion.div
                  key={project.id}
                  variants={itemVariants}
                  className="flex items-center gap-4 p-4 bg-bg-elevated border border-border rounded-xl hover:border-border-strong hover:shadow-[var(--shadow-md)] transition-all"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-[var(--shadow-sm)]"
                    style={{ backgroundColor: project.color }}
                  >
                    {project.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-text">{project.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 bg-bg-muted text-text-muted rounded-full">
                        {projectTypeLabel(project.type)}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-[var(--success)] font-medium">Activo</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>

        <JiraConnections />

        <NewProjectModal
          isOpen={showNewProject}
          onClose={() => setShowNewProject(false)}
          onCreated={handleProjectCreated}
        />

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Link className="w-5 h-5 text-text-subtle" />
            <h3 className="text-lg font-semibold text-text">Otras integraciones</h3>
          </div>

          <motion.div className="space-y-3" variants={listVariants} initial="hidden" animate="show">
            <motion.div
              variants={itemVariants}
              className="flex items-center justify-between p-4 bg-bg-elevated border border-border rounded-xl"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-danger-soft rounded-lg flex items-center justify-center">
                  <span className="text-[var(--danger)] font-bold text-xs">GCal</span>
                </div>
                <div>
                  <h4 className="font-semibold text-text">Google Calendar</h4>
                  <p className="text-xs text-text-muted">Ver eventos en tu plan diario</p>
                </div>
              </div>
              <span className="flex items-center gap-1 px-3 py-1 bg-bg-muted text-text-subtle text-xs font-medium rounded-full">
                <Zap className="w-3 h-3" />
                Próximamente
              </span>
            </motion.div>
          </motion.div>
        </section>
      </div>
    </div>
  )
}
