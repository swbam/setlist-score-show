// Enhanced Error Handling and Monitoring Service
import { supabase } from '@/integrations/supabase/client';

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  API_ERROR = 'API_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  stack?: string;
}

export interface ErrorReport {
  id: string;
  error: AppError;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: {
    component?: string;
    action?: string;
    metadata?: Record<string, unknown>;
  };
}

class ErrorHandlingService {
  private errorQueue: ErrorReport[] = [];
  private isProcessingQueue = false;
  private sessionId = this.generateSessionId();
  
  constructor() {
    // Process error queue periodically
    setInterval(() => this.processErrorQueue(), 5000);
    
    // Set up global error handlers
    this.setupGlobalErrorHandlers();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(
        new Error(event.reason?.message || 'Unhandled promise rejection'),
        {
          code: ErrorCode.UNKNOWN_ERROR,
          context: { type: 'unhandledrejection', reason: event.reason }
        }
      );
    });

    // Handle uncaught JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError(event.error, {
        code: ErrorCode.UNKNOWN_ERROR,
        context: { 
          type: 'uncaughtError',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });
  }

  handleError(
    error: Error | unknown,
    options: {
      code?: ErrorCode;
      severity?: 'low' | 'medium' | 'high' | 'critical';
      context?: {
        component?: string;
        action?: string;
        metadata?: Record<string, unknown>;
      };
    } = {}
  ): AppError {
    const appError = this.createAppError(error, options.code);
    
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      error: appError,
      severity: options.severity || this.determineSeverity(appError),
      context: options.context
    };

    // Add to queue for processing
    this.errorQueue.push(errorReport);

    // Log to console for development
    if (process.env.NODE_ENV === 'development') {
      console.error('App Error:', errorReport);
    }

    // Send critical errors immediately
    if (errorReport.severity === 'critical') {
      this.sendErrorReport(errorReport);
    }

    return appError;
  }

  private createAppError(error: Error | unknown, code?: ErrorCode): AppError {
    const now = new Date();
    
    if (error instanceof Error) {
      return {
        code: code || this.classifyError(error),
        message: error.message,
        timestamp: now,
        stack: error.stack,
        userId: this.getCurrentUserId(),
        sessionId: this.sessionId,
        url: window.location.href,
        userAgent: navigator.userAgent
      };
    }

    return {
      code: code || ErrorCode.UNKNOWN_ERROR,
      message: typeof error === 'string' ? error : 'Unknown error occurred',
      details: { originalError: error },
      timestamp: now,
      userId: this.getCurrentUserId(),
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent
    };
  }

  private classifyError(error: Error): ErrorCode {
    const message = error.message.toLowerCase();
    
    if (message.includes('rate limit') || message.includes('429')) {
      return ErrorCode.RATE_LIMIT_ERROR;
    }
    
    if (message.includes('network') || message.includes('fetch')) {
      return ErrorCode.NETWORK_ERROR;
    }
    
    if (message.includes('unauthorized') || message.includes('auth')) {
      return ErrorCode.AUTHENTICATION_ERROR;
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorCode.VALIDATION_ERROR;
    }
    
    if (message.includes('database') || message.includes('sql')) {
      return ErrorCode.DATABASE_ERROR;
    }
    
    return ErrorCode.API_ERROR;
  }

  private determineSeverity(error: AppError): 'low' | 'medium' | 'high' | 'critical' {
    switch (error.code) {
      case ErrorCode.AUTHENTICATION_ERROR:
        return 'high';
      case ErrorCode.DATABASE_ERROR:
        return 'critical';
      case ErrorCode.RATE_LIMIT_ERROR:
        return 'medium';
      case ErrorCode.NETWORK_ERROR:
        return 'medium';
      case ErrorCode.VALIDATION_ERROR:
        return 'low';
      default:
        return 'medium';
    }
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentUserId(): string | undefined {
    // Try to get current user from Supabase
    try {
      // This is async but we'll handle it in the queue processing
      return undefined; // Will be filled in during queue processing
    } catch {
      return undefined;
    }
  }

  private async processErrorQueue(): Promise<void> {
    if (this.isProcessingQueue || this.errorQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      // Process errors in batches
      const batch = this.errorQueue.splice(0, 10);
      
      for (const errorReport of batch) {
        // Fill in user ID if not already present
        if (!errorReport.error.userId) {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            errorReport.error.userId = user?.id;
          } catch {
            // Ignore auth errors during error reporting
          }
        }

        await this.sendErrorReport(errorReport);
      }
    } catch (error) {
      console.error('Failed to process error queue:', error);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private async sendErrorReport(errorReport: ErrorReport): Promise<void> {
    try {
      // For now, just log to console since we don't have error_logs table
      console.error('Error Report:', {
        id: errorReport.id,
        code: errorReport.error.code,
        message: errorReport.error.message,
        severity: errorReport.severity,
        timestamp: errorReport.error.timestamp,
        context: errorReport.context
      });

      // Send to external monitoring service (e.g., Sentry) if configured
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(new Error(errorReport.error.message), {
          tags: {
            errorCode: errorReport.error.code,
            severity: errorReport.severity
          },
          extra: {
            ...errorReport.error.details,
            context: errorReport.context
          }
        });
      }

    } catch (error) {
      console.error('Failed to send error report:', error);
    }
  }

  // Public method to manually report errors
  reportError(
    error: Error | string,
    options: {
      severity?: 'low' | 'medium' | 'high' | 'critical';
      component?: string;
      action?: string;
      metadata?: Record<string, unknown>;
    } = {}
  ): void {
    this.handleError(error instanceof Error ? error : new Error(error), {
      severity: options.severity,
      context: {
        component: options.component,
        action: options.action,
        metadata: options.metadata
      }
    });
  }

  // Clear the error queue (for testing)
  clearQueue(): void {
    this.errorQueue = [];
  }
}

// Global error handler instance
export const errorHandler = new ErrorHandlingService();

// Convenience functions for common error scenarios
export const handleApiError = (error: unknown, context?: string) => {
  return errorHandler.handleError(error, {
    code: ErrorCode.API_ERROR,
    context: { component: context || 'API' }
  });
};

export const handleDatabaseError = (error: unknown, context?: string) => {
  return errorHandler.handleError(error, {
    code: ErrorCode.DATABASE_ERROR,
    severity: 'high',
    context: { component: context || 'Database' }
  });
};

export const handleValidationError = (error: unknown, context?: string) => {
  return errorHandler.handleError(error, {
    code: ErrorCode.VALIDATION_ERROR,
    severity: 'low',
    context: { component: context || 'Validation' }
  });
};

export const handleAuthError = (error: unknown, context?: string) => {
  return errorHandler.handleError(error, {
    code: ErrorCode.AUTHENTICATION_ERROR,
    severity: 'high',
    context: { component: context || 'Authentication' }
  });
};