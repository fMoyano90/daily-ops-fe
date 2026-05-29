'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Wind, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Technique = 'box' | '478'

interface Phase {
  label: string
  seconds: number
}

const techniques: Record<Technique, { name: string; phases: Phase[] }> = {
  box: {
    name: 'Caja 4-4-4-4',
    phases: [
      { label: 'Inhala', seconds: 4 },
      { label: 'Sostén', seconds: 4 },
      { label: 'Exhala', seconds: 4 },
      { label: 'Sostén', seconds: 4 },
    ],
  },
  '478': {
    name: '4-7-8',
    phases: [
      { label: 'Inhala', seconds: 4 },
      { label: 'Sostén', seconds: 7 },
      { label: 'Exhala', seconds: 8 },
    ],
  },
}

interface Props {
  onComplete: (used: boolean) => void
}

export function BreathingExercise({ onComplete }: Props) {
  const [technique, setTechnique] = useState<Technique>('box')
  const [running, setRunning] = useState(false)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [cycles, setCycles] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const phases = techniques[technique].phases
  const phase = phases[phaseIndex]

  function start() {
    setPhaseIndex(0)
    setSecondsLeft(phases[0].seconds)
    setCycles(0)
    setRunning(true)
  }

  function stop() {
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev > 1) return prev - 1
        setPhaseIndex((pi) => {
          const next = (pi + 1) % phases.length
          if (next === 0) setCycles((c) => c + 1)
          setSecondsLeft(phases[next].seconds)
          return next
        })
        return 0
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, phases])

  const isInhale = phase?.label === 'Inhala'
  const isExhale = phase?.label === 'Exhala'
  const scale = running ? (isInhale ? 1.35 : isExhale ? 0.75 : 1) : 1
  const totalSeconds = phases.reduce((s, p) => s + p.seconds, 0)
  const elapsed = phases.slice(0, phaseIndex).reduce((s, p) => s + p.seconds, 0) + (phase ? phase.seconds - secondsLeft : 0)
  const progress = running && totalSeconds > 0 ? elapsed / totalSeconds : 0

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Technique selector */}
      {!running && (
        <div className="flex gap-2">
          {(Object.keys(techniques) as Technique[]).map((t) => (
            <button
              key={t}
              onClick={() => setTechnique(t)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                technique === t
                  ? 'bg-accent text-white border-accent'
                  : 'border-border text-text-muted hover:border-accent',
              )}
            >
              {techniques[t].name}
            </button>
          ))}
        </div>
      )}

      {/* Circle */}
      <div className="relative flex items-center justify-center w-44 h-44">
        {/* SVG progress ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 176 176">
          <circle cx="88" cy="88" r="80" fill="none" stroke="var(--border)" strokeWidth="6" />
          {running && (
            <motion.circle
              cx="88"
              cy="88"
              r="80"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 80}`}
              strokeDashoffset={`${2 * Math.PI * 80 * (1 - progress)}`}
              transition={{ duration: 1, ease: 'linear' }}
            />
          )}
        </svg>

        {/* Animated inner circle */}
        <motion.div
          animate={{ scale }}
          transition={{ duration: running ? (isInhale ? phase.seconds : isExhale ? phase.seconds : 0.3) : 0.3, ease: 'easeInOut' }}
          className="w-28 h-28 rounded-full bg-accent/15 border-2 border-accent flex items-center justify-center"
        >
          <Wind className="w-8 h-8 text-accent opacity-70" />
        </motion.div>
      </div>

      {/* Phase label */}
      <AnimatePresence mode="wait">
        {running ? (
          <motion.div
            key={`${phaseIndex}-${technique}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="text-center"
          >
            <p className="text-2xl font-semibold text-text">{phase?.label}</p>
            <p className="text-4xl font-mono text-accent mt-1">{secondsLeft}</p>
            <p className="text-sm text-text-muted mt-1">Ciclo {cycles + 1}</p>
          </motion.div>
        ) : (
          <motion.p key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-text-muted text-sm text-center">
            {cycles > 0 ? `Completaste ${cycles} ciclo${cycles > 1 ? 's' : ''}` : 'Tómate un momento. Respira.'}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex gap-3">
        {!running ? (
          <button
            onClick={start}
            className="px-5 py-2 rounded-lg bg-accent text-white font-medium text-sm hover:bg-accent/90 transition-colors"
          >
            {cycles > 0 ? 'Continuar' : 'Comenzar'}
          </button>
        ) : (
          <button
            onClick={stop}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-text-muted text-sm hover:border-text-muted transition-colors"
          >
            <X className="w-4 h-4" /> Pausar
          </button>
        )}
        {cycles > 0 && !running && (
          <button
            onClick={() => onComplete(true)}
            className="px-5 py-2 rounded-lg bg-success-soft text-[var(--success)] font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Listo
          </button>
        )}
        <button
          onClick={() => onComplete(false)}
          className="px-4 py-2 rounded-lg text-text-muted text-sm hover:text-text transition-colors"
        >
          Saltar
        </button>
      </div>
    </div>
  )
}
