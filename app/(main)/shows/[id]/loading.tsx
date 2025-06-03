import { Skeleton } from '@/components/ui/skeleton'

export default function ShowLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Show header skeleton */}
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-gray-800 to-gray-700 p-8">
        <Skeleton className="h-10 w-64 mb-2 bg-gray-600" />
        <Skeleton className="h-6 w-48 mb-2 bg-gray-600" />
        <Skeleton className="h-5 w-32 bg-gray-600" />
      </div>

      {/* Voting section skeleton */}
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-48 bg-gray-800" />
          <Skeleton className="h-5 w-24 bg-gray-800" />
        </div>

        {/* Song list skeletons */}
        {[...Array(10)].map((_, i) => (
          <div key={i} className="bg-gray-900 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="w-8 h-8 bg-gray-800" />
              <div>
                <Skeleton className="h-5 w-48 mb-1 bg-gray-800" />
                <Skeleton className="h-4 w-32 bg-gray-800" />
              </div>
            </div>
            <Skeleton className="w-24 h-10 rounded-lg bg-gray-800" />
          </div>
        ))}
      </div>

      {/* Live activity indicator skeleton */}
      <div className="fixed bottom-4 right-4">
        <Skeleton className="w-40 h-10 rounded-full bg-gray-800" />
      </div>
    </div>
  )
}