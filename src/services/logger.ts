interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: string;
  data?: any;
  userId?: string;
  sessionId?: string;
}

interface LoggerConfig {
  enableConsole: boolean;
  enableRemote: boolean;
  maxLocalLogs: number;
  remoteEndpoint?: string;
  minLevel: 'debug' | 'info' | 'warn' | 'error';
}

class Logger {
  private config: LoggerConfig;
  private logs: LogEntry[] = [];
  private sessionId: string;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      enableConsole: true,
      enableRemote: process.env.NODE_ENV === 'production',
      maxLocalLogs: 1000,
      minLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      ...config
    };

    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldLog(level: LogEntry['level']): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.config.minLevel);
  }

  private createLogEntry(
    level: LogEntry['level'],
    message: string,
    context?: string,
    data?: any,
    userId?: string
  ): LogEntry {
    return {
      timestamp: new Date(),
      level,
      message,
      context,
      data,
      userId,
      sessionId: this.sessionId
    };
  }

  private addToLocalStorage(entry: LogEntry): void {
    this.logs.push(entry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.config.maxLocalLogs) {
      this.logs = this.logs.slice(-this.config.maxLocalLogs);
    }
  }

  private logToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return;

    const timestamp = entry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]`;
    const message = entry.context ? `${prefix} [${entry.context}] ${entry.message}` : `${prefix} ${entry.message}`;

    switch (entry.level) {
      case 'debug':
        console.debug(message, entry.data || '');
        break;
      case 'info':
        console.info(message, entry.data || '');
        break;
      case 'warn':
        console.warn(message, entry.data || '');
        break;
      case 'error':
        console.error(message, entry.data || '');
        break;
    }
  }

  private async sendToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.enableRemote || !this.config.remoteEndpoint) return;

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      // Fallback to console if remote logging fails
      console.warn('Failed to send log to remote endpoint:', error);
    }
  }

  private log(
    level: LogEntry['level'],
    message: string,
    context?: string,
    data?: any,
    userId?: string
  ): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, context, data, userId);
    
    this.addToLocalStorage(entry);
    this.logToConsole(entry);
    
    if (this.config.enableRemote) {
      this.sendToRemote(entry).catch(() => {
        // Silent fail for remote logging
      });
    }
  }

  // Public logging methods
  debug(message: string, context?: string, data?: any, userId?: string): void {
    this.log('debug', message, context, data, userId);
  }

  info(message: string, context?: string, data?: any, userId?: string): void {
    this.log('info', message, context, data, userId);
  }

  warn(message: string, context?: string, data?: any, userId?: string): void {
    this.log('warn', message, context, data, userId);
  }

  error(message: string, context?: string, data?: any, userId?: string): void {
    this.log('error', message, context, data, userId);
  }

  // Performance logging
  time(label: string): void {
    this.debug(`Timer started: ${label}`, 'performance', { action: 'start', label });
  }

  timeEnd(label: string): void {
    this.debug(`Timer ended: ${label}`, 'performance', { action: 'end', label });
  }

  // User action logging
  userAction(action: string, details?: any, userId?: string): void {
    this.info(`User action: ${action}`, 'user-action', details, userId);
  }

  // API call logging
  apiCall(method: string, url: string, duration?: number, status?: number, error?: any): void {
    const level = error ? 'error' : status && status >= 400 ? 'warn' : 'info';
    const message = `API ${method} ${url}`;
    const data = { method, url, duration, status, error };
    
    this.log(level, message, 'api', data);
  }

  // Database operation logging
  dbOperation(operation: string, table: string, duration?: number, error?: any): void {
    const level = error ? 'error' : 'info';
    const message = `DB ${operation} on ${table}`;
    const data = { operation, table, duration, error };
    
    this.log(level, message, 'database', data);
  }

  // Real-time connection logging
  realtimeEvent(event: string, data?: any): void {
    this.info(`Realtime: ${event}`, 'realtime', data);
  }

  // Voting system logging
  votingAction(action: string, songId?: string, showId?: string, userId?: string, data?: any): void {
    const message = `Voting: ${action}`;
    const logData = { action, songId, showId, ...data };
    
    this.info(message, 'voting', logData, userId);
  }

  // Search logging
  searchAction(query: string, type: string, results?: number, duration?: number, userId?: string): void {
    const message = `Search: ${type} query "${query}"`;
    const data = { query, type, results, duration };
    
    this.info(message, 'search', data, userId);
  }

  // Get logs for debugging
  getLogs(filter?: { level?: LogEntry['level']; context?: string; limit?: number }): LogEntry[] {
    let filteredLogs = this.logs;

    if (filter?.level) {
      filteredLogs = filteredLogs.filter(log => log.level === filter.level);
    }

    if (filter?.context) {
      filteredLogs = filteredLogs.filter(log => log.context === filter.context);
    }

    if (filter?.limit) {
      filteredLogs = filteredLogs.slice(-filter.limit);
    }

    return filteredLogs;
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
  }

  // Export logs for debugging
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Get session info
  getSessionInfo(): { sessionId: string; logCount: number; config: LoggerConfig } {
    return {
      sessionId: this.sessionId,
      logCount: this.logs.length,
      config: this.config
    };
  }
}

// Create singleton instance
const logger = new Logger({
  remoteEndpoint: '/api/logs' // Will be implemented if needed
});

// Export both the class and the instance
export { Logger };
export default logger;
