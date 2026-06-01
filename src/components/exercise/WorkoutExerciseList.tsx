'use client'

import { motion } from 'motion/react'
import { Dumbbell, Sparkles } from 'lucide-react'
import { WorkoutExercise } from '@/lib/types'
import { WorkoutExerciseCard } from './WorkoutExerciseCard'

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 28 } },
}

interface WorkoutExerciseListProps {
  exercises: WorkoutExercise[]
  activeExerciseId?: string | null
  suggesting?: boolean
  onStart: (exercise: WorkoutExercise) => void
  onDelete: (exercise: WorkoutExercise) => Promise<void>
  onSuggest: () => Promise<void>
}

export function WorkoutExerciseList({
  exercises,
  activeExerciseId,
  suggesting = false,
  onStart,
  onDelete,
  onSuggest,
}: WorkoutExerciseListProps) {
  if (exercises.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-bg p-6 text-center space-y-3">
        <Dumbbell className="w-8 h-8 text-text-subtle mx-auto" aria-hidden="true" />
        <p className="text-sm text-text-muted">Aún no hay ejercicios para este día.</p>
        <button
          type="button"
          onClick={onSuggest}
          disabled={suggesting}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-accent text-accent-fg text-sm font-semibold hover:bg-[var(--accent-hover)] disabled:opacity-60 transition-colors"
        >
          <Sparkles className="w-4 h-4" aria-hidden="true" />
          {suggesting ? 'Generando rutina...' : 'Sugerir rutina con IA'}
        </button>
      </div>
    )
  }

  return (
    <motion.ul
      className="space-y-3"
      variants={listVariants}
      initial="hidden"
      animate="show"
    >
      {exercises.map((ex) => (
        <motion.div key={ex.id} variants={itemVariants}>
          <WorkoutExerciseCard
            exercise={ex}
            isActive={ex.id === activeExerciseId}
            onStart={onStart}
            onDelete={onDelete}
          />
        </motion.div>
      ))}
    </motion.ul>
  )
}
