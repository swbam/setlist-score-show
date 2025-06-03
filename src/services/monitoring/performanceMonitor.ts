export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface PerformanceReport {
  metrics: PerformanceMetric[];
  summary: {
    avgResponseTime: number;
    errorRate: number;
    activeUsers: number;
    voteRate: number;
  };
  timestamp: Date;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000;
  private reportInterval = 60000; // 1 minute
  private reportTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Start reporting in production
    if (process.env.NODE_ENV === 'production') {
      this.startReporting();
    }
  }

  // Track a metric
  trackMetric(name: string, value: number, unit: string = 'ms', tags?: Record<string, string>) {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      tags
    };

    this.metrics.push(metric);
    
    // Keep metrics list bounded
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${value}${unit}`, tags);
    }
  }

  // Track API call duration
  async trackApiCall<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    let success = true;

    try {
      const result = await fn();
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = performance.now() - start;
      this.trackMetric(`api.${name}`, duration, 'ms', { success: String(success) });
    }
  }

  // Track component render
  trackComponentRender(componentName: string, duration: number) {
    this.trackMetric(`component.${componentName}.render`, duration, 'ms');
  }

  // Track vote operation
  trackVote(showId: string, duration: number, success: boolean) {
    this.trackMetric('vote.cast', duration, 'ms', {
      showId,
      success: String(success)
    });
  }

  // Track realtime connection
  trackRealtimeConnection(connected: boolean, latency?: number) {
    this.trackMetric('realtime.connection', connected ? 1 : 0, 'boolean');
    if (latency !== undefined) {
      this.trackMetric('realtime.latency', latency, 'ms');
    }
  }

  // Get current metrics summary
  getSummary(): PerformanceReport['summary'] {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    const recentMetrics = this.metrics.filter(m => 
      m.timestamp.getTime() > oneMinuteAgo
    );

    // Calculate average response time
    const apiMetrics = recentMetrics.filter(m => m.name.startsWith('api.'));
    const avgResponseTime = apiMetrics.length > 0
      ? apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length
      : 0;

    // Calculate error rate
    const totalApiCalls = apiMetrics.length;
    const failedApiCalls = apiMetrics.filter(m => m.tags?.success === 'false').length;
    const errorRate = totalApiCalls > 0 ? failedApiCalls / totalApiCalls : 0;

    // Count active users (simplified - in production, track unique user IDs)
    const activeUsers = new Set(
      recentMetrics
        .filter(m => m.name.startsWith('vote.'))
        .map(m => m.tags?.userId || 'anonymous')
    ).size;

    // Calculate vote rate (votes per minute)
    const voteMetrics = recentMetrics.filter(m => m.name === 'vote.cast');
    const voteRate = voteMetrics.length;

    return {
      avgResponseTime,
      errorRate,
      activeUsers,
      voteRate
    };
  }

  // Generate performance report
  generateReport(): PerformanceReport {
    return {
      metrics: [...this.metrics],
      summary: this.getSummary(),
      timestamp: new Date()
    };
  }

  // Start automatic reporting
  private startReporting() {
    this.reportTimer = setInterval(() => {
      const report = this.generateReport();
      this.sendReport(report);
    }, this.reportInterval);
  }

  // Send report to monitoring service
  private async sendReport(report: PerformanceReport) {
    try {
      // In production, send to monitoring service
      console.log('[Performance] Report generated:', report.summary);
      
      // Clear old metrics after reporting
      const cutoffTime = Date.now() - 300000; // Keep 5 minutes
      this.metrics = this.metrics.filter(m => 
        m.timestamp.getTime() > cutoffTime
      );
    } catch (error) {
      console.error('[Performance] Failed to send report:', error);
    }
  }

  // Stop reporting
  stopReporting() {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
      this.reportTimer = null;
    }
  }

  // Performance marks for React components
  markStart(label: string) {
    performance.mark(`${label}-start`);
  }

  markEnd(label: string) {
    performance.mark(`${label}-end`);
    try {
      performance.measure(label, `${label}-start`, `${label}-end`);
      const measure = performance.getEntriesByName(label)[0];
      if (measure) {
        this.trackMetric(`measure.${label}`, measure.duration, 'ms');
      }
    } catch (error) {
      console.error('[Performance] Measurement error:', error);
    }
  }

  // Clear all metrics
  clearMetrics() {
    this.metrics = [];
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export convenience functions
export function trackMetric(name: string, value: number, unit?: string, tags?: Record<string, string>) {
  performanceMonitor.trackMetric(name, value, unit, tags);
}

export function trackApiCall<T>(name: string, fn: () => Promise<T>): Promise<T> {
  return performanceMonitor.trackApiCall(name, fn);
}