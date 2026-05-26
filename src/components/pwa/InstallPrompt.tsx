'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Download, Share, Plus, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'dailyops-install-dismissed'
const DISMISS_DAYS = 7

function wasRecentlyDismissed(): boolean {
  try {
    const ts = localStorage.getItem(DISMISSED_KEY)
    if (!ts) return false
    const elapsed = Date.now() - Number(ts)
    return elapsed < DISMISS_DAYS * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [standalone, setStandalone] = useState(true)
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    const ua = navigator.userAgent
    const ios = /iPad|iPhone|iPod/.test(ua) && !('MSStream' in window)
    const stand =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    setIsIOS(ios)
    setStandalone(stand)
    setDismissed(wasRecentlyDismissed())

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()))
    } catch {}
    setDismissed(true)
  }

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    if (outcome === 'accepted') setDeferred(null)
    dismiss()
  }

  if (standalone || dismissed) return null
  if (!isIOS && !deferred) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-x-3 bottom-3 md:left-auto md:right-4 md:bottom-4 md:max-w-sm z-50 safe-pb"
      >
        <div className="bg-bg-elevated border border-border rounded-2xl shadow-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-text">Instalar DailyOps</p>
              {isIOS ? (
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  Toca <Share className="inline w-3.5 h-3.5 align-text-bottom" /> y luego
                  <span className="inline-flex items-center gap-0.5 mx-1">
                    <Plus className="w-3 h-3" />
                    Agregar a inicio
                  </span>
                  para acceso rápido.
                </p>
              ) : (
                <p className="text-xs text-text-muted mt-1">
                  Acceso rápido desde tu pantalla de inicio, sin barras del navegador.
                </p>
              )}
              {!isIOS && deferred && (
                <button
                  onClick={install}
                  className="mt-3 px-3 py-2 bg-accent text-accent-fg rounded-lg text-xs font-medium hover:bg-accent-hover transition-colors touch-target"
                >
                  Instalar
                </button>
              )}
            </div>
            <button
              onClick={dismiss}
              aria-label="Cerrar"
              className="touch-target -m-2 text-text-subtle hover:text-text"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
