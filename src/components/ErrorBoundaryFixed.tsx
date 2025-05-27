
import React, { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId: string;
}

export class ErrorBoundaryFixed extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorId: Math.random().toString(36).substring(7)
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: Math.random().toString(36).substring(7)
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo);
    
    // Log to monitoring service (could be Sentry, LogRocket, etc.)
    console.error('Error ID:', this.state.errorId, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorId: Math.random().toString(36).substring(7)
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <Alert className="bg-red-900/20 border-red-800">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-white">
                <div className="space-y-4">
                  <h3 className="font-semibold">Something went wrong</h3>
                  <p className="text-sm text-gray-300">
                    {this.state.error?.message || 'An unexpected error occurred'}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={this.handleRetry}
                      size="sm"
                      className="bg-white text-black hover:bg-gray-200"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                    <Button
                      onClick={() => window.location.href = '/'}
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      Go Home
                    </Button>
                  </div>
                  <details className="text-xs text-gray-500">
                    <summary className="cursor-pointer">Error Details</summary>
                    <pre className="mt-2 p-2 bg-gray-800 rounded text-xs overflow-auto">
                      Error ID: {this.state.errorId}
                      {'\n'}
                      {this.state.error?.stack}
                    </pre>
                  </details>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to handle errors
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    console.error('Error caught by useErrorHandler:', error);
    setError(error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  // Throw error to trigger Error Boundary
  if (error) {
    throw error;
  }

  return { handleError, clearError };
}
