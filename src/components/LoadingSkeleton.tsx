import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface LoadingSkeletonProps {
  type: 'artist-card' | 'show-card' | 'setlist' | 'trending' | 'search-result';
  count?: number;
}

const LoadingSkeleton = ({ type, count = 1 }: LoadingSkeletonProps) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'artist-card':
        return (
          <Card className="bg-gray-900 border-gray-800 overflow-hidden">
            <div className="aspect-square">
              <Skeleton className="w-full h-full bg-gray-800" />
            </div>
            <CardContent className="p-4">
              <Skeleton className="h-6 w-3/4 mb-2 bg-gray-800" />
              <Skeleton className="h-4 w-1/2 bg-gray-800" />
            </CardContent>
          </Card>
        );

      case 'show-card':
        return (
          <Card className="bg-gray-900 border-gray-800 overflow-hidden hover:border-gray-700 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Skeleton className="h-6 w-3/4 mb-2 bg-gray-800" />
                  <Skeleton className="h-4 w-1/2 bg-gray-800" />
                </div>
                <Skeleton className="h-12 w-12 rounded-lg bg-gray-800" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 bg-gray-800" />
                <Skeleton className="h-4 w-32 bg-gray-800" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 bg-gray-800" />
                <Skeleton className="h-4 w-40 bg-gray-800" />
              </div>
              <Skeleton className="h-10 w-full bg-gray-800" />
            </CardContent>
          </Card>
        );

      case 'setlist':
        return (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-800/40 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <Skeleton className="h-6 w-6 bg-gray-700" />
                  <div>
                    <Skeleton className="h-5 w-48 mb-1 bg-gray-700" />
                    <Skeleton className="h-4 w-32 bg-gray-700" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded bg-gray-700" />
                  <Skeleton className="h-6 w-12 bg-gray-700" />
                  <Skeleton className="h-8 w-8 rounded bg-gray-700" />
                </div>
              </div>
            ))}
          </div>
        );

      case 'trending':
        return (
          <div className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800/50 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full bg-gray-800" />
                <div>
                  <Skeleton className="h-5 w-32 mb-1 bg-gray-800" />
                  <Skeleton className="h-4 w-24 bg-gray-800" />
                </div>
              </div>
              <Skeleton className="h-8 w-20 bg-gray-800" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 bg-gray-800" />
                <Skeleton className="h-4 w-40 bg-gray-800" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 bg-gray-800" />
                <Skeleton className="h-4 w-32 bg-gray-800" />
              </div>
            </div>
          </div>
        );

      case 'search-result':
        return (
          <div className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800/50 transition-colors">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-lg bg-gray-800" />
              <div className="flex-1">
                <Skeleton className="h-6 w-48 mb-2 bg-gray-800" />
                <Skeleton className="h-4 w-32 bg-gray-800" />
              </div>
              <Skeleton className="h-10 w-24 bg-gray-800" />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {[...Array(count)].map((_, index) => (
        <div key={index}>{renderSkeleton()}</div>
      ))}
    </>
  );
};

export default LoadingSkeleton;