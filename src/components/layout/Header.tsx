'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Sun, Moon, Command } from 'lucide-react'
import { formatDateFull, getTodayStr } from '@/lib/utils'
import { useThemeStore } from '@/lib/theme'

interface HeaderProps {
  title?: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const today = getTodayStr()
  const [time, setTime] = useState('')
  const { resolved, setTheme } = useThemeStore()

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }))
    }
    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [])

  const toggleTheme = () => {
    setTheme(resolved === 'dark' ? 'light' : 'dark')
  }

  return (
    <header className="sticky top-0 z-40 bg-bg/80 backdrop-blur-md border-b border-border px-8 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text">{title || 'Today'}</h2>
          {subtitle && (
            <p className="text-sm text-text-muted mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Date + time */}
          <div className="text-right mr-2">
            <p className="text-sm font-medium text-text-muted capitalize">
              {formatDateFull(today)}
            </p>
            <AnimatePresence mode="wait">
              {time && (
                <motion.p
                  key={time}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-text-subtle mt-0.5 font-mono tabular-nums"
                >
                  {time}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Command palette stub */}
          <button
            className="p-2 rounded-lg text-text-subtle hover:text-text hover:bg-bg-muted transition-colors"
            title="Paleta de comandos (próximamente ⌘K)"
            onClick={() => {}}
          >
            <Command className="w-4 h-4" />
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-text-subtle hover:text-text hover:bg-bg-muted transition-colors"
            title={resolved === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            <AnimatePresence mode="wait" initial={false}>
              {resolved === 'dark' ? (
                <motion.span
                  key="sun"
                  initial={{ rotate: -30, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 30, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun className="w-4 h-4" />
                </motion.span>
              ) : (
                <motion.span
                  key="moon"
                  initial={{ rotate: 30, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -30, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon className="w-4 h-4" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </header>
  )
}
