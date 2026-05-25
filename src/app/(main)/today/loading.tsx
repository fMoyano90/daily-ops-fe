import { SkeletonStats, SkeletonCard } from '@/components/shared/Skeleton'

export default function TodayLoading() {
  return (
    <div>
      <div className="border-b border-border px-8 py-4">
        <div className="h-8 w-24 bg-bg-muted rounded-lg animate-shimmer" />
      </div>
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <SkeletonStats />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
