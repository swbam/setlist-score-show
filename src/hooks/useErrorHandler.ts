
import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/sonner';

export interface ErrorState {
  error: Error | null;
  isError: boolean;
}

export interface ErrorHandlerOptions {
  showToast?: boolean;
  toastTitle?: string;
  logError?: boolean;
  fallbackMessage?: string;
}

export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isError: false
  });

  const {
    showToast = true,
    toastTitle = 'Error',
    logError = true,
    fallbackMessage = 'An unexpected error occurred'
  } = options;

  const handleError = useCallback((error: Error | string | unknown) => {
    let errorObj: Error;
    
    if (error instanceof Error) {
      errorObj = error;
    } else if (typeof error === 'string') {
      errorObj = new Error(error);
    } else {
      errorObj = new Error(fallbackMessage);
    }

    if (logError) {
      console.error('Error handled:', errorObj);
    }

    setErrorState({
      error: errorObj,
      isError: true
    });

    if (showToast) {
      toast.error(toastTitle, {
        description: errorObj.message
      });
    }

    return errorObj;
  }, [showToast, toastTitle, logError, fallbackMessage]);

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isError: false
    });
  }, []);

  const retry = useCallback((retryFn: () => void | Promise<void>) => {
    clearError();
    try {
      const result = retryFn();
      if (result instanceof Promise) {
        result.catch(handleError);
      }
    } catch (error) {
      handleError(error);
    }
  }, [clearError, handleError]);

  return {
    ...errorState,
    handleError,
    clearError,
    retry
  };
}

// Specific error handlers for common scenarios
export function useVotingErrorHandler() {
  return useErrorHandler({
    toastTitle: 'Voting Error',
    fallbackMessage: 'Unable to process your vote. Please try again.'
  });
}

export function useDataFetchErrorHandler() {
  return useErrorHandler({
    toastTitle: 'Loading Error',
    fallbackMessage: 'Failed to load data. Please refresh the page.'
  });
}

export function useAuthErrorHandler() {
  return useErrorHandler({
    toastTitle: 'Authentication Error',
    fallbackMessage: 'Please log in to continue.'
  });
}
