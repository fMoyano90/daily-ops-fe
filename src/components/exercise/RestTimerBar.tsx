'use client'

import { useEffect, useRef, useState } from 'react'

interface RestTimerBarProps {
  seconds: number
  onComplete: () => void
  onSkip: () => void
}

export function RestTimerBar({ seconds, onComplete, onSkip }: RestTimerBarProps) {
  const [remaining, setRemaining] = useState(seconds)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setRemaining(seconds)
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          onComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current!)
  }, [seconds]) // eslint-disable-line react-hooks/exhaustive-deps

  const progress = remaining / seconds
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60

  return (
    <div className="rounded-xl border border-border bg-bg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-muted">Tiempo de descanso</span>
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold tabular-nums text-text">
            {mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : `${secs}s`}
          </span>
          <button
            type="button"
            onClick={onSkip}
            className="px-2.5 py-1 rounded-lg bg-bg-muted text-text-muted text-xs font-medium hover:bg-border transition-colors"
          >
            Saltar
          </button>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all duration-1000 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  )
}
