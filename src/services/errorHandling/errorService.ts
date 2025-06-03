import { toast } from '@/components/ui/sonner';

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  context?: string;
}

export enum ErrorCode {
  // Auth errors
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_FAILED = 'AUTH_FAILED',
  
  // Vote errors
  VOTE_LIMIT_DAILY = 'VOTE_LIMIT_DAILY',
  VOTE_LIMIT_SHOW = 'VOTE_LIMIT_SHOW',
  VOTE_ALREADY_CAST = 'VOTE_ALREADY_CAST',
  VOTE_RATE_LIMIT = 'VOTE_RATE_LIMIT',
  VOTE_FAILED = 'VOTE_FAILED',
  
  // Data errors
  DATA_NOT_FOUND = 'DATA_NOT_FOUND',
  DATA_FETCH_FAILED = 'DATA_FETCH_FAILED',
  DATA_SAVE_FAILED = 'DATA_SAVE_FAILED',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // General errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR'
}

class ErrorService {
  private errorLog: AppError[] = [];
  private maxLogSize = 100;

  // Log error
  logError(error: AppError) {
    console.error(`[ErrorService] ${error.code}: ${error.message}`, error.details);
    
    // Add to error log
    this.errorLog.unshift(error);
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }
    
    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(error);
    }
  }

  // Handle error and show user-friendly message
  handleError(error: unknown, context?: string): AppError {
    const appError = this.parseError(error, context);
    this.logError(appError);
    this.showUserMessage(appError);
    return appError;
  }

  // Parse various error types into AppError
  private parseError(error: unknown, context?: string): AppError {
    const timestamp = new Date();

    // Handle known error codes
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      // Auth errors
      if (message.includes('not authenticated') || message.includes('not authorized')) {
        return {
          code: ErrorCode.AUTH_REQUIRED,
          message: 'Please log in to continue',
          details: error,
          timestamp,
          context
        };
      }
      
      // Vote limit errors
      if (message.includes('daily vote limit')) {
        return {
          code: ErrorCode.VOTE_LIMIT_DAILY,
          message: 'You\'ve reached your daily vote limit (50 votes)',
          details: error,
          timestamp,
          context
        };
      }
      
      if (message.includes('show vote limit')) {
        return {
          code: ErrorCode.VOTE_LIMIT_SHOW,
          message: 'You\'ve used all 10 votes for this show',
          details: error,
          timestamp,
          context
        };
      }
      
      if (message.includes('already voted')) {
        return {
          code: ErrorCode.VOTE_ALREADY_CAST,
          message: 'You\'ve already voted for this song',
          details: error,
          timestamp,
          context
        };
      }
      
      // Network errors
      if (message.includes('network') || message.includes('fetch')) {
        return {
          code: ErrorCode.NETWORK_ERROR,
          message: 'Network error. Please check your connection',
          details: error,
          timestamp,
          context
        };
      }
      
      // Rate limit
      if (message.includes('rate limit')) {
        return {
          code: ErrorCode.RATE_LIMIT_ERROR,
          message: 'Too many requests. Please wait a moment',
          details: error,
          timestamp,
          context
        };
      }
    }
    
    // Default error
    return {
      code: ErrorCode.UNKNOWN_ERROR,
      message: 'Something went wrong. Please try again',
      details: error,
      timestamp,
      context
    };
  }

  // Show user-friendly error message
  private showUserMessage(error: AppError) {
    switch (error.code) {
      case ErrorCode.AUTH_REQUIRED:
        toast.error(error.message, {
          action: {
            label: 'Log In',
            onClick: () => window.location.href = '/login'
          }
        });
        break;
        
      case ErrorCode.VOTE_LIMIT_DAILY:
      case ErrorCode.VOTE_LIMIT_SHOW:
        toast.error(error.message, {
          description: 'Come back tomorrow to vote again!'
        });
        break;
        
      case ErrorCode.NETWORK_ERROR:
        toast.error(error.message, {
          description: 'Please check your internet connection'
        });
        break;
        
      case ErrorCode.RATE_LIMIT_ERROR:
        toast.error(error.message, {
          duration: 5000
        });
        break;
        
      default:
        toast.error(error.message);
    }
  }

  // Send error to monitoring service
  private async sendToMonitoring(error: AppError) {
    try {
      // In production, send to Sentry, LogRocket, etc.
      console.log('[ErrorService] Would send to monitoring:', error);
    } catch (err) {
      console.error('[ErrorService] Failed to send to monitoring:', err);
    }
  }

  // Get recent errors for debugging
  getRecentErrors(): AppError[] {
    return [...this.errorLog];
  }

  // Clear error log
  clearErrorLog() {
    this.errorLog = [];
  }

  // Create error boundary handler
  createErrorBoundaryHandler() {
    return (error: Error, errorInfo: any) => {
      this.handleError(error, 'React Error Boundary');
      
      // Log component stack in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Component Stack:', errorInfo.componentStack);
      }
    };
  }
}

// Export singleton instance
export const errorService = new ErrorService();

// Export convenience function
export function handleError(error: unknown, context?: string): AppError {
  return errorService.handleError(error, context);
}