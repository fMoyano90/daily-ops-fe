'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Wind } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BreathingExercise } from './BreathingExercise'
import { HabitEventCreate } from '@/lib/types'

const emotionOptions = ['ansiedad', 'rabia', 'tristeza', 'soledad', 'aburrimiento', 'estrés', 'frustración', 'vacío']
const triggerOptions = ['trabajo', 'pareja', 'familia', 'soledad', 'alcohol-cerca', 'conversación', 'recuerdo', 'cansancio', 'celebración']

interface Props {
  habitName: string
  onSave: (data: HabitEventCreate) => Promise<void>
  onCancel: () => void
}

type Step = 'feel' | 'breathe' | 'result'

export function UrgePanel({ habitName, onSave, onCancel }: Props) {
  const [step, setStep] = useState<Step>('feel')
  const [breathingUsed, setBreathingUsed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    emotion: '',
    trigger: '',
    feeling_note: '',
    intensity: 5,
    resisted: true as boolean | undefined,
    note: '',
    mirror_to_emotions: false,
  })

  function handleBreathingComplete(used: boolean) {
    setBreathingUsed(used)
    setStep('result')
  }

  async function handleSubmit(resisted: boolean) {
    setSaving(true)
    try {
      await onSave({
        event_type: 'urge',
        emotion: form.emotion || undefined,
        trigger: form.trigger || undefined,
        feeling_note: form.feeling_note || undefined,
        intensity: form.intensity,
        resisted,
        breathing_used: breathingUsed,
        note: form.note || undefined,
        mirror_to_emotions: form.mirror_to_emotions,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-bg rounded-2xl border border-border p-5 space-y-5">
      <div>
        <p className="text-xs text-text-muted uppercase tracking-wide font-medium">Modo preventivo</p>
        <h3 className="text-lg font-semibold text-text mt-0.5">Apareció el deseo — {habitName}</h3>
        <p className="text-sm text-text-muted mt-1">Esto es una oportunidad. Escribe cómo estás.</p>
      </div>

      <AnimatePresence mode="wait">
        {step === 'feel' && (
          <motion.div key="feel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Intensity */}
            <div>
              <label className="text-sm font-medium text-text-muted block mb-1.5">¿Qué tan intenso es el deseo? <span className="text-accent font-semibold">{form.intensity}/10</span></label>
              <input
                type="range" min={1} max={10} value={form.intensity}
                onChange={(e) => setForm((p) => ({ ...p, intensity: Number(e.target.value) }))}
                className="w-full accent-[var(--accent)]"
              />
            </div>

            {/* Emotion */}
            <div>
              <label className="text-sm font-medium text-text-muted block mb-1.5">¿Qué sentís?</label>
              <div className="flex flex-wrap gap-2">
                {emotionOptions.map((e) => (
                  <button key={e} onClick={() => setForm((p) => ({ ...p, emotion: p.emotion === e ? '' : e }))}
                    className={cn('px-3 py-1 rounded-full text-sm border transition-colors', form.emotion === e ? 'bg-accent text-white border-accent' : 'border-border text-text-muted hover:border-accent')}>
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Trigger */}
            <div>
              <label className="text-sm font-medium text-text-muted block mb-1.5">¿Qué lo disparó?</label>
              <div className="flex flex-wrap gap-2">
                {triggerOptions.map((t) => (
                  <button key={t} onClick={() => setForm((p) => ({ ...p, trigger: p.trigger === t ? '' : t }))}
                    className={cn('px-3 py-1 rounded-full text-sm border transition-colors', form.trigger === t ? 'bg-warning-soft text-[var(--warning)] border-[var(--warning)]' : 'border-border text-text-muted hover:border-border')}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="text-sm font-medium text-text-muted block mb-1.5">¿Algo más que quieras escribir?</label>
              <textarea
                rows={2} value={form.feeling_note} onChange={(e) => setForm((p) => ({ ...p, feeling_note: e.target.value }))}
                placeholder="Lo que sea que estés sintiendo..."
                className="w-full rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm text-text placeholder-text-muted resize-none focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setStep('breathe')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition-colors">
                <Wind className="w-4 h-4" /> Respirar primero
              </button>
              <button onClick={() => setStep('result')}
                className="px-4 py-2 rounded-lg border border-border text-text-muted text-sm hover:border-text-muted transition-colors">
                Ir directo al resultado
              </button>
              <button onClick={onCancel} className="ml-auto text-sm text-text-muted hover:text-text transition-colors">Cancelar</button>
            </div>
          </motion.div>
        )}

        {step === 'breathe' && (
          <motion.div key="breathe" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <BreathingExercise onComplete={handleBreathingComplete} />
          </motion.div>
        )}

        {step === 'result' && (
          <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {breathingUsed && (
              <p className="text-sm text-[var(--success)] bg-success-soft rounded-lg px-3 py-2">Bien hecho — usaste la respiración como herramienta.</p>
            )}
            <p className="text-base font-medium text-text">¿Cómo terminó?</p>
            <div className="flex gap-3">
              <button onClick={() => handleSubmit(true)} disabled={saving}
                className="flex-1 py-3 rounded-xl bg-success-soft text-[var(--success)] font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
                Lo resistí
              </button>
              <button onClick={() => handleSubmit(false)} disabled={saving}
                className="flex-1 py-3 rounded-xl bg-warning-soft text-[var(--warning)] font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
                Ocurrió igual
              </button>
            </div>
            <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
              <input type="checkbox" checked={form.mirror_to_emotions} onChange={(e) => setForm((p) => ({ ...p, mirror_to_emotions: e.target.checked }))}
                className="accent-[var(--accent)]" />
              Guardar también en el diario emocional
            </label>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
