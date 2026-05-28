'use client'

import { Header } from '@/components/layout/Header'

export default function GoalDetailLoading() {
  return (
    <div>
      <Header title="Detalle de meta" />
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <div className="w-20 h-8 bg-bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 flex justify-center">
            <div className="w-32 h-32 bg-bg-muted rounded-full animate-pulse" />
          </div>
          <div className="md:col-span-2 space-y-3">
            <div className="h-8 w-3/4 bg-bg-muted rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-bg-muted rounded animate-pulse" />
            <div className="h-4 w-full bg-bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
