type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: Date;
  context?: string;
  userId?: string;
  error?: Error;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  
  private formatMessage(entry: LogEntry): string {
    const time = entry.timestamp.toISOString();
    const context = entry.context ? `[${entry.context}]` : '';
    return `${time} ${entry.level.toUpperCase()} ${context} ${entry.message}`;
  }
  
  private addLog(entry: LogEntry): void {
    this.logs.push(entry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    // In production, you could send logs to a service like Sentry or LogRocket
    if (!this.isDevelopment && (entry.level === 'error' || entry.level === 'warn')) {
      // this.sendToLoggingService(entry);
    }
  }
  
  private log(level: LogLevel, message: string, data?: unknown, context?: string): void {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date(),
      context,
    };
    
    // Add user ID if available
    if (typeof window !== 'undefined' && window.localStorage) {
      const authData = localStorage.getItem('supabase.auth.token');
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          entry.userId = parsed.currentSession?.user?.id;
        } catch {
          // Ignore parsing errors
        }
      }
    }
    
    // Add to log history
    this.addLog(entry);
    
    // Output to console in development
    if (this.isDevelopment) {
      const formattedMessage = this.formatMessage(entry);
      
      switch (level) {
        case 'debug':
          console.debug(formattedMessage, data);
          break;
        case 'info':
          console.info(formattedMessage, data);
          break;
        case 'warn':
          console.warn(formattedMessage, data);
          break;
        case 'error':
          console.error(formattedMessage, data);
          if (data instanceof Error) {
            console.error(data.stack);
          }
          break;
      }
    }
  }
  
  public debug(message: string, data?: unknown, context?: string): void {
    this.log('debug', message, data, context);
  }
  
  public info(message: string, data?: unknown, context?: string): void {
    this.log('info', message, data, context);
  }
  
  public warn(message: string, data?: unknown, context?: string): void {
    this.log('warn', message, data, context);
  }
  
  public error(message: string, error?: Error | unknown, context?: string): void {
    if (error instanceof Error) {
      this.log('error', message, { 
        message: error.message, 
        stack: error.stack,
        name: error.name 
      }, context);
    } else {
      this.log('error', message, error, context);
    }
  }
  
  public getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }
  
  public clearLogs(): void {
    this.logs = [];
  }
  
  // Track API calls
  public api(method: string, url: string, data?: unknown): void {
    this.info(`API ${method} ${url}`, data, 'API');
  }
  
  // Track user actions
  public action(action: string, data?: unknown): void {
    this.info(`User action: ${action}`, data, 'ACTION');
  }
  
  // Track performance
  public performance(metric: string, duration: number, data?: unknown): void {
    this.info(`Performance: ${metric} took ${duration}ms`, data, 'PERFORMANCE');
  }
}

// Create singleton instance
export const logger = new Logger();

// Performance tracking helper
export function trackPerformance<T>(
  name: string,
  fn: () => T | Promise<T>
): T | Promise<T> {
  const start = performance.now();
  
  try {
    const result = fn();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - start;
        logger.performance(name, duration);
      });
    }
    
    const duration = performance.now() - start;
    logger.performance(name, duration);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    logger.performance(name, duration, { error });
    throw error;
  }
}

// Error boundary logging helper
export function logErrorBoundary(error: Error, errorInfo: React.ErrorInfo): void {
  logger.error('React Error Boundary caught error', {
    error: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
  }, 'ERROR_BOUNDARY');
}