'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Sun, Moon, LogOut } from 'lucide-react'
import { formatDateFull, getTodayStr } from '@/lib/utils'
import { useThemeStore } from '@/lib/theme'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  title?: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const today = getTodayStr()
  const [time, setTime] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const { resolved, setTheme } = useThemeStore()
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }))
    }
    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleTheme = () => {
    setTheme(resolved === 'dark' ? 'light' : 'dark')
  }

  const handleLogout = () => {
    logout()
    setShowMenu(false)
    router.push('/login')
  }

  const initials = user?.display_name
    ? user.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <header className="sticky top-0 z-40 bg-bg/80 backdrop-blur-md border-b border-border pt-8 pb-4 md:pt-10 md:pb-6 safe-pt safe-pl safe-pr">
      {/* Title flush-left in main, just past the sidebar's edge */}
      <div className="pl-4 md:pl-8 pr-24 md:pr-[300px] pt-3">
        <h2 className="text-lg md:text-2xl font-bold text-text truncate">{title || 'Hoy'}</h2>
        {subtitle && (
          <p className="hidden md:block text-sm text-text-muted mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Right zone: date/time/icons pinned to viewport right edge */}
      <div className="absolute right-0 top-[env(safe-area-inset-top)] h-[calc(100%-env(safe-area-inset-top))] safe-pr pr-3 md:right-0 md:top-0 md:h-full md:pr-8 flex items-center gap-1 md:gap-3">
        {/* Date + time — desktop only */}
        <div className="hidden md:block text-right mr-2">
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

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="touch-target rounded-lg text-text-subtle hover:text-text hover:bg-bg-muted transition-colors"
          title={resolved === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          aria-label="Cambiar tema"
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
                <Sun className="w-5 h-5 md:w-4 md:h-4" />
              </motion.span>
            ) : (
              <motion.span
                key="moon"
                initial={{ rotate: 30, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -30, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Moon className="w-5 h-5 md:w-4 md:h-4" />
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* User menu — desktop only (mobile uses MobileMoreSheet) */}
        <div className="hidden md:block relative mr-10" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-bg-muted transition-colors"
            title={user?.email || 'Usuario'}
          >
            <div className="w-7 h-7 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold">
              {initials}
            </div>
          </button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-56 bg-bg-elevated border border-border rounded-xl shadow-lg overflow-hidden"
              >
                <div className="p-3 border-b border-border">
                  <p className="text-sm font-medium text-text truncate">{user?.display_name}</p>
                  <p className="text-xs text-text-subtle truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-text-muted hover:text-red-400 hover:bg-red-500/5 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
