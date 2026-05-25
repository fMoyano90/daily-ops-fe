import { Skeleton, SkeletonRow } from '@/components/shared/Skeleton'

export default function BacklogLoading() {
  return (
    <div>
      <div className="border-b border-border px-8 py-4">
        <div className="h-8 w-24 bg-bg-muted rounded-lg animate-shimmer" />
      </div>
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 rounded-lg" />
          ))}
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
