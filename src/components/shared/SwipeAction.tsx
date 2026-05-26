'use client'

import { ReactNode, useState } from 'react'
import { motion, PanInfo, useMotionValue, useTransform } from 'motion/react'
import { Check, Trash2 } from 'lucide-react'
import { useIsMobile } from '@/hooks/useIsMobile'

interface SwipeActionProps {
  children: ReactNode
  onSwipeRight?: () => void
  onSwipeLeft?: () => void
  disabled?: boolean
  threshold?: number
}

export function SwipeAction({
  children,
  onSwipeRight,
  onSwipeLeft,
  disabled = false,
  threshold = 80,
}: SwipeActionProps) {
  const isMobile = useIsMobile()
  const x = useMotionValue(0)
  const [hint, setHint] = useState<'right' | 'left' | null>(null)

  const bgOpacity = useTransform(x, [-threshold, 0, threshold], [1, 0, 1])
  const rightOpacity = useTransform(x, [0, threshold], [0, 1])
  const leftOpacity = useTransform(x, [-threshold, 0], [1, 0])

  if (!isMobile || disabled || (!onSwipeRight && !onSwipeLeft)) {
    return <>{children}</>
  }

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    setHint(null)
    if (info.offset.x > threshold && onSwipeRight) {
      onSwipeRight()
    } else if (info.offset.x < -threshold && onSwipeLeft) {
      onSwipeLeft()
    }
  }

  const handleDrag = (_: unknown, info: PanInfo) => {
    if (info.offset.x > threshold * 0.6) setHint('right')
    else if (info.offset.x < -threshold * 0.6) setHint('left')
    else setHint(null)
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      <motion.div
        className="absolute inset-0 flex items-center justify-between px-6 rounded-xl"
        style={{ opacity: bgOpacity }}
      >
        {onSwipeRight && (
          <motion.div
            style={{ opacity: rightOpacity }}
            className="flex items-center gap-2 text-success font-medium"
          >
            <Check className={'w-5 h-5 ' + (hint === 'right' ? 'scale-125' : '') + ' transition-transform'} />
            <span className="text-sm">Completar</span>
          </motion.div>
        )}
        <span />
        {onSwipeLeft && (
          <motion.div
            style={{ opacity: leftOpacity }}
            className="flex items-center gap-2 text-danger font-medium ml-auto"
          >
            <span className="text-sm">Quitar</span>
            <Trash2 className={'w-5 h-5 ' + (hint === 'left' ? 'scale-125' : '') + ' transition-transform'} />
          </motion.div>
        )}
      </motion.div>
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.6}
        style={{ x }}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        whileDrag={{ cursor: 'grabbing' }}
        className="relative touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  )
}
