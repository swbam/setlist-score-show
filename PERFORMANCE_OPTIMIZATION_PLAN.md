# Performance Optimization Plan

## Overview
This document outlines critical performance optimizations needed for production readiness.

## Identified Performance Issues

### 1. React Component Optimizations

#### Excessive Re-renders
- **Issue**: Multiple components using `useState` and `useEffect` without proper memoization
- **Impact**: Unnecessary re-renders causing UI lag
- **Priority**: HIGH

**Components requiring optimization:**
- `VotingInterfaceEnhanced.tsx` - Heavy voting logic
- `SearchWithFilters.tsx` - Complex search state
- `TrendingShows.tsx` - Data transformation on every render
- `ProductionMonitor.tsx` - Real-time monitoring updates
- `PerformanceMonitoringDashboard.tsx` - Dashboard metrics

#### Missing React.memo and useMemo
```typescript
// BEFORE (Performance Issue)
const TrendingShows = ({ shows }) => {
  const transformedShows = shows.map(show => ({ /* transformation */ }));
  return <div>{/* render */}</div>;
};

// AFTER (Optimized)
const TrendingShows = React.memo(({ shows }) => {
  const transformedShows = useMemo(() => 
    shows.map(show => ({ /* transformation */ })), 
    [shows]
  );
  return <div>{/* render */}</div>;
});
```

### 2. Database Query Optimizations

#### N+1 Query Problems
- **Location**: `search.ts`, `userAnalytics.ts`, `enhancedTrending.ts`
- **Issue**: Multiple sequential database calls
- **Solution**: Implement batch queries and joins

```sql
-- BEFORE (N+1 Problem)
SELECT * FROM shows WHERE artist_id = ?; -- Called N times

-- AFTER (Optimized)
SELECT s.*, a.name as artist_name 
FROM shows s 
JOIN artists a ON s.artist_id = a.id 
WHERE s.artist_id IN (?, ?, ?, ...);
```

#### Missing Indexes
- **Status**: ✅ Added in `20250527063100_add_performance_indexes.sql`
- **Next**: Monitor index usage and add composite indexes

### 3. API Rate Limiting Issues

#### Excessive setTimeout Usage
- **Files**: `spotify.ts`, `catalogImport.ts`, `backgroundJobs.ts`
- **Issue**: Hardcoded delays causing slow operations
- **Solution**: Implement adaptive rate limiting

```typescript
// BEFORE (Fixed Delays)
await new Promise(resolve => setTimeout(resolve, 1000));

// AFTER (Adaptive Rate Limiting)
class RateLimiter {
  private lastRequest = 0;
  private minInterval = 100;
  
  async throttle() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    if (timeSinceLastRequest < this.minInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minInterval - timeSinceLastRequest)
      );
    }
    this.lastRequest = Date.now();
  }
}
```

### 4. Memory Leaks

#### Uncleared Intervals and Timeouts
- **Files**: `realtime.ts`, `backgroundJobs.ts`, `performanceMonitor.ts`
- **Issue**: Missing cleanup in useEffect
- **Priority**: CRITICAL

```typescript
// BEFORE (Memory Leak)
useEffect(() => {
  const interval = setInterval(updateData, 1000);
  // Missing cleanup!
}, []);

// AFTER (Proper Cleanup)
useEffect(() => {
  const interval = setInterval(updateData, 1000);
  return () => clearInterval(interval);
}, []);
```

## Implementation Plan

### Phase 1: Critical Fixes (Week 1)

#### 1.1 React Component Memoization
```bash
# Files to optimize immediately
src/components/VotingInterfaceEnhanced.tsx
src/components/TrendingShows.tsx
src/components/SearchWithFilters.tsx
src/components/ProductionMonitor.tsx
```

#### 1.2 Memory Leak Fixes
```typescript
// Template for cleanup fixes
const useCleanupEffect = (effect: () => (() => void) | void, deps: any[]) => {
  useEffect(() => {
    const cleanup = effect();
    return cleanup;
  }, deps);
};
```

#### 1.3 Database Query Batching
```typescript
// Implement batch query utility
class BatchQueryManager {
  private batchSize = 50;
  
  async batchQuery<T>(items: any[], queryFn: (batch: any[]) => Promise<T[]>): Promise<T[]> {
    const results: T[] = [];
    for (let i = 0; i < items.length; i += this.batchSize) {
      const batch = items.slice(i, i + this.batchSize);
      const batchResults = await queryFn(batch);
      results.push(...batchResults);
    }
    return results;
  }
}
```

### Phase 2: Performance Monitoring (Week 2)

#### 2.1 Add Performance Metrics
```typescript
// Performance monitoring wrapper
const withPerformanceMonitoring = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  name: string
) => {
  return async (...args: T): Promise<R> => {
    const start = performance.now();
    try {
      const result = await fn(...args);
      const duration = performance.now() - start;
      console.log(`${name} took ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`${name} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  };
};
```

#### 2.2 Bundle Size Optimization
```bash
# Analyze bundle size
npm run build -- --analyze

# Implement code splitting
# Add to vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom'],
        charts: ['recharts'],
        ui: ['@radix-ui/react-dialog', '@radix-ui/react-select']
      }
    }
  }
}
```

### Phase 3: Advanced Optimizations (Week 3)

#### 3.1 Virtual Scrolling for Large Lists
```typescript
// For components with large datasets
import { FixedSizeList as List } from 'react-window';

const VirtualizedList = ({ items }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      {/* Render item at index */}
    </div>
  );
  
  return (
    <List
      height={600}
      itemCount={items.length}
      itemSize={80}
    >
      {Row}
    </List>
  );
};
```

#### 3.2 Service Worker for Caching
```typescript
// Add to public/sw.js
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      caches.open('api-cache').then(cache => {
        return cache.match(event.request).then(response => {
          if (response) {
            // Serve from cache
            fetch(event.request).then(fetchResponse => {
              cache.put(event.request, fetchResponse.clone());
            });
            return response;
          }
          // Fetch and cache
          return fetch(event.request).then(fetchResponse => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
    );
  }
});
```

## Performance Targets

### Metrics to Achieve
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s
- **Cumulative Layout Shift**: < 0.1
- **Bundle Size**: < 500KB gzipped

### Database Performance
- **Query Response Time**: < 100ms (95th percentile)
- **Connection Pool Usage**: < 80%
- **Cache Hit Rate**: > 90%

## Monitoring and Testing

### Performance Testing Tools
```bash
# Lighthouse CI
npm install -g @lhci/cli
lhci autorun

# Bundle analyzer
npm install --save-dev webpack-bundle-analyzer
npm run build:analyze

# Performance profiling
npm install --save-dev @welldone-software/why-did-you-render
```

### Continuous Monitoring
```typescript
// Add to main.tsx
if (process.env.NODE_ENV === 'development') {
  import('@welldone-software/why-did-you-render').then(whyDidYouRender => {
    whyDidYouRender.default(React, {
      trackAllPureComponents: true,
    });
  });
}
```

## Implementation Checklist

### Immediate Actions (This Week)
- [ ] Add React.memo to heavy components
- [ ] Implement useMemo for expensive calculations
- [ ] Fix memory leaks in useEffect hooks
- [ ] Add cleanup for intervals and timeouts
- [ ] Optimize database queries with batching

### Short Term (Next 2 Weeks)
- [ ] Implement virtual scrolling for large lists
- [ ] Add service worker for API caching
- [ ] Optimize bundle size with code splitting
- [ ] Add performance monitoring
- [ ] Implement adaptive rate limiting

### Long Term (Next Month)
- [ ] Add comprehensive performance testing
- [ ] Implement advanced caching strategies
- [ ] Add real-time performance monitoring
- [ ] Optimize database indexes based on usage
- [ ] Implement CDN for static assets

## Success Metrics

### Before Optimization
- Bundle size: ~800KB
- First load: ~4-6s
- Re-render frequency: High
- Memory usage: Growing over time

### After Optimization (Target)
- Bundle size: <500KB
- First load: <2s
- Re-render frequency: Minimal
- Memory usage: Stable

## Risk Mitigation

### Rollback Plan
- Keep performance monitoring active
- Implement feature flags for new optimizations
- Maintain staging environment for testing
- Document all changes for easy rollback

### Testing Strategy
- Performance regression tests
- Load testing with realistic data
- Memory leak detection
- Cross-browser compatibility testing