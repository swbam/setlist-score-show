
import React from 'react';
import { Loader2, Music, Users, Calendar } from 'lucide-react';
import { Card, CardContent } from './card';
import { Skeleton } from './skeleton';

// Generic loading spinner
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  };

  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
  );
};

// Show card loading skeleton
export const ShowCardSkeleton: React.FC = () => (
  <Card className="bg-gray-900 border-gray-800">
    <CardContent className="p-6">
      <div className="flex items-center space-x-2 mb-3">
        <Skeleton className="h-5 w-16 bg-gray-700" />
      </div>
      <Skeleton className="h-6 w-3/4 mb-2 bg-gray-700" />
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-600" />
          <Skeleton className="h-4 w-24 bg-gray-700" />
        </div>
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-gray-600" />
          <Skeleton className="h-4 w-16 bg-gray-700" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Trending shows loading grid
export const TrendingShowsLoading: React.FC<{ count?: number }> = ({ count = 8 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <ShowCardSkeleton key={i} />
    ))}
  </div>
);

// Setlist loading skeleton
export const SetlistLoading: React.FC = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between mb-6">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-6 w-24" />
    </div>
    {Array.from({ length: 5 }).map((_, i) => (
      <Card key={i} className="bg-gray-900 border-gray-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Music className="h-5 w-5 text-gray-600" />
              <div>
                <Skeleton className="h-5 w-48 mb-1 bg-gray-700" />
                <Skeleton className="h-4 w-32 bg-gray-700" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-9 w-16 bg-gray-700" />
              <Skeleton className="h-9 w-20 bg-gray-700" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

// Vote button loading state
export const VoteButtonLoading: React.FC = () => (
  <div className="flex items-center space-x-2 px-3 py-2 bg-gray-800 rounded-md">
    <LoadingSpinner size="sm" />
    <span className="text-sm text-gray-400">Voting...</span>
  </div>
);

// Page loading overlay
export const PageLoadingOverlay: React.FC<{ message?: string }> = ({ 
  message = 'Loading...' 
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-gray-900 p-6 rounded-lg flex items-center space-x-3">
      <LoadingSpinner size="lg" className="text-yellow-metal-400" />
      <span className="text-white font-medium">{message}</span>
    </div>
  </div>
);

// Empty state component
export const EmptyState: React.FC<{
  icon?: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ icon: Icon = Music, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <Icon className="h-12 w-12 text-gray-400 mb-4" />
    <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
    <p className="text-gray-400 mb-6 max-w-md">{description}</p>
    {action}
  </div>
);
