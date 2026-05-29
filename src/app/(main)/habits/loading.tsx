import { SkeletonCard } from '@/components/shared/Skeleton'

export default function Loading() {
  return (
    <div className="space-y-3 p-4">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  )
}
