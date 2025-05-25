interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  key?: string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  
  /**
   * Check if a request should be allowed based on rate limiting rules
   * @param config Rate limit configuration
   * @returns true if request is allowed, false if rate limited
   */
  public checkLimit(config: RateLimitConfig): boolean {
    const key = config.key || 'default';
    const now = Date.now();
    const entry = this.limits.get(key);
    
    // If no entry exists or window has expired, create new entry
    if (!entry || now > entry.resetTime) {
      this.limits.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });
      return true;
    }
    
    // If within limit, increment and allow
    if (entry.count < config.maxRequests) {
      entry.count++;
      return true;
    }
    
    // Rate limited
    return false;
  }
  
  /**
   * Get remaining requests for a given key
   * @param config Rate limit configuration
   * @returns Number of remaining requests
   */
  public getRemainingRequests(config: RateLimitConfig): number {
    const key = config.key || 'default';
    const entry = this.limits.get(key);
    
    if (!entry || Date.now() > entry.resetTime) {
      return config.maxRequests;
    }
    
    return Math.max(0, config.maxRequests - entry.count);
  }
  
  /**
   * Get time until rate limit resets
   * @param key Rate limit key
   * @returns Milliseconds until reset, or 0 if not rate limited
   */
  public getResetTime(key: string = 'default'): number {
    const entry = this.limits.get(key);
    
    if (!entry || Date.now() > entry.resetTime) {
      return 0;
    }
    
    return entry.resetTime - Date.now();
  }
  
  /**
   * Clear rate limits for a specific key or all keys
   * @param key Optional key to clear, clears all if not provided
   */
  public clear(key?: string): void {
    if (key) {
      this.limits.delete(key);
    } else {
      this.limits.clear();
    }
  }
}

// Create singleton instance
export const rateLimiter = new RateLimiter();

// Predefined rate limit configurations
export const RATE_LIMITS = {
  // API calls
  SPOTIFY_API: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 30 requests per minute
  },
  TICKETMASTER_API: {
    maxRequests: 20,
    windowMs: 60 * 1000, // 20 requests per minute
  },
  SETLISTFM_API: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 10 requests per minute
  },
  
  // User actions
  VOTING: {
    maxRequests: 60,
    windowMs: 60 * 1000, // 60 votes per minute
  },
  SEARCH: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 30 searches per minute
  },
  AUTH_ATTEMPTS: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 5 attempts per 15 minutes
  },
};

/**
 * Higher-order function to wrap async functions with rate limiting
 */
export function withRateLimit<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  config: RateLimitConfig,
  onRateLimited?: () => void
): T {
  return (async (...args: Parameters<T>) => {
    if (!rateLimiter.checkLimit(config)) {
      if (onRateLimited) {
        onRateLimited();
      } else {
        const resetTime = rateLimiter.getResetTime(config.key || 'default');
        const seconds = Math.ceil(resetTime / 1000);
        throw new Error(`Rate limited. Please try again in ${seconds} seconds.`);
      }
      return;
    }
    
    return fn(...args);
  }) as T;
}