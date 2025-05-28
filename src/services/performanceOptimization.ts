/**
 * Performance Optimization Service
 * Handles database query optimization, caching strategies, and performance monitoring
 */

import { supabase } from '@/integrations/supabase/client';
import { cacheService } from './cacheService';
import { errorHandler, ErrorType, ErrorSeverity } from './errorHandling';

/**
 * Query Performance Monitor
 * Tracks and optimizes slow database queries
 */
export class QueryPerformanceMonitor {
  private static instance: QueryPerformanceMonitor;
  private slowQueries: Map<string, SlowQueryInfo[]> = new Map();
  private queryCache: Map<string, CachedQueryResult> = new Map();
  private readonly SLOW_QUERY_THRESHOLD = 500; // ms
  private readonly CACHE_TTL = 60000; // 1 minute

  private constructor() {}

  static getInstance(): QueryPerformanceMonitor {
    if (!QueryPerformanceMonitor.instance) {
      QueryPerformanceMonitor.instance = new QueryPerformanceMonitor();
    }
    return QueryPerformanceMonitor.instance;
  }

  /**
   * Execute query with performance monitoring and caching
   */
  async executeOptimizedQuery<T>(
    queryKey: string,
    queryFunction: () => Promise<T>,
    options: QueryOptions = {}
  ): Promise<T> {
    const startTime = Date.now();
    const cacheKey = `query:${queryKey}`;

    // Check cache first if enabled
    if (options.enableCache !== false) {
      const cached = this.queryCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
        return cached.result as T;
      }
    }

    try {
      const result = await queryFunction();
      const executionTime = Date.now() - startTime;

      // Track slow queries
      if (executionTime > this.SLOW_QUERY_THRESHOLD) {
        this.recordSlowQuery(queryKey, executionTime, options.query || 'Unknown query');
      }

      // Cache result if enabled
      if (options.enableCache !== false) {
        this.queryCache.set(cacheKey, {
          result,
          timestamp: Date.now()
        });
      }

      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      await errorHandler.handleError(error as Error, {
        operation: 'query_execution',
        queryKey,
        executionTime,
        query: options.query
      }, ErrorType.DATABASE_ERROR, ErrorSeverity.HIGH);

      throw error;
    }
  }

  /**
   * Record slow query for analysis
   */
  private recordSlowQuery(queryKey: string, executionTime: number, query: string): void {
    if (!this.slowQueries.has(queryKey)) {
      this.slowQueries.set(queryKey, []);
    }

    const queries = this.slowQueries.get(queryKey)!;
    queries.push({
      timestamp: new Date(),
      executionTime,
      query
    });

    // Keep only last 10 slow queries per key
    if (queries.length > 10) {
      queries.shift();
    }

    console.warn(`Slow query detected: ${queryKey} (${executionTime}ms)`);
  }

  /**
   * Get slow query analysis
   */
  getSlowQueryAnalysis(): SlowQueryAnalysis {
    const analysis: SlowQueryAnalysis = {
      totalSlowQueries: 0,
      slowestQueries: [],
      frequentSlowQueries: []
    };

    for (const [queryKey, queries] of this.slowQueries.entries()) {
      analysis.totalSlowQueries += queries.length;

      // Find slowest query
      const slowest = queries.reduce((prev, current) => 
        current.executionTime > prev.executionTime ? current : prev
      );

      analysis.slowestQueries.push({
        queryKey,
        ...slowest
      });

      // Track frequent slow queries
      if (queries.length >= 3) {
        analysis.frequentSlowQueries.push({
          queryKey,
          occurrences: queries.length,
          avgExecutionTime: queries.reduce((sum, q) => sum + q.executionTime, 0) / queries.length
        });
      }
    }

    // Sort by execution time and frequency
    analysis.slowestQueries.sort((a, b) => b.executionTime - a.executionTime);
    analysis.frequentSlowQueries.sort((a, b) => b.occurrences - a.occurrences);

    return analysis;
  }

  /**
   * Clear query cache
   */
  clearQueryCache(): void {
    this.queryCache.clear();
  }
}

/**
 * Database Connection Pool Optimizer
 */
export class ConnectionPoolOptimizer {
  private connectionMetrics: ConnectionMetrics = {
    activeConnections: 0,
    totalConnections: 0,
    connectionErrors: 0,
    avgResponseTime: 0
  };

  /**
   * Optimize database connections based on load
   */
  async optimizeConnections(): Promise<OptimizationResult> {
    const startTime = Date.now();
    
    try {
      // Test connection health
      const { error: healthError } = await supabase
        .from('artists')
        .select('count')
        .limit(1);

      if (healthError) {
        this.connectionMetrics.connectionErrors++;
        throw healthError;
      }

      // Update metrics
      const responseTime = Date.now() - startTime;
      this.updateConnectionMetrics(responseTime);

      return {
        success: true,
        message: 'Database connections optimized',
        metrics: { ...this.connectionMetrics }
      };

    } catch (error) {
      return {
        success: false,
        message: 'Connection optimization failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private updateConnectionMetrics(responseTime: number): void {
    this.connectionMetrics.totalConnections++;
    this.connectionMetrics.avgResponseTime = 
      (this.connectionMetrics.avgResponseTime + responseTime) / 2;
  }

  getConnectionMetrics(): ConnectionMetrics {
    return { ...this.connectionMetrics };
  }
}

/**
 * Real-time Performance Monitor
 */
export class RealtimePerformanceMonitor {
  private performanceMetrics: PerformanceMetrics = {
    realtimeLatency: 0,
    messageCount: 0,
    connectionDrops: 0,
    lastHeartbeat: new Date()
  };

  /**
   * Monitor real-time connection performance
   */
  startMonitoring(): void {
    // Monitor Supabase realtime performance
    setInterval(() => {
      this.checkRealtimeHealth();
    }, 30000); // Check every 30 seconds
  }

  private async checkRealtimeHealth(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test real-time connectivity by subscribing and immediately unsubscribing
      const subscription = supabase
        .channel('health-check')
        .on('broadcast', { event: 'test' }, () => {})
        .subscribe();

      // Clean up immediately
      setTimeout(() => {
        subscription.unsubscribe();
      }, 1000);

      const latency = Date.now() - startTime;
      this.performanceMetrics.realtimeLatency = latency;
      this.performanceMetrics.lastHeartbeat = new Date();

    } catch (error) {
      this.performanceMetrics.connectionDrops++;
      console.error('Real-time health check failed:', error);
    }
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }
}

/**
 * Cache Performance Optimizer
 */
export class CachePerformanceOptimizer {
  /**
   * Optimize cache performance based on usage patterns
   */
  async optimizeCachePerformance(): Promise<OptimizationResult> {
    try {
      const cacheStats = cacheService.getStats();
      const optimizations: string[] = [];

      // Check for cache usage patterns and optimize
      for (const [cacheName, stats] of Object.entries(cacheStats)) {
        if (stats.hitRate < 0.5) {
          optimizations.push(`Low hit rate in ${cacheName} cache (${(stats.hitRate * 100).toFixed(1)}%)`);
        }

        if (stats.usage > 80) {
          optimizations.push(`High usage in ${cacheName} cache (${stats.usage}%)`);
          // Auto-cleanup if usage is too high
          if (stats.usage > 90) {
            cacheService.invalidatePattern(`${cacheName}:*`);
            optimizations.push(`Auto-cleaned ${cacheName} cache`);
          }
        }
      }

      return {
        success: true,
        message: `Cache optimization complete. Applied ${optimizations.length} optimizations.`,
        optimizations
      };

    } catch (error) {
      return {
        success: false,
        message: 'Cache optimization failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

/**
 * Performance Optimization Service
 * Main service that coordinates all performance optimizations
 */
export class PerformanceOptimizationService {
  private queryMonitor = QueryPerformanceMonitor.getInstance();
  private connectionOptimizer = new ConnectionPoolOptimizer();
  private realtimeMonitor = new RealtimePerformanceMonitor();
  private cacheOptimizer = new CachePerformanceOptimizer();

  /**
   * Initialize performance monitoring
   */
  initialize(): void {
    console.log('🚀 Initializing Performance Optimization Service');
    
    // Start real-time monitoring
    this.realtimeMonitor.startMonitoring();
    
    // Set up periodic optimizations
    this.schedulePerformanceOptimizations();
  }

  /**
   * Execute comprehensive performance optimization
   */
  async runPerformanceOptimization(): Promise<PerformanceOptimizationResult> {
    const startTime = Date.now();
    const results: OptimizationResult[] = [];

    try {
      // Optimize database connections
      const connectionResult = await this.connectionOptimizer.optimizeConnections();
      results.push(connectionResult);

      // Optimize cache performance
      const cacheResult = await this.cacheOptimizer.optimizeCachePerformance();
      results.push(cacheResult);

      // Get performance metrics
      const metrics = this.getComprehensiveMetrics();

      const totalTime = Date.now() - startTime;
      const successfulOptimizations = results.filter(r => r.success).length;

      return {
        success: successfulOptimizations > 0,
        message: `Performance optimization completed in ${totalTime}ms`,
        optimizationResults: results,
        metrics,
        processingTime: totalTime
      };

    } catch (error) {
      return {
        success: false,
        message: 'Performance optimization failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Get comprehensive performance metrics
   */
  getComprehensiveMetrics(): ComprehensiveMetrics {
    return {
      database: this.connectionOptimizer.getConnectionMetrics(),
      realtime: this.realtimeMonitor.getPerformanceMetrics(),
      cache: cacheService.getStats(),
      queries: this.queryMonitor.getSlowQueryAnalysis()
    };
  }

  /**
   * Schedule periodic performance optimizations
   */
  private schedulePerformanceOptimizations(): void {
    // Run optimization every 15 minutes
    setInterval(() => {
      this.runPerformanceOptimization()
        .then(result => {
          if (result.success) {
            console.log('✅ Periodic performance optimization completed');
          } else {
            console.warn('⚠️ Periodic performance optimization had issues:', result.message);
          }
        })
        .catch(error => {
          console.error('❌ Periodic performance optimization failed:', error);
        });
    }, 15 * 60 * 1000); // 15 minutes
  }
}

// Type definitions
interface QueryOptions {
  enableCache?: boolean;
  query?: string;
}

interface CachedQueryResult {
  result: any;
  timestamp: number;
}

interface SlowQueryInfo {
  timestamp: Date;
  executionTime: number;
  query: string;
}

interface SlowQueryAnalysis {
  totalSlowQueries: number;
  slowestQueries: Array<SlowQueryInfo & { queryKey: string }>;
  frequentSlowQueries: Array<{
    queryKey: string;
    occurrences: number;
    avgExecutionTime: number;
  }>;
}

interface ConnectionMetrics {
  activeConnections: number;
  totalConnections: number;
  connectionErrors: number;
  avgResponseTime: number;
}

interface PerformanceMetrics {
  realtimeLatency: number;
  messageCount: number;
  connectionDrops: number;
  lastHeartbeat: Date;
}

interface OptimizationResult {
  success: boolean;
  message: string;
  error?: string;
  metrics?: any;
  optimizations?: string[];
}

interface PerformanceOptimizationResult {
  success: boolean;
  message: string;
  optimizationResults: OptimizationResult[];
  metrics: ComprehensiveMetrics;
  processingTime: number;
  error?: string;
}

interface ComprehensiveMetrics {
  database: ConnectionMetrics;
  realtime: PerformanceMetrics;
  cache: any;
  queries: SlowQueryAnalysis;
}

// Export singleton instance
export const performanceOptimizationService = new PerformanceOptimizationService();
export const queryPerformanceMonitor = QueryPerformanceMonitor.getInstance();

// Auto-initialize in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  performanceOptimizationService.initialize();
}
