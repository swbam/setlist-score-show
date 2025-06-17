import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse bg-white/5 rounded-xl", className)} />
  )
}

export function ShowCardSkeleton({ variant = 'grid' }: { variant?: 'grid' | 'list' | 'featured' }) {
  if (variant === 'featured') {
    return (
      <div className="relative bg-gray-900/40 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 h-80 p-6">
        <div className="h-full flex flex-col">
          <Skeleton className="w-20 h-20 rounded-2xl mb-4" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="pt-4 border-t border-white/10">
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'list') {
    return (
      <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <div className="flex items-start gap-5">
          <Skeleton className="w-16 h-16 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-1/3" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/10 p-5 h-full">
      <div className="flex flex-col h-full">
        <div className="mb-4">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="pt-3 border-t border-white/10">
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    </div>
  )
}

export function ArtistCardSkeleton() {
  return (
    <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10">
      <Skeleton className="aspect-square" />
      <div className="p-6 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-10 w-full rounded-[2px]" />
      </div>
    </div>
  )
}

export function TourCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-96">
      <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/10 p-8 h-72">
        <div className="flex flex-col h-full">
          <div className="flex items-start gap-6 mb-6">
            <Skeleton className="w-24 h-24 rounded-2xl" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
            </div>
          </div>
          <div className="flex-1 flex items-end">
            <div className="w-full space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-12 w-20" />
                <Skeleton className="h-12 w-20" />
                <Skeleton className="h-12 w-32" />
              </div>
              <Skeleton className="h-12 w-full rounded-[2px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function GenreCardSkeleton() {
  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
      <div className="flex items-center gap-4">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  )
}