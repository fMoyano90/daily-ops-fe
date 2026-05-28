'use client'

import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { GoalHorizon } from '@/lib/types'

interface GoalHorizonTabsProps {
  active: 'all' | GoalHorizon
  onChange: (tab: 'all' | GoalHorizon) => void
}

const tabs: { key: 'all' | GoalHorizon; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'short', label: 'Corto plazo' },
  { key: 'medium', label: 'Mediano plazo' },
  { key: 'long', label: 'Largo plazo' },
]

export function GoalHorizonTabs({ active, onChange }: GoalHorizonTabsProps) {
  return (
    <div className="flex items-center gap-1 bg-bg-muted rounded-lg p-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            'relative px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            active === tab.key
              ? 'text-accent'
              : 'text-text-muted hover:text-text'
          )}
        >
          {active === tab.key && (
            <motion.div
              layoutId="horizon-tab"
              className="absolute inset-0 bg-bg-elevated rounded-md shadow-sm"
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            />
          )}
          <span className="relative z-10">{tab.label}</span>
        </button>
      ))}
    </div>
  )
}
