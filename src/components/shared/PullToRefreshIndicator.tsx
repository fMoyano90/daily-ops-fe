'use client'

import { motion } from 'motion/react'
import { RefreshCw } from 'lucide-react'

interface Props {
  pull: number
  refreshing: boolean
  progress: number
}

export function PullToRefreshIndicator({ pull, refreshing, progress }: Props) {
  const visible = pull > 6 || refreshing
  return (
    <motion.div
      className="md:hidden fixed left-1/2 -translate-x-1/2 z-30 pointer-events-none"
      style={{
        top: `calc(env(safe-area-inset-top) + ${Math.max(8, pull - 28)}px)`,
        opacity: visible ? 1 : 0,
      }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className="w-10 h-10 rounded-full bg-bg-elevated border border-border shadow-md flex items-center justify-center">
        <RefreshCw
          className={
            'w-4 h-4 text-accent ' +
            (refreshing ? 'animate-spin' : '')
          }
          style={{
            transform: refreshing ? undefined : `rotate(${progress * 360}deg)`,
          }}
        />
      </div>
    </motion.div>
  )
}
