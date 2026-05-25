'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { useAuthStore } from '@/stores/authStore'

export default function MainLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading, initialize } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    initialize()
  }, [])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-8 h-8 border-2 border-accent/40 border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <MainLayout>{children}</MainLayout>
}
