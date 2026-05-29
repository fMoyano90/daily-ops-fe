'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Calendar, Clock, Tag, X } from 'lucide-react'
import { TASK_CATEGORIES, categoryColor, isScheduledCategory } from '@/lib/categories'

interface CategoryPickerProps {
  category?: string | null
  dueDate?: string | null
  meetingTime?: string | null
  editable?: boolean
  onUpdate?: (data: { category: string | null; due_date?: string | null; meeting_time?: string | null }) => Promise<void> | void
}

function formatMeetingTime(value: string | null | undefined): string | null {
  if (!value) return null
  // Accept both "HH:MM" and "HH:MM:SS"
  const [h, m] = value.split(':')
  if (!h || !m) return value
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
}

function formatScheduleDate(value: string | null | undefined): string | null {
  if (!value) return null
  return value.split('T')[0]
}

function formatDisplayDate(value: string | null | undefined): string | null {
  const date = formatScheduleDate(value)
  if (!date) return null
  return new Date(`${date}T00:00:00`).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
}

export function CategoryPicker({ category, dueDate, meetingTime, editable = false, onUpdate }: CategoryPickerProps) {
  const [open, setOpen] = useState(false)
  const [draftCategory, setDraftCategory] = useState<string>(category ?? '')
  const [draftCustom, setDraftCustom] = useState<string>('')
  const [draftDate, setDraftDate] = useState<string>(formatScheduleDate(dueDate) ?? '')
  const [draftTime, setDraftTime] = useState<string>(formatMeetingTime(meetingTime) ?? '')
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const updatePosition = () => {
      const rect = triggerRef.current!.getBoundingClientRect()
      const popoverWidth = 280
      const viewportWidth = window.innerWidth
      let left = rect.left
      if (left + popoverWidth > viewportWidth - 8) left = viewportWidth - popoverWidth - 8
      if (left < 8) left = 8
      setPosition({ top: rect.bottom + 6, left })
    }
    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (triggerRef.current?.contains(target)) return
      if (popoverRef.current?.contains(target)) return
      setOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    setDraftCategory(category ?? '')
    setDraftCustom(category && !TASK_CATEGORIES.includes(category as never) ? category : '')
    setDraftDate(formatScheduleDate(dueDate) ?? '')
    setDraftTime(formatMeetingTime(meetingTime) ?? '')
  }, [category, dueDate, meetingTime])

  const displayDate = isScheduledCategory(category) ? formatDisplayDate(dueDate) : null
  const displayTime = formatMeetingTime(meetingTime)
  const isPredefined = category ? TASK_CATEGORIES.includes(category as never) : false
  const showCustom = draftCategory === '__custom__' || (!!draftCategory && !TASK_CATEGORIES.includes(draftCategory as never))

  const handleOpen = () => {
    if (!editable) return
    setDraftCategory(category ?? '')
    setDraftCustom(category && !TASK_CATEGORIES.includes(category as never) ? category : '')
    setDraftDate(formatScheduleDate(dueDate) ?? '')
    setDraftTime(formatMeetingTime(meetingTime) ?? '')
    setOpen(true)
  }

  const handleSave = async () => {
    if (!onUpdate) return
    let finalCategory: string | null
    if (draftCategory === '__custom__') {
      finalCategory = draftCustom.trim() || null
    } else if (draftCategory === '') {
      finalCategory = null
    } else {
      finalCategory = draftCategory
    }
    const scheduledSelected = isScheduledCategory(finalCategory)
    const update: { category: string | null; due_date?: string | null; meeting_time?: string | null } = {
      category: finalCategory,
      meeting_time: scheduledSelected ? (draftTime || null) : null,
    }
    if (scheduledSelected) update.due_date = draftDate || null

    setSaving(true)
    try {
      await onUpdate(update)
      setOpen(false)
    } catch (err) {
      console.error('Failed to save category:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleClear = async () => {
    if (!onUpdate) return
    setSaving(true)
    try {
      await onUpdate({ category: null, meeting_time: null })
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const scheduledSelected = isScheduledCategory(
    draftCategory === '__custom__' ? draftCustom : draftCategory
  )

  const popover = mounted && open && position ? createPortal(
    <AnimatePresence>
      <motion.div
        ref={popoverRef}
        initial={{ opacity: 0, y: -4, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.96 }}
        transition={{ duration: 0.12 }}
        style={{ position: 'fixed', top: position.top, left: position.left, width: 280 }}
        className="z-50 bg-bg-elevated border border-border rounded-lg shadow-[var(--shadow-lg)] p-3"
      >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-text-muted">Categoría</span>
              {category && (
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={saving}
                  className="flex items-center gap-1 text-[11px] text-text-subtle hover:text-danger transition-colors"
                  title="Quitar categoría"
                >
                  <X className="w-3 h-3" />
                  Quitar
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-1 mb-2">
              {TASK_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setDraftCategory(c)
                    setDraftCustom('')
                  }}
                  className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md border transition-all ${categoryColor(c)} ${
                    draftCategory === c ? 'ring-2 ring-accent ring-offset-1 ring-offset-bg-elevated' : ''
                  }`}
                >
                  <Tag className="w-3 h-3" />
                  {c}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setDraftCategory('__custom__')}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md border transition-all bg-bg-muted text-text-muted border-border ${
                  draftCategory === '__custom__' || (!!draftCategory && !isPredefined) ? 'ring-2 ring-accent ring-offset-1 ring-offset-bg-elevated' : ''
                }`}
              >
                <Tag className="w-3 h-3" />
                Otro...
              </button>
            </div>

            {showCustom && (
              <input
                type="text"
                value={draftCustom}
                onChange={(e) => setDraftCustom(e.target.value)}
                placeholder="Nombre de categoría..."
                maxLength={100}
                className="w-full text-sm px-2 py-1.5 mb-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-bg-elevated text-text"
              />
            )}

            {scheduledSelected && (
              <div className="mt-2 pt-2 border-t border-border space-y-2">
                <label className="flex items-center gap-2 text-xs font-medium text-text-muted mb-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Fecha
                </label>
                <input
                  type="date"
                  value={draftDate}
                  onChange={(e) => setDraftDate(e.target.value)}
                  className="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-bg-elevated text-text"
                />
                <label className="flex items-center gap-2 text-xs font-medium text-text-muted mb-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Hora de inicio
                </label>
                <input
                  type="time"
                  value={draftTime}
                  onChange={(e) => setDraftTime(e.target.value)}
                  className="w-full text-sm px-2 py-1.5 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent bg-bg-elevated text-text"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 mt-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-3 py-1 text-xs text-text-subtle hover:text-text transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-1 bg-accent text-accent-fg text-xs font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-60"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  ) : null

  return (
    <div className="inline-flex items-center gap-1.5">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        disabled={!editable}
        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium border rounded-full transition-all ${categoryColor(category)} ${
          editable ? 'cursor-pointer hover:brightness-110' : 'cursor-default'
        }`}
        title={editable ? 'Editar categoría' : undefined}
      >
        <Tag className="w-3 h-3" />
        {category || 'Sin categoría'}
      </button>

      {displayTime && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-[var(--info-soft)] text-[var(--info)] border border-[var(--info)]/30 rounded-full">
          <Clock className="w-3 h-3" />
          {displayTime}
        </span>
      )}

      {displayDate && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-bg-muted text-text-muted border border-border rounded-full">
          <Calendar className="w-3 h-3" />
          {displayDate}
        </span>
      )}

      {popover}
    </div>
  )
}
