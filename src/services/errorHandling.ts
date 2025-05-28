/**
 * Comprehensive Error Handling Service
 * Provides centralized error management, logging, and recovery strategies
 */

export enum ErrorType {
  NETWORK = 'NETWORK',
  DATABASE = 'DATABASE',
  AUTHENTICATION = 'AUTHENTICATION',
  VALIDATION = 'VALIDATION',
  RATE_LIMIT = 'RATE_LIMIT',
  PERMISSION = 'PERMISSION',
  NOT_FOUND = 'NOT_FOUND',
  EXTERNAL_API = 'EXTERNAL_API',
  SYSTEM = 'SYSTEM',
  USER_INPUT = 'USER_INPUT'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface ErrorContext {
  userId?: string;
  showId?: string;
  setlistId?: string;
  action?: string;
  component?: string;
  timestamp?: string;
  userAgent?: string;
  url?: string;
  jobName?: string;
  attempt?: number;
  maxRetries?: number;
  api?: string;
  additionalData?: Record<string, any>;
}

export interface AppError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  originalError?: Error;
  context: ErrorContext;
  retryable: boolean;
  timestamp: string;
  stack?: string;
}

export interface ErrorRecoveryStrategy {
  shouldRetry: boolean;
  maxRetries: number;
  retryDelayMs: number;
  fallbackAction?: () => Promise<any>;
  userMessage: string;
  canRecover: boolean;
}

class ErrorHandlingService {
  private errorLog: AppError[] = [];
  private maxLogSize = 1000;
  private retryAttempts = new Map<string, number>();

  /**
   * Create a standardized application error
   */
  createError(
    type: ErrorType,
    message: string,
    context: ErrorContext = {},
    originalError?: Error,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
  ): AppError {
    const errorId = this.generateErrorId();
    
    const appError: AppError = {
      id: errorId,
      type,
      severity,
      message,
      originalError,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
        url: typeof window !== 'undefined' ? window.location.href : 'server'
      },
      retryable: this.isRetryable(type),
      timestamp: new Date().toISOString(),
      stack: originalError?.stack || new Error().stack
    };

    this.logError(appError);
    return appError;
  }

  /**
   * Handle errors with recovery strategies
   */
  async handleError(error: AppError): Promise<ErrorRecoveryStrategy> {
    const strategy = this.getRecoveryStrategy(error);
    
    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorService(error);
    }

    // Handle critical errors immediately
    if (error.severity === ErrorSeverity.CRITICAL) {
      this.handleCriticalError(error);
    }

    return strategy;
  }

  /**
   * Wrap async functions with error handling
   */
  wrapAsync<T>(
    fn: () => Promise<T>,
    context: ErrorContext,
    errorType: ErrorType = ErrorType.SYSTEM
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await fn();
        resolve(result);
      } catch (originalError) {
        const appError = this.createError(
          errorType,
          originalError instanceof Error ? originalError.message : 'Unknown error',
          context,
          originalError instanceof Error ? originalError : new Error(String(originalError))
        );
        
        const strategy = await this.handleError(appError);
        
        if (strategy.shouldRetry && this.canRetry(appError.id, strategy.maxRetries)) {
          setTimeout(() => {
            this.wrapAsync(fn, context, errorType).then(resolve).catch(reject);
          }, strategy.retryDelayMs);
        } else {
          reject(appError);
        }
      }
    });
  }

  /**
   * Get user-friendly error messages
   */
  getUserMessage(error: AppError): string {
    const strategy = this.getRecoveryStrategy(error);
    return strategy.userMessage;
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStats(): Record<string, any> {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;

    const recentErrors = this.errorLog.filter(
      error => now - new Date(error.timestamp).getTime() < oneHour
    );

    const dailyErrors = this.errorLog.filter(
      error => now - new Date(error.timestamp).getTime() < oneDay
    );

    const errorsByType = this.errorLog.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const errorsBySeverity = this.errorLog.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: this.errorLog.length,
      lastHour: recentErrors.length,
      lastDay: dailyErrors.length,
      byType: errorsByType,
      bySeverity: errorsBySeverity,
      criticalErrors: this.errorLog.filter(e => e.severity === ErrorSeverity.CRITICAL).length
    };
  }

  /**
   * Clear error log (for admin use)
   */
  clearErrorLog(): void {
    this.errorLog = [];
    this.retryAttempts.clear();
  }

  /**
   * Get recent errors for debugging
   */
  getRecentErrors(limit = 50): AppError[] {
    return this.errorLog
      .slice(-limit)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private logError(error: AppError): void {
    this.errorLog.push(error);
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Console log in development
    if (process.env.NODE_ENV === 'development') {
      console.error('App Error:', {
        id: error.id,
        type: error.type,
        severity: error.severity,
        message: error.message,
        context: error.context,
        stack: error.stack
      });
    }
  }

  private isRetryable(type: ErrorType): boolean {
    const retryableTypes = [
      ErrorType.NETWORK,
      ErrorType.DATABASE,
      ErrorType.RATE_LIMIT,
      ErrorType.EXTERNAL_API
    ];
    return retryableTypes.includes(type);
  }

  private getRecoveryStrategy(error: AppError): ErrorRecoveryStrategy {
    switch (error.type) {
      case ErrorType.NETWORK:
        return {
          shouldRetry: true,
          maxRetries: 3,
          retryDelayMs: 1000,
          userMessage: 'Connection issue. Retrying...',
          canRecover: true
        };

      case ErrorType.DATABASE:
        return {
          shouldRetry: true,
          maxRetries: 2,
          retryDelayMs: 2000,
          userMessage: 'Database temporarily unavailable. Please try again.',
          canRecover: true
        };

      case ErrorType.RATE_LIMIT:
        return {
          shouldRetry: true,
          maxRetries: 1,
          retryDelayMs: 5000,
          userMessage: 'Too many requests. Please wait a moment.',
          canRecover: true
        };

      case ErrorType.AUTHENTICATION:
        return {
          shouldRetry: false,
          maxRetries: 0,
          retryDelayMs: 0,
          userMessage: 'Please sign in to continue.',
          canRecover: false
        };

      case ErrorType.PERMISSION:
        return {
          shouldRetry: false,
          maxRetries: 0,
          retryDelayMs: 0,
          userMessage: 'You don\'t have permission to perform this action.',
          canRecover: false
        };

      case ErrorType.VALIDATION:
        return {
          shouldRetry: false,
          maxRetries: 0,
          retryDelayMs: 0,
          userMessage: 'Please check your input and try again.',
          canRecover: false
        };

      case ErrorType.NOT_FOUND:
        return {
          shouldRetry: false,
          maxRetries: 0,
          retryDelayMs: 0,
          userMessage: 'The requested item was not found.',
          canRecover: false
        };

      case ErrorType.EXTERNAL_API:
        return {
          shouldRetry: true,
          maxRetries: 2,
          retryDelayMs: 3000,
          userMessage: 'External service temporarily unavailable.',
          canRecover: true
        };

      default:
        return {
          shouldRetry: false,
          maxRetries: 0,
          retryDelayMs: 0,
          userMessage: 'An unexpected error occurred. Please try again.',
          canRecover: false
        };
    }
  }

  private canRetry(errorId: string, maxRetries: number): boolean {
    const attempts = this.retryAttempts.get(errorId) || 0;
    if (attempts >= maxRetries) {
      return false;
    }
    
    this.retryAttempts.set(errorId, attempts + 1);
    return true;
  }

  private async sendToErrorService(error: AppError): Promise<void> {
    try {
      // In a real app, send to external error tracking service
      // e.g., Sentry, LogRocket, Bugsnag, etc.
      
      // For now, just log to server endpoint
      if (typeof fetch !== 'undefined') {
        await fetch('/api/errors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(error)
        }).catch(() => {
          // Silently fail - don't throw errors from error handling
        });
      }
    } catch {
      // Silently fail - error tracking shouldn't break the app
    }
  }

  private handleCriticalError(error: AppError): void {
    // Handle critical errors that might require immediate attention
    console.error('CRITICAL ERROR:', error);
    
    // In production, this might trigger alerts, notifications, etc.
    if (process.env.NODE_ENV === 'production') {
      // Alert system administrators
      // Send to monitoring services
      // Possibly trigger graceful degradation
    }
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandlingService();

/**
 * Utility functions for common error scenarios
 */

export function handleApiError(
  error: any,
  context: ErrorContext,
  fallbackMessage = 'API request failed'
): AppError {
  if (error?.status === 401) {
    return errorHandler.createError(
      ErrorType.AUTHENTICATION,
      'Authentication required',
      context,
      error,
      ErrorSeverity.MEDIUM
    );
  }
  
  if (error?.status === 403) {
    return errorHandler.createError(
      ErrorType.PERMISSION,
      'Permission denied',
      context,
      error,
      ErrorSeverity.MEDIUM
    );
  }
  
  if (error?.status === 404) {
    return errorHandler.createError(
      ErrorType.NOT_FOUND,
      'Resource not found',
      context,
      error,
      ErrorSeverity.LOW
    );
  }
  
  if (error?.status === 429) {
    return errorHandler.createError(
      ErrorType.RATE_LIMIT,
      'Rate limit exceeded',
      context,
      error,
      ErrorSeverity.MEDIUM
    );
  }
  
  if (error?.status >= 500) {
    return errorHandler.createError(
      ErrorType.DATABASE,
      'Server error',
      context,
      error,
      ErrorSeverity.HIGH
    );
  }
  
  return errorHandler.createError(
    ErrorType.NETWORK,
    fallbackMessage,
    context,
    error,
    ErrorSeverity.MEDIUM
  );
}

export function handleVotingError(
  error: any,
  context: ErrorContext
): AppError {
  // Specific handling for voting-related errors
  return errorHandler.createError(
    ErrorType.VALIDATION,
    'Voting error: ' + (error?.message || 'Failed to submit vote'),
    { ...context, action: 'vote' },
    error,
    ErrorSeverity.MEDIUM
  );
}

export function handleDatabaseError(
  error: any,
  context: ErrorContext
): AppError {
  return errorHandler.createError(
    ErrorType.DATABASE,
    'Database operation failed',
    context,
    error,
    ErrorSeverity.HIGH
  );
}

export function handleExternalApiError(
  error: any,
  context: ErrorContext,
  apiName: string
): AppError {
  return errorHandler.createError(
    ErrorType.EXTERNAL_API,
    `${apiName} API error: ${error?.message || 'Request failed'}`,
    { ...context, api: apiName },
    error,
    ErrorSeverity.MEDIUM
  );
}

// React error boundary helper
export function createErrorBoundaryHandler(componentName: string) {
  return (error: Error, errorInfo: any) => {
    const appError = errorHandler.createError(
      ErrorType.SYSTEM,
      `React component error in ${componentName}`,
      {
        component: componentName,
        additionalData: errorInfo
      },
      error,
      ErrorSeverity.HIGH
    );
    
    errorHandler.handleError(appError);
  };
}

export default errorHandler;
