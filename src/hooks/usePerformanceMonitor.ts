
import { useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  loadTime: number;
  apiCalls: number;
  errors: number;
}

export function usePerformanceMonitor(componentName: string) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    loadTime: 0,
    apiCalls: 0,
    errors: 0
  });
  
  const renderStartTime = useRef<number>(0);
  const loadStartTime = useRef<number>(0);
  const apiCallCount = useRef<number>(0);
  const errorCount = useRef<number>(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
    loadStartTime.current = performance.now();

    return () => {
      const renderTime = performance.now() - renderStartTime.current;
      const loadTime = performance.now() - loadStartTime.current;
      
      setMetrics({
        renderTime,
        loadTime,
        apiCalls: apiCallCount.current,
        errors: errorCount.current
      });

      // Log performance metrics in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Performance metrics for ${componentName}:`, {
          renderTime: `${renderTime.toFixed(2)}ms`,
          loadTime: `${loadTime.toFixed(2)}ms`,
          apiCalls: apiCallCount.current,
          errors: errorCount.current
        });

        // Warn about slow components
        if (renderTime > 100) {
          console.warn(`⚠️ Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
        }
      }
    };
  }, [componentName]);

  const trackApiCall = () => {
    apiCallCount.current += 1;
  };

  const trackError = () => {
    errorCount.current += 1;
  };

  const markLoadComplete = () => {
    const loadTime = performance.now() - loadStartTime.current;
    setMetrics(prev => ({ ...prev, loadTime }));
  };

  return {
    metrics,
    trackApiCall,
    trackError,
    markLoadComplete
  };
}

// Hook for tracking page-level performance
export function usePagePerformance(pageName: string) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const performanceMonitor = usePerformanceMonitor(pageName);

  const startLoading = () => {
    setIsLoading(true);
    setLoadError(null);
  };

  const finishLoading = () => {
    setIsLoading(false);
    performanceMonitor.markLoadComplete();
  };

  const handleError = (error: string) => {
    setLoadError(error);
    setIsLoading(false);
    performanceMonitor.trackError();
  };

  return {
    isLoading,
    loadError,
    startLoading,
    finishLoading,
    handleError,
    trackApiCall: performanceMonitor.trackApiCall,
    metrics: performanceMonitor.metrics
  };
}

// Hook for optimizing expensive operations
export function useThrottledFunction<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  const lastExecution = useRef<number>(0);
  
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastExecution.current >= delay) {
      lastExecution.current = now;
      return fn(...args);
    }
  }) as T;
}

// Hook for detecting performance issues
export function usePerformanceAlert() {
  useEffect(() => {
    // Monitor for long tasks
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          console.warn(`⚠️ Long task detected: ${entry.duration.toFixed(2)}ms`);
        }
      }
    });

    observer.observe({ entryTypes: ['longtask'] });

    // Monitor memory usage if available
    if ('memory' in performance) {
      const checkMemory = () => {
        const memory = (performance as any).memory;
        const usage = memory.usedJSHeapSize / memory.totalJSHeapSize;
        
        if (usage > 0.9) {
          console.warn(`⚠️ High memory usage detected: ${(usage * 100).toFixed(2)}%`);
        }
      };

      const memoryInterval = setInterval(checkMemory, 30000); // Check every 30 seconds

      return () => {
        observer.disconnect();
        clearInterval(memoryInterval);
      };
    }

    return () => {
      observer.disconnect();
    };
  }, []);
}
