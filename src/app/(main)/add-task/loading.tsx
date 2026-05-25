import { SkeletonForm } from '@/components/shared/Skeleton'

export default function AddTaskLoading() {
  return (
    <div>
      <div className="border-b border-border px-8 py-4">
        <div className="h-8 w-28 bg-bg-muted rounded-lg animate-shimmer" />
      </div>
      <div className="p-8 max-w-2xl mx-auto">
        <SkeletonForm />
      </div>
    </div>
  )
}
