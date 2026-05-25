import { Skeleton } from '@/components/shared/Skeleton'

export default function SettingsLoading() {
  return (
    <div>
      <div className="border-b border-border px-8 py-4">
        <div className="h-8 w-24 bg-bg-muted rounded-lg animate-shimmer" />
      </div>
      <div className="p-8 max-w-4xl mx-auto space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
