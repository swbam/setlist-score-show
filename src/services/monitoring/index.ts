import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  databaseQueryTime: number;
  realtimeLatency: number;
}

export class ProductionMonitoring {
  private metrics: Map<string, number[]> = new Map();
  
  initialize() {
    // Initialize Sentry
    if (import.meta.env.VITE_SENTRY_DSN) {
      Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.MODE,
        integrations: [
          new BrowserTracing(),
          new Sentry.Replay({
            maskAllText: false,
            blockAllMedia: false,
          }),
        ],
        tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        beforeSend(event, hint) {
          // Filter out known non-critical errors
          if (event.exception?.values?.[0]?.type === 'NetworkError') {
            return null;
          }
          return event;
        }
      });
    }
    
    // Set up performance monitoring
    this.setupPerformanceObserver();
    
    // Monitor real-time connection health
    this.monitorRealtimeConnections();
    
    // Set up custom metrics collection
    this.setupMetricsCollection();
  }
  
  private setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      // Monitor navigation timing
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric('page_load_time', navEntry.loadEventEnd - navEntry.fetchStart);
            
            // Send to Sentry
            Sentry.addBreadcrumb({
              category: 'performance',
              message: 'Page load completed',
              level: 'info',
              data: {
                duration: navEntry.loadEventEnd - navEntry.fetchStart,
                domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.fetchStart
              }
            });
          }
        }
      });
      
      navigationObserver.observe({ entryTypes: ['navigation'] });
      
      // Monitor resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name.includes('/api/') || entry.name.includes('supabase')) {
            this.recordMetric('api_response_time', entry.duration);
            
            // Alert on slow API calls
            if (entry.duration > 3000) {
              console.warn(`Slow API call detected: ${entry.name} took ${entry.duration}ms`);
              Sentry.captureMessage(`Slow API call: ${entry.name}`, 'warning');
            }
          }
        }
      });
      
      resourceObserver.observe({ entryTypes: ['resource'] });
    }
  }
  
  private monitorRealtimeConnections() {
    let activeConnections = 0;
    const maxConnections = 50;
    
    // Override Supabase channel creation to monitor connections
    const originalChannel = window.supabase?.channel;
    if (originalChannel) {
      window.supabase.channel = function(...args: any[]) {
        activeConnections++;
        
        if (activeConnections > maxConnections) {
          console.error(`Too many real-time connections: ${activeConnections}`);
          Sentry.captureException(new Error(`Real-time connection limit exceeded: ${activeConnections}`));
        }
        
        const channel = originalChannel.apply(this, args);
        
        // Monitor unsubscribe
        const originalUnsubscribe = channel.unsubscribe;
        channel.unsubscribe = async function() {
          activeConnections--;
          return originalUnsubscribe.apply(this);
        };
        
        return channel;
      };
    }
    
    // Report connection count periodically
    setInterval(() => {
      this.recordMetric('realtime_connections', activeConnections);
      
      if (activeConnections > 0) {
        console.log(`Active real-time connections: ${activeConnections}`);
      }
    }, 30000); // Every 30 seconds
  }
  
  private setupMetricsCollection() {
    // Collect and report metrics every minute
    setInterval(() => {
      const report = this.getMetricsReport();
      
      // Send to monitoring service
      if (import.meta.env.VITE_MONITORING_ENDPOINT) {
        fetch(import.meta.env.VITE_MONITORING_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            metrics: report
          })
        }).catch(error => {
          console.error('Failed to send metrics:', error);
        });
      }
      
      // Log locally in development
      if (import.meta.env.DEV) {
        console.log('Metrics Report:', report);
      }
    }, 60000); // Every minute
  }
  
  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 100 values
    if (values.length > 100) {
      values.shift();
    }
  }
  
  getMetricsReport() {
    const report: Record<string, any> = {};
    
    for (const [name, values] of this.metrics.entries()) {
      if (values.length === 0) continue;
      
      const sorted = [...values].sort((a, b) => a - b);
      report[name] = {
        count: values.length,
        mean: values.reduce((a, b) => a + b, 0) / values.length,
        median: sorted[Math.floor(sorted.length / 2)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)],
        min: sorted[0],
        max: sorted[sorted.length - 1]
      };
    }
    
    return report;
  }
  
  // Track user actions
  trackEvent(eventName: string, properties?: Record<string, any>) {
    Sentry.addBreadcrumb({
      category: 'user-action',
      message: eventName,
      level: 'info',
      data: properties
    });
    
    // Also send to analytics if configured
    if (window.gtag) {
      window.gtag('event', eventName, properties);
    }
  }
  
  // Track API errors
  trackApiError(endpoint: string, error: any, context?: Record<string, any>) {
    Sentry.captureException(error, {
      tags: {
        api_endpoint: endpoint
      },
      extra: context
    });
    
    this.recordMetric('api_errors', 1);
  }
  
  // Track vote metrics
  trackVote(showId: string, success: boolean, remainingVotes?: { daily: number; perShow: number }) {
    this.trackEvent('vote_submitted', {
      show_id: showId,
      success,
      remaining_daily: remainingVotes?.daily,
      remaining_show: remainingVotes?.perShow
    });
    
    if (!success) {
      this.recordMetric('vote_failures', 1);
    }
  }
  
  // Performance transaction wrapper
  async trackPerformance<T>(
    name: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const transaction = Sentry.startTransaction({ name });
    const startTime = performance.now();
    
    try {
      const result = await operation();
      transaction.setStatus('ok');
      return result;
    } catch (error) {
      transaction.setStatus('internal_error');
      throw error;
    } finally {
      transaction.finish();
      const duration = performance.now() - startTime;
      this.recordMetric(`operation_${name}`, duration);
    }
  }
}

// Export singleton instance
export const monitoring = new ProductionMonitoring();

// Initialize on app start
if (typeof window !== 'undefined') {
  monitoring.initialize();
}

// Export Sentry for error boundaries
export { ErrorBoundary } from '@sentry/react';