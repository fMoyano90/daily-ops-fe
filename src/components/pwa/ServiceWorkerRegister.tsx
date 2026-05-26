'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { RefreshCw, X } from 'lucide-react'

export function ServiceWorkerRegister() {
  const [updateReady, setUpdateReady] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    // En dev: desregistrar cualquier SW de una build anterior y limpiar caches,
    // así no sirve bundles viejos sobre el server de Next dev.
    if (process.env.NODE_ENV === 'development') {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister())
      })
      if ('caches' in window) {
        caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)))
      }
      return
    }

    let cancelled = false
    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        })
        if (cancelled) return
        setRegistration(reg)

        if (reg.waiting) setUpdateReady(true)

        reg.addEventListener('updatefound', () => {
          const installing = reg.installing
          if (!installing) return
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateReady(true)
            }
          })
        })
      } catch (err) {
        console.error('SW register failed', err)
      }
    }
    register()

    let reloaded = false
    const onCtrlChange = () => {
      if (reloaded) return
      reloaded = true
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', onCtrlChange)

    return () => {
      cancelled = true
      navigator.serviceWorker.removeEventListener('controllerchange', onCtrlChange)
    }
  }, [])

  const applyUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
  }

  return (
    <AnimatePresence>
      {updateReady && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed inset-x-3 bottom-3 md:left-auto md:right-4 md:bottom-4 md:max-w-sm z-[60] safe-pb"
        >
          <div className="bg-bg-elevated border border-accent/40 rounded-2xl shadow-lg p-4 flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-accent flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text">Nueva versión disponible</p>
              <p className="text-xs text-text-muted">Recarga para actualizar.</p>
            </div>
            <button
              onClick={applyUpdate}
              className="px-3 py-1.5 bg-accent text-accent-fg rounded-lg text-xs font-medium touch-target"
            >
              Recargar
            </button>
            <button
              onClick={() => setUpdateReady(false)}
              aria-label="Cerrar"
              className="touch-target -m-2 text-text-subtle hover:text-text"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
