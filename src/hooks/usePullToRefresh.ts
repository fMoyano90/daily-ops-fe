'use client'

import { useEffect, useRef, useState } from 'react'

interface Options {
  onRefresh: () => Promise<void> | void
  threshold?: number
  enabled?: boolean
}

export function usePullToRefresh({ onRefresh, threshold = 70, enabled = true }: Options) {
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef<number | null>(null)
  const pullRef = useRef(0)

  useEffect(() => {
    if (!enabled) return
    if (typeof window === 'undefined') return

    const onTouchStart = (e: TouchEvent) => {
      if (refreshing) return
      if (window.scrollY > 0) return
      startY.current = e.touches[0].clientY
    }

    const onTouchMove = (e: TouchEvent) => {
      if (startY.current === null) return
      if (refreshing) return
      const delta = e.touches[0].clientY - startY.current
      if (delta <= 0) {
        setPull(0)
        pullRef.current = 0
        return
      }
      // Resistencia: la barra crece más lento que el dedo
      const eased = Math.min(delta * 0.5, threshold * 1.5)
      pullRef.current = eased
      setPull(eased)
    }

    const onTouchEnd = async () => {
      if (startY.current === null) return
      startY.current = null
      if (pullRef.current >= threshold && !refreshing) {
        setRefreshing(true)
        try {
          await onRefresh()
        } finally {
          setRefreshing(false)
          setPull(0)
          pullRef.current = 0
        }
      } else {
        setPull(0)
        pullRef.current = 0
      }
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [enabled, refreshing, onRefresh, threshold])

  return { pull, refreshing, progress: Math.min(pull / threshold, 1) }
}
