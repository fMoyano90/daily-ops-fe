'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { Clock, Settings, Sun, Moon, LogOut, X, Target } from 'lucide-react'
import { useThemeStore } from '@/lib/theme'
import { useAuthStore } from '@/stores/authStore'

interface MobileMoreSheetProps {
  open: boolean
  onClose: () => void
}

export function MobileMoreSheet({ open, onClose }: MobileMoreSheetProps) {
  const { resolved, setTheme } = useThemeStore()
  const { user, logout } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  const handleLogout = () => {
    logout()
    onClose()
    router.push('/login')
  }

  const initials = user?.display_name
    ? user.display_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-bg-elevated rounded-t-3xl border-t border-border safe-pb"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-border-strong/40" />
            </div>
            <div className="px-4 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-accent/20 text-accent flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text truncate">
                    {user?.display_name || 'Usuario'}
                  </p>
                  <p className="text-xs text-text-subtle truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="touch-target -m-2 text-text-muted hover:text-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ul className="px-3 pb-4 space-y-1">
              <li>
                <Link
                  href="/goals"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-text hover:bg-bg-muted touch-target justify-start"
                >
                  <Target className="w-5 h-5 text-text-muted" />
                  Goals
                </Link>
              </li>
              <li>
                <Link
                  href="/history"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-text hover:bg-bg-muted touch-target justify-start"
                >
                  <Clock className="w-5 h-5 text-text-muted" />
                  History
                </Link>
              </li>
              <li>
                <Link
                  href="/settings"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-text hover:bg-bg-muted touch-target justify-start"
                >
                  <Settings className="w-5 h-5 text-text-muted" />
                  Settings
                </Link>
              </li>
              <li>
                <button
                  onClick={() => setTheme(resolved === 'dark' ? 'light' : 'dark')}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-text hover:bg-bg-muted touch-target justify-start"
                >
                  {resolved === 'dark' ? (
                    <Sun className="w-5 h-5 text-text-muted" />
                  ) : (
                    <Moon className="w-5 h-5 text-text-muted" />
                  )}
                  {resolved === 'dark' ? 'Modo claro' : 'Modo oscuro'}
                </button>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-danger hover:bg-danger-soft/40 touch-target justify-start"
                >
                  <LogOut className="w-5 h-5" />
                  Cerrar sesión
                </button>
              </li>
            </ul>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
