import { supabase } from '@/integrations/supabase/client';

interface PerformanceMetric {
  metric_name: string;
  value: number;
  timestamp: string;
  context?: Record<string, any>;
}

interface ErrorReport {
  error_type: string;
  error_message: string;
  stack_trace?: string;
  user_agent?: string;
  url?: string;
  timestamp: string;
  context?: Record<string, any>;
}

class PerformanceMonitor {
  private metricsBuffer: PerformanceMetric[] = [];
  private errorsBuffer: ErrorReport[] = [];
  private flushInterval: number = 30000; // 30 seconds
  private maxBufferSize: number = 100;

  constructor() {
    this.startPerformanceObserver();
    this.startFlushTimer();
    this.setupErrorTracking();
  }

  /**
   * Track custom performance metrics
   */
  trackMetric(name: string, value: number, context?: Record<string, any>) {
    const metric: PerformanceMetric = {
      metric_name: name,
      value,
      timestamp: new Date().toISOString(),
      context
    };

    this.metricsBuffer.push(metric);
    console.log(`📊 Performance metric: ${name} = ${value}`, context);

    if (this.metricsBuffer.length >= this.maxBufferSize) {
      this.flushMetrics();
    }
  }

  /**
   * Track page load performance
   */
  trackPageLoad(pageName: string) {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        this.trackMetric('page_load_time', navigation.loadEventEnd - navigation.fetchStart, {
          page: pageName,
          dom_content_loaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          first_byte: navigation.responseStart - navigation.fetchStart
        });
      }
    }
  }

  /**
   * Track API call performance
   */
  async trackApiCall<T>(
    name: string, 
    apiCall: () => Promise<T>, 
    context?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const duration = performance.now() - startTime;
      
      this.trackMetric('api_call_duration', duration, {
        api_name: name,
        success: true,
        ...context
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.trackMetric('api_call_duration', duration, {
        api_name: name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        ...context
      });
      
      this.trackError('api_call_error', error instanceof Error ? error.message : 'Unknown API error', {
        api_name: name,
        duration,
        ...context
      });
      
      throw error;
    }
  }

  /**
   * Track user interactions
   */
  trackUserInteraction(action: string, context?: Record<string, any>) {
    this.trackMetric('user_interaction', 1, {
      action,
      timestamp: new Date().toISOString(),
      ...context
    });
  }

  /**
   * Track errors
   */
  trackError(type: string, message: string, context?: Record<string, any>) {
    const error: ErrorReport = {
      error_type: type,
      error_message: message,
      timestamp: new Date().toISOString(),
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      context
    };

    this.errorsBuffer.push(error);
    console.error(`🚨 Error tracked: ${type} - ${message}`, context);

    if (this.errorsBuffer.length >= this.maxBufferSize) {
      this.flushErrors();
    }
  }

  /**
   * Track voting performance
   */
  trackVotingMetrics(action: string, duration: number, success: boolean, context?: Record<string, any>) {
    this.trackMetric('voting_action_duration', duration, {
      action,
      success,
      ...context
    });

    if (success) {
      this.trackMetric('successful_votes', 1, context);
    } else {
      this.trackMetric('failed_votes', 1, context);
    }
  }

  /**
   * Track real-time connection quality
   */
  trackRealtimeConnection(status: string, latency?: number) {
    this.trackMetric('realtime_connection_status', status === 'connected' ? 1 : 0, {
      status,
      latency
    });

    if (latency) {
      this.trackMetric('realtime_latency', latency, { status });
    }
  }

  /**
   * Start performance observer for Core Web Vitals
   */
  private startPerformanceObserver() {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.trackMetric('largest_contentful_paint', lastEntry.startTime);
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry: any) => {
            this.trackMetric('first_input_delay', entry.processingStart - entry.startTime);
          });
        });
        fidObserver.observe({ type: 'first-input', buffered: true });

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.trackMetric('cumulative_layout_shift', clsValue);
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
      } catch (error) {
        console.warn('Performance Observer not fully supported:', error);
      }
    }
  }

  /**
   * Setup global error tracking
   */
  private setupErrorTracking() {
    if (typeof window === 'undefined') return;

    // Track unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackError('javascript_error', event.message, {
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack
      });
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError('unhandled_promise_rejection', event.reason?.toString() || 'Unknown promise rejection', {
        stack: event.reason?.stack
      });
    });
  }

  /**
   * Start periodic flushing of metrics
   */
  private startFlushTimer() {
    setInterval(() => {
      this.flushMetrics();
      this.flushErrors();
    }, this.flushInterval);
  }

  /**
   * Flush metrics to database
   */
  private async flushMetrics() {
    if (this.metricsBuffer.length === 0) return;

    try {
      const metrics = [...this.metricsBuffer];
      this.metricsBuffer = [];

      // In a real implementation, you would send this to a logging service
      // For now, we'll log to console and store in localStorage for debugging
      console.log('📊 Flushing performance metrics:', metrics);
      
      if (typeof localStorage !== 'undefined') {
        const existing = localStorage.getItem('performance_metrics') || '[]';
        const existingMetrics = JSON.parse(existing);
        existingMetrics.push(...metrics);
        
        // Keep only last 1000 metrics
        if (existingMetrics.length > 1000) {
          existingMetrics.splice(0, existingMetrics.length - 1000);
        }
        
        localStorage.setItem('performance_metrics', JSON.stringify(existingMetrics));
      }
    } catch (error) {
      console.error('Error flushing metrics:', error);
    }
  }

  /**
   * Flush errors to database
   */
  private async flushErrors() {
    if (this.errorsBuffer.length === 0) return;

    try {
      const errors = [...this.errorsBuffer];
      this.errorsBuffer = [];

      // In a real implementation, you would send this to an error tracking service
      console.error('🚨 Flushing error reports:', errors);
      
      if (typeof localStorage !== 'undefined') {
        const existing = localStorage.getItem('error_reports') || '[]';
        const existingErrors = JSON.parse(existing);
        existingErrors.push(...errors);
        
        // Keep only last 100 errors
        if (existingErrors.length > 100) {
          existingErrors.splice(0, existingErrors.length - 100);
        }
        
        localStorage.setItem('error_reports', JSON.stringify(existingErrors));
      }
    } catch (error) {
      console.error('Error flushing error reports:', error);
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): Record<string, any> {
    if (typeof localStorage === 'undefined') return {};

    try {
      const metrics = JSON.parse(localStorage.getItem('performance_metrics') || '[]');
      const errors = JSON.parse(localStorage.getItem('error_reports') || '[]');

      const summary = {
        total_metrics: metrics.length,
        total_errors: errors.length,
        recent_metrics: metrics.slice(-10),
        recent_errors: errors.slice(-5)
      };

      return summary;
    } catch (error) {
      console.error('Error getting performance summary:', error);
      return {};
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();
