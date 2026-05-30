'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { X } from 'lucide-react'

interface ModalProps {
  open?: boolean
  isOpen?: boolean
  onClose: () => void
  children: React.ReactNode
  maxWidth?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  title?: string
}

const sizeMap = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' }

export function Modal({ open, isOpen, onClose, children, maxWidth, size = 'md', title }: ModalProps) {
  const isOpenState = open ?? isOpen ?? false
  const panelRef = useRef<HTMLDivElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpenState) return
    previouslyFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.requestAnimationFrame(() => {
      const panel = panelRef.current
      const field = panel?.querySelector<HTMLElement>('input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled])')
      const target = field ?? panel?.querySelector<HTMLElement>('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')
      const focusTarget = target ?? panel
      focusTarget?.focus()
    })
    return () => {
      document.body.style.overflow = prev
      if (previouslyFocusedRef.current && document.contains(previouslyFocusedRef.current)) {
        previouslyFocusedRef.current.focus()
      }
      previouslyFocusedRef.current = null
    }
  }, [isOpenState])

  useEffect(() => {
    if (!isOpenState) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return

      const panel = panelRef.current
      if (!panel) return
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>('button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')
      ).filter((element) => element.offsetParent !== null)

      if (focusable.length === 0) {
        e.preventDefault()
        panel.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpenState, onClose])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {isOpenState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-label={title ? undefined : 'Modal'}
            tabIndex={-1}
            className={`relative bg-bg-elevated rounded-2xl shadow-[var(--shadow-lg)] w-full ${maxWidth ?? sizeMap[size]} overflow-hidden`}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 id={titleId} className="text-lg font-bold text-text">{title}</h2>
                <button type="button" onClick={onClose} aria-label="Cerrar modal" className="p-1 text-text-subtle hover:text-text transition-colors">
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            )}
            {!title && (
              <div className="px-6 py-5">
                {children}
              </div>
            )}
            {title && children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
