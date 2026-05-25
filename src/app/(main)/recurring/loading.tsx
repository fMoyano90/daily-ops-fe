import { Skeleton, SkeletonRow } from '@/components/shared/Skeleton'

export default function RecurringLoading() {
  return (
    <div>
      <div className="border-b border-border px-8 py-4">
        <div className="h-8 w-32 bg-bg-muted rounded-lg animate-shimmer" />
      </div>
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-9 w-44 rounded-lg" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
