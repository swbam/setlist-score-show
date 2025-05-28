/**
 * Advanced caching system for performance optimization
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size
}

export class AdvancedCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private accessOrder: string[] = [];
  private readonly maxSize: number;
  private readonly defaultTTL: number;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 100;
    this.defaultTTL = options.ttl || 5 * 60 * 1000; // 5 minutes default
  }

  set(key: string, data: T, customTTL?: number): void {
    const now = Date.now();
    const ttl = customTTL || this.defaultTTL;
    
    // Remove from access order if exists
    const existingIndex = this.accessOrder.indexOf(key);
    if (existingIndex > -1) {
      this.accessOrder.splice(existingIndex, 1);
    }

    // Add to end of access order
    this.accessOrder.push(key);

    // Store in cache
    this.cache.set(key, {
      data,
      timestamp: now,
      expiry: now + ttl
    });

    // Enforce size limit (LRU eviction)
    while (this.cache.size > this.maxSize) {
      const oldestKey = this.accessOrder.shift();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
      return null;
    }

    // Update access order (move to end)
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
      this.accessOrder.push(key);
    }

    return entry.data;
  }

  invalidate(key: string): boolean {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    return this.cache.delete(key);
  }

  invalidatePattern(pattern: string): number {
    let invalidated = 0;
    const regex = new RegExp(pattern);
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.invalidate(key);
        invalidated++;
      }
    }
    
    return invalidated;
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  size(): number {
    return this.cache.size;
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      usage: (this.cache.size / this.maxSize) * 100
    };
  }
}

/**
 * Global cache instances for different data types
 */
export const votingCache = new AdvancedCache<any>({
  ttl: 2 * 60 * 1000, // 2 minutes for voting data
  maxSize: 50
});

export const artistCache = new AdvancedCache<any>({
  ttl: 15 * 60 * 1000, // 15 minutes for artist data
  maxSize: 200
});

export const showCache = new AdvancedCache<any>({
  ttl: 10 * 60 * 1000, // 10 minutes for show data
  maxSize: 100
});

export const userCache = new AdvancedCache<any>({
  ttl: 5 * 60 * 1000, // 5 minutes for user data
  maxSize: 50
});

/**
 * Cache-aware data fetching utilities
 */
export class CachedDataService {
  /**
   * Get vote counts with caching
   */
  static async getVoteCounts(setlistId: string): Promise<Record<string, number>> {
    const cacheKey = `vote-counts-${setlistId}`;
    
    // Try cache first
    const cached = votingCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database if not cached
    try {
      const { DatabaseManager } = await import('./databaseManager');
      const data = await DatabaseManager.getVoteCounts(setlistId);
      
      // Cache the result
      votingCache.set(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error('Error fetching vote counts:', error);
      return {};
    }
  }

  /**
   * Get user vote stats with caching
   */
  static async getUserVoteStats(showId: string, userId: string): Promise<any> {
    const cacheKey = `user-stats-${userId}-${showId}`;
    
    // Try cache first
    const cached = userCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database if not cached
    try {
      const { DatabaseManager } = await import('./databaseManager');
      const data = await DatabaseManager.getUserVoteStats(showId, userId);
      
      // Cache the result with shorter TTL for user data
      userCache.set(cacheKey, data, 2 * 60 * 1000); // 2 minutes
      
      return data;
    } catch (error) {
      console.error('Error fetching user vote stats:', error);
      return null;
    }
  }

  /**
   * Invalidate vote-related caches when a vote is cast
   */
  static invalidateVoteCaches(setlistId: string, userId: string, showId: string): void {
    votingCache.invalidate(`vote-counts-${setlistId}`);
    userCache.invalidate(`user-stats-${userId}-${showId}`);
    
    // Invalidate any pattern-based caches
    votingCache.invalidatePattern(`setlist-${setlistId}-.*`);
  }

  /**
   * Get cache statistics for monitoring
   */
  static getCacheStats() {
    return {
      voting: votingCache.getStats(),
      artist: artistCache.getStats(),
      show: showCache.getStats(),
      user: userCache.getStats()
    };
  }

  /**
   * Clear all caches (for admin use)
   */
  static clearAllCaches(): void {
    votingCache.clear();
    artistCache.clear();
    showCache.clear();
    userCache.clear();
  }
}

// Create a unified cache service instance
export const cacheService = {
  invalidatePattern: (pattern: string) => {
    let total = 0;
    total += votingCache.invalidatePattern(pattern);
    total += artistCache.invalidatePattern(pattern);
    total += showCache.invalidatePattern(pattern);
    total += userCache.invalidatePattern(pattern);
    return total;
  },
  
  invalidate: (key: string) => {
    return votingCache.invalidate(key) || 
           artistCache.invalidate(key) || 
           showCache.invalidate(key) || 
           userCache.invalidate(key);
  },
  
  clear: () => {
    votingCache.clear();
    artistCache.clear();
    showCache.clear();
    userCache.clear();
  },
  
  getStats: () => ({
    voting: votingCache.getStats(),
    artist: artistCache.getStats(),
    show: showCache.getStats(),
    user: userCache.getStats()
  })
};

export default CachedDataService;
