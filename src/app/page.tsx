'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, isLoading, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [])

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/today')
      } else {
        router.replace('/login')
      }
    }
  }, [isLoading, isAuthenticated, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="w-8 h-8 border-2 border-accent/40 border-t-accent rounded-full animate-spin" />
    </div>
  )
}
