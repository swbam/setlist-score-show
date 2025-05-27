
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

export function ShowPageSkeleton() {
  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto max-w-7xl px-4 pt-20 pb-32 md:pb-12">
        {/* Show Header Skeleton */}
        <div className="relative mb-8 overflow-hidden rounded-xl bg-gradient-to-r from-yellow-metal-900/20 to-yellow-metal-800/20 p-8">
          <div className="flex flex-col md:flex-row gap-6">
            <Skeleton className="h-32 w-32 rounded-full bg-gray-700" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-8 w-3/4 bg-gray-700" />
              <Skeleton className="h-6 w-1/2 bg-gray-700" />
              <div className="flex gap-4">
                <Skeleton className="h-10 w-24 bg-gray-700" />
                <Skeleton className="h-10 w-24 bg-gray-700" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Voting Section Skeleton */}
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-12 w-64 bg-gray-700" />
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="bg-gray-900/40 border-gray-800/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-6 w-3/4 bg-gray-700" />
                      <Skeleton className="h-4 w-1/2 bg-gray-700" />
                    </div>
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-8 w-12 bg-gray-700" />
                      <Skeleton className="h-10 w-20 bg-gray-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="bg-gray-900/40 border-gray-800/50">
                <CardHeader>
                  <Skeleton className="h-6 w-32 bg-gray-700" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full bg-gray-700" />
                  <Skeleton className="h-4 w-3/4 bg-gray-700" />
                  <Skeleton className="h-4 w-1/2 bg-gray-700" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SetlistSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i} className="bg-gray-900/40 border-gray-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <Skeleton className="h-6 w-8 bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-3/4 bg-gray-700" />
                  <Skeleton className="h-4 w-1/2 bg-gray-700" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-8 w-12 bg-gray-700" />
                <Skeleton className="h-10 w-20 bg-gray-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function SearchResultsSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="bg-gray-900/40 border-gray-800/50 hover:border-yellow-metal-600/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <Skeleton className="h-16 w-16 rounded-lg bg-gray-700" />
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-3/4 bg-gray-700" />
                    <Skeleton className="h-4 w-1/2 bg-gray-700" />
                  </div>
                  <Skeleton className="h-6 w-16 bg-gray-700" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20 bg-gray-700" />
                  <Skeleton className="h-6 w-24 bg-gray-700" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function LoadingSpinner({ size = 'default', className = '' }: { size?: 'sm' | 'default' | 'lg', className?: string }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <Loader2 className={`animate-spin text-yellow-400 ${sizeClasses[size]} ${className}`} />
  );
}

export function PageLoader() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-gray-300 text-lg">Loading...</p>
      </div>
    </div>
  );
}
