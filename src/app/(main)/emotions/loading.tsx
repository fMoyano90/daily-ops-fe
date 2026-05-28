import { Header } from '@/components/layout/Header'
import { SkeletonCard, SkeletonStats } from '@/components/shared/Skeleton'

export default function Loading() {
  return (
    <div>
      <Header title="Emotions" subtitle="Cargando diario emocional..." />
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
        <SkeletonStats />
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_1fr] gap-4">
          <SkeletonCard />
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    </div>
  )
}
