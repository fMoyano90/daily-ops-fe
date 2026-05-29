import { SkeletonCard, SkeletonStats } from '@/components/shared/Skeleton'

export default function Loading() {
  return (
    <div className="p-4 space-y-4">
      <SkeletonStats />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  )
}
