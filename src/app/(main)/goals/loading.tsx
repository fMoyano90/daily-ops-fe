'use client'

import { Header } from '@/components/layout/Header'
import { SkeletonRow, Skeleton } from '@/components/shared/Skeleton'

export default function GoalsLoading() {
  return (
    <div>
      <Header title="Goals" subtitle="Cargando metas..." />
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}
        </div>
      </div>
    </div>
  )
}
