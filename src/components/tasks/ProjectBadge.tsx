import { Project } from '@/lib/types'

interface ProjectBadgeProps {
  project?: Project
  size?: 'sm' | 'md'
}

export function ProjectBadge({ project, size = 'sm' }: ProjectBadgeProps) {
  if (!project) return null

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="rounded-full flex-shrink-0"
        style={{
          width: size === 'sm' ? '0.625rem' : '0.75rem',
          height: size === 'sm' ? '0.625rem' : '0.75rem',
          backgroundColor: project.color,
          boxShadow: `0 0 0 2px ${project.color}30`,
        }}
      />
      <span
        className={`font-medium text-text-muted ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
      >
        {project.name}
      </span>
    </span>
  )
}
