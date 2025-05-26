
import React from 'react';
import { Button } from './button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} retry={this.retry} />;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <Button onClick={this.retry} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Pre-built error fallback components
export const LoadingErrorFallback: React.FC<{ error?: Error; retry: () => void }> = ({ error, retry }) => (
  <div className="flex flex-col items-center justify-center p-6 text-center">
    <AlertTriangle className="h-8 w-8 text-yellow-500 mb-3" />
    <h3 className="font-medium mb-2">Failed to load data</h3>
    <p className="text-sm text-gray-600 mb-3">
      {error?.message || 'There was a problem loading the content'}
    </p>
    <Button onClick={retry} size="sm" variant="outline">
      <RefreshCw className="h-4 w-4 mr-2" />
      Retry
    </Button>
  </div>
);

export const VotingErrorFallback: React.FC<{ error?: Error; retry: () => void }> = ({ error, retry }) => (
  <div className="flex flex-col items-center justify-center p-4 text-center border border-red-200 rounded-lg bg-red-50">
    <AlertTriangle className="h-6 w-6 text-red-500 mb-2" />
    <h4 className="font-medium text-red-800 mb-1">Voting Error</h4>
    <p className="text-sm text-red-600 mb-3">
      {error?.message || 'Unable to process your vote'}
    </p>
    <Button onClick={retry} size="sm" variant="destructive">
      Try Voting Again
    </Button>
  </div>
);
