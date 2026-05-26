'use client'

import { AnimatePresence, motion } from 'motion/react'
import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

export function OfflineBanner() {
  const online = useOnlineStatus()
  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ y: -32, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -32, opacity: 0 }}
          className="sticky top-0 z-30 bg-warning-soft text-[var(--warning)] text-xs font-medium safe-pt"
          role="status"
        >
          <div className="flex items-center justify-center gap-2 px-4 py-1.5">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Sin conexión — mostrando datos en caché</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
