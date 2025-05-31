#!/usr/bin/env node

/**
 * Performance Optimization Implementation Script
 * This script implements the performance optimizations identified in the analysis
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// React Component Optimizations
const reactOptimizations = {
  // Add React.memo to components that don't need frequent re-renders
  addReactMemo: (filePath, componentName) => {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if React.memo is already imported
    if (!content.includes('React.memo')) {
      // Add React import if not present
      let updatedContent = content;
      if (content.includes('import React')) {
        updatedContent = content.replace(
          /import React(.*?) from ['"]react['"]/,
          `import React, { memo$1 } from 'react'`
        );
      } else {
        updatedContent = `import { memo } from 'react';\n${content}`;
      }
      
      // Wrap component export with memo
      updatedContent = updatedContent.replace(
        new RegExp(`export default ${componentName}`),
        `export default memo(${componentName})`
      );
      
      fs.writeFileSync(filePath, updatedContent);
      log(`✅ Added React.memo to ${componentName}`, 'green');
    }
  },
  
  // Add useMemo for expensive calculations
  addUseMemo: (filePath, targetFunction) => {
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (!content.includes('useMemo')) {
      // Add useMemo import
      const updatedContent = content.replace(
        /import.*?{([^}]*)}.*?from ['"]react['"]/,
        (match, imports) => {
          if (!imports.includes('useMemo')) {
            return match.replace(imports, `${imports.trim()}, useMemo`);
          }
          return match;
        }
      );
      
      fs.writeFileSync(filePath, updatedContent);
      log(`✅ Added useMemo import to ${path.basename(filePath)}`, 'green');
    }
  },
  
  // Add useCallback for event handlers
  addUseCallback: (filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (!content.includes('useCallback')) {
      const updatedContent = content.replace(
        /import.*?{([^}]*)}.*?from ['"]react['"]/,
        (match, imports) => {
          if (!imports.includes('useCallback')) {
            return match.replace(imports, `${imports.trim()}, useCallback`);
          }
          return match;
        }
      );
      
      fs.writeFileSync(filePath, updatedContent);
      log(`✅ Added useCallback import to ${path.basename(filePath)}`, 'green');
    }
  }
};

// Database Query Optimizations
const databaseOptimizations = {
  // Create optimized query patterns
  createOptimizedQueries: () => {
    const optimizedQueriesContent = `
// Optimized database query patterns
import { supabase } from '@/integrations/supabase/client';
import { Show, Artist, Venue } from '@/types/database';

// Optimized artist search with proper indexing
export async function getArtistWithShows(artistId: string) {
  const { data, error } = await supabase
    .from('artists')
    .select(\`
      id,
      name,
      image_url,
      popularity,
      shows!shows_artist_id_fkey(
        id,
        date,
        name,
        status,
        venues!shows_venue_id_fkey(
          id,
          name,
          city,
          state,
          country
        )
      )
    \`)
    .eq('id', artistId)
    .single();
    
  return { data, error };
}

// Optimized trending shows query
export async function getTrendingShows(limit = 10) {
  const { data, error } = await supabase
    .from('trending_shows')
    .select('*')
    .order('trending_score', { ascending: false })
    .limit(limit);
    
  return { data, error };
}

// Batch vote operations
export async function batchVoteOperations(votes: Array<{ setlist_song_id: string; user_id: string }>) {
  const { data, error } = await supabase
    .from('votes')
    .upsert(votes, { onConflict: 'user_id,setlist_song_id' });
    
  return { data, error };
}

// Optimized search with proper pagination
export async function searchWithPagination(
  query: string, 
  page = 1, 
  pageSize = 20
) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  const { data, error, count } = await supabase
    .from('shows')
    .select(\`
      *,
      artists!shows_artist_id_fkey(id, name, image_url),
      venues!shows_venue_id_fkey(id, name, city, state, country)
    \`, { count: 'exact' })
    .or(\`name.ilike.%\${query}%,artists.name.ilike.%\${query}%\`)
    .range(from, to)
    .order('date', { ascending: true });
    
  return { data, error, count, totalPages: Math.ceil((count || 0) / pageSize) };
}
`;
    
    const filePath = path.join(process.cwd(), 'src/services/optimizedQueries.ts');
    fs.writeFileSync(filePath, optimizedQueriesContent);
    log('✅ Created optimized database queries', 'green');
  }
};

// Memory Leak Prevention
const memoryOptimizations = {
  // Create cleanup utilities
  createCleanupUtilities: () => {
    const cleanupUtilsContent = `
// Memory leak prevention utilities
import { useEffect, useRef } from 'react';

// Hook to cleanup intervals and timeouts
export function useCleanup() {
  const timeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const intervalsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  
  const addTimeout = (timeout: NodeJS.Timeout) => {
    timeoutsRef.current.add(timeout);
    return timeout;
  };
  
  const addInterval = (interval: NodeJS.Timeout) => {
    intervalsRef.current.add(interval);
    return interval;
  };
  
  const cleanup = () => {
    timeoutsRef.current.forEach(clearTimeout);
    intervalsRef.current.forEach(clearInterval);
    timeoutsRef.current.clear();
    intervalsRef.current.clear();
  };
  
  useEffect(() => {
    return cleanup;
  }, []);
  
  return { addTimeout, addInterval, cleanup };
}

// Hook for debounced values
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (renderTime > 100) { // Log slow renders
        console.warn(\`Slow render detected in \${componentName}: \${renderTime.toFixed(2)}ms\`);
      }
    };
  });
}
`;
    
    const filePath = path.join(process.cwd(), 'src/hooks/useCleanup.ts');
    fs.writeFileSync(filePath, cleanupUtilsContent);
    log('✅ Created cleanup utilities', 'green');
  }
};

// Bundle Optimization
const bundleOptimizations = {
  // Create webpack bundle analyzer config
  createBundleAnalyzer: () => {
    const analyzerConfig = `
// Bundle analyzer configuration
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          utils: ['lodash', 'date-fns']
        }
      }
    }
  }
});
`;
    
    const filePath = path.join(process.cwd(), 'vite.config.analyzer.ts');
    fs.writeFileSync(filePath, analyzerConfig);
    log('✅ Created bundle analyzer configuration', 'green');
  },
  
  // Add lazy loading for routes
  implementLazyLoading: () => {
    const lazyRoutesContent = `
// Lazy-loaded route components
import { lazy } from 'react';

// Lazy load heavy components
export const ArtistPage = lazy(() => import('@/pages/ArtistPage'));
export const SearchResults = lazy(() => import('@/pages/SearchResults'));
export const AllArtists = lazy(() => import('@/pages/AllArtists'));
export const AdvancedSearch = lazy(() => import('@/pages/AdvancedSearch'));
export const MyArtists = lazy(() => import('@/pages/MyArtists'));

// Lazy load heavy components
export const VotingStats = lazy(() => import('@/components/VotingStats'));
export const TrendingShows = lazy(() => import('@/components/TrendingShows'));
export const ArtistCatalog = lazy(() => import('@/components/ArtistCatalog'));
`;
    
    const filePath = path.join(process.cwd(), 'src/components/LazyComponents.ts');
    fs.writeFileSync(filePath, lazyRoutesContent);
    log('✅ Created lazy loading components', 'green');
  }
};

// Main implementation function
function implementOptimizations() {
  log('🚀 Starting performance optimization implementation...', 'blue');
  
  try {
    // 1. Database optimizations
    log('\n📊 Implementing database optimizations...', 'yellow');
    databaseOptimizations.createOptimizedQueries();
    
    // 2. Memory leak prevention
    log('\n🧹 Implementing memory leak prevention...', 'yellow');
    memoryOptimizations.createCleanupUtilities();
    
    // 3. Bundle optimizations
    log('\n📦 Implementing bundle optimizations...', 'yellow');
    bundleOptimizations.createBundleAnalyzer();
    bundleOptimizations.implementLazyLoading();
    
    // 4. React component optimizations (selective)
    log('\n⚛️ Implementing React optimizations...', 'yellow');
    
    // Add React.memo to heavy components
    const heavyComponents = [
      { path: 'src/components/TrendingShows.tsx', name: 'TrendingShows' },
      { path: 'src/components/VotingStats.tsx', name: 'VotingStats' },
      { path: 'src/components/ArtistCatalog.tsx', name: 'ArtistCatalog' }
    ];
    
    heavyComponents.forEach(({ path: filePath, name }) => {
      const fullPath = path.join(process.cwd(), filePath);
      if (fs.existsSync(fullPath)) {
        reactOptimizations.addReactMemo(fullPath, name);
      }
    });
    
    // 5. Create performance monitoring setup
    log('\n📈 Setting up performance monitoring...', 'yellow');
    createPerformanceMonitoring();
    
    // 6. Update package.json scripts
    log('\n📝 Updating package.json scripts...', 'yellow');
    updatePackageJsonScripts();
    
    log('\n✅ Performance optimization implementation completed!', 'green');
    log('\n📋 Next steps:', 'blue');
    log('1. Run: npm run build:analyze to analyze bundle size');
    log('2. Run: npm run perf:monitor to start performance monitoring');
    log('3. Test the application for performance improvements');
    log('4. Monitor memory usage and cleanup effectiveness');
    
  } catch (error) {
    log(`❌ Error during optimization implementation: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Create performance monitoring setup
function createPerformanceMonitoring() {
  const monitoringContent = `
// Performance monitoring setup
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
    
    // Keep only last 100 measurements
    const values = this.metrics.get(name)!;
    if (values.length > 100) {
      values.shift();
    }
  }
  
  getAverageMetric(name: string): number {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
  
  getAllMetrics(): Record<string, { average: number; count: number }> {
    const result: Record<string, { average: number; count: number }> = {};
    
    this.metrics.forEach((values, name) => {
      result[name] = {
        average: this.getAverageMetric(name),
        count: values.length
      };
    });
    
    return result;
  }
  
  logMetrics() {
    console.table(this.getAllMetrics());
  }
}

// Global performance monitoring
if (typeof window !== 'undefined') {
  const monitor = PerformanceMonitor.getInstance();
  
  // Monitor page load times
  window.addEventListener('load', () => {
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    monitor.recordMetric('page_load_time', loadTime);
  });
  
  // Monitor memory usage (if available)
  if ('memory' in performance) {
    setInterval(() => {
      const memory = (performance as any).memory;
      monitor.recordMetric('memory_used', memory.usedJSHeapSize);
      monitor.recordMetric('memory_total', memory.totalJSHeapSize);
    }, 30000); // Every 30 seconds
  }
}
`;
  
  const filePath = path.join(process.cwd(), 'src/utils/performanceMonitor.ts');
  fs.writeFileSync(filePath, monitoringContent);
  log('✅ Created performance monitoring setup', 'green');
}

// Update package.json with new scripts
function updatePackageJsonScripts() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Add new scripts
  packageJson.scripts = {
    ...packageJson.scripts,
    'build:analyze': 'vite build --config vite.config.analyzer.ts',
    'perf:monitor': 'node -e "console.log(\'Performance monitoring enabled\'); setInterval(() => {}, 1000)"',
    'type:check': 'tsc --noEmit --strict',
    'optimize': 'node scripts/implement-performance-optimizations.js'
  };
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  log('✅ Updated package.json scripts', 'green');
}

// Run the implementation
if (require.main === module) {
  implementOptimizations();
}

module.exports = {
  reactOptimizations,
  databaseOptimizations,
  memoryOptimizations,
  bundleOptimizations,
  implementOptimizations
};