'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { TimerDisplay } from '@/components/timer/TimerDisplay'
import { formatDuration } from '@/lib/utils'
import { Play, Pause, RotateCcw } from 'lucide-react'

type TimerVisualState = 'idle' | 'running' | 'paused'

interface TaskTimerProps {
  baseSeconds: number
  activeSessionStartedAt?: string | null
  status: TimerVisualState
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onReset: () => void
  disabled?: boolean
}

function parseTimestampMs(s: string): number {
  return /[zZ]|[+-]\d{2}:?\d{2}$/.test(s)
    ? new Date(s).getTime()
    : new Date(s + 'Z').getTime()
}

export function TaskTimer({
  baseSeconds,
  activeSessionStartedAt,
  status,
  onStart,
  onPause,
  onResume,
  onReset,
  disabled = false,
}: TaskTimerProps) {
  const [now, setNow] = useState<number>(() => Date.now())

  useEffect(() => {
    if (status !== 'running' || !activeSessionStartedAt) return
    setNow(Date.now())
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [status, activeSessionStartedAt])

  const elapsed =
    status === 'running' && activeSessionStartedAt
      ? baseSeconds +
        Math.max(
          0,
          Math.floor((now - parseTimestampMs(activeSessionStartedAt)) / 1000)
        )
      : baseSeconds

  return (
    <div className="relative flex items-center gap-3">
      {status === 'running' && (
        <motion.div
          className="absolute left-0 w-8 h-8 rounded-full bg-accent-soft border border-accent/30"
          animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ translateX: '-2px', translateY: '-2px' }}
        />
      )}

      <TimerDisplay seconds={elapsed} running={status === 'running'} />

      {status === 'idle' && (
        <button
          onClick={onStart}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-accent-fg text-xs font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-60"
        >
          <Play className="w-3.5 h-3.5" />
          Iniciar
        </button>
      )}

      {status === 'paused' && (
        <>
          <button
            onClick={onResume}
            disabled={disabled}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-accent-fg text-xs font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-60"
          >
            <Play className="w-3.5 h-3.5" />
            Reanudar
          </button>
          <button
            onClick={onReset}
            disabled={disabled}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-muted text-text-muted text-xs font-medium rounded-lg hover:bg-border transition-colors disabled:opacity-60"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reiniciar
          </button>
        </>
      )}

      {status === 'running' && (
        <>
          <button
            onClick={onPause}
            disabled={disabled}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-warning-soft text-[var(--warning)] text-xs font-medium rounded-lg hover:bg-[var(--warning)] hover:text-[var(--warning-fg)] transition-colors disabled:opacity-60"
          >
            <Pause className="w-3.5 h-3.5" />
            Pausar
          </button>
          <button
            onClick={onReset}
            disabled={disabled}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-muted text-text-muted text-xs font-medium rounded-lg hover:bg-border transition-colors disabled:opacity-60"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reiniciar
          </button>
        </>
      )}

      {elapsed > 0 && status === 'idle' && (
        <span className="text-xs text-text-subtle font-mono">
          Total: {formatDuration(elapsed)}
        </span>
      )}
    </div>
  )
}
