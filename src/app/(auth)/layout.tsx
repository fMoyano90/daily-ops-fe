'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/today')
    }
  }, [isAuthenticated, router])

  if (isAuthenticated) {
    return null
  }

  return <>{children}</>
}
