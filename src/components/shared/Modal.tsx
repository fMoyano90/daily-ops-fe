'use client'

import { useEffect, useState } from 'react'
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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpenState) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [isOpenState])

  useEffect(() => {
    if (!isOpenState) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
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
            className={`relative bg-bg-elevated rounded-2xl shadow-[var(--shadow-lg)] w-full ${maxWidth ?? sizeMap[size]} overflow-hidden`}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="text-lg font-bold text-text">{title}</h2>
                <button onClick={onClose} className="p-1 text-text-subtle hover:text-text transition-colors">
                  <X className="w-5 h-5" />
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
