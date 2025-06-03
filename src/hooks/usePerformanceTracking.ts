import { useEffect, useRef } from 'react';
import { performanceMonitor } from '@/services/monitoring/performanceMonitor';

export function usePerformanceTracking(componentName: string) {
  const renderStartRef = useRef<number>();

  useEffect(() => {
    // Track component mount
    if (renderStartRef.current) {
      const renderDuration = performance.now() - renderStartRef.current;
      performanceMonitor.trackComponentRender(componentName, renderDuration);
    }
  });

  // Mark render start
  renderStartRef.current = performance.now();

  // Return helper functions
  return {
    trackEvent: (eventName: string, duration: number) => {
      performanceMonitor.trackMetric(`${componentName}.${eventName}`, duration, 'ms');
    },
    
    trackApiCall: <T>(apiName: string, fn: () => Promise<T>) => {
      return performanceMonitor.trackApiCall(`${componentName}.${apiName}`, fn);
    },
    
    markStart: (label: string) => {
      performanceMonitor.markStart(`${componentName}.${label}`);
    },
    
    markEnd: (label: string) => {
      performanceMonitor.markEnd(`${componentName}.${label}`);
    }
  };
}