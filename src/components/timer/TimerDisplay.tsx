'use client'

import { motion, AnimatePresence } from 'motion/react'
import { formatTimerDisplay } from '@/lib/utils'

interface TimerDisplayProps {
  seconds: number
  large?: boolean
  running?: boolean
}

export function TimerDisplay({ seconds, large = false, running = false }: TimerDisplayProps) {
  const display = formatTimerDisplay(seconds)

  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={display}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.15 }}
        className={`font-mono font-bold tabular-nums ${
          large ? 'text-2xl' : 'text-sm'
        } ${running ? 'text-accent' : seconds > 0 ? 'text-text-muted' : 'text-text-subtle'}`}
      >
        {display}
      </motion.span>
    </AnimatePresence>
  )
}
