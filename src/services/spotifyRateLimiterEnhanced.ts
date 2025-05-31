// Enhanced Spotify Rate Limiter with proper memory management
import { supabase } from "@/integrations/supabase/client";

interface QueueItem<T> {
  request: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: any) => void;
  retryCount: number;
  timestamp: number;
  id: string;
}

interface RateLimitStats {
  requestsThisSecond: number;
  requestsThisMinute: number;
  lastRequestTime: number;
  windowStart: number;
  dailyRequests: number;
  dailyWindowStart: number;
}

export class EnhancedSpotifyRateLimiter {
  private requestQueue: Map<string, QueueItem<any>> = new Map();
  private isProcessing = false;
  private stats: RateLimitStats;
  private readonly config = {
    requestsPerSecond: 8, // Conservative limit
    requestsPerMinute: 100, // Spotify's actual limit is higher but be safe
    dailyLimit: 10000, // Conservative daily limit
    burstLimit: 20,
    retryDelayMs: 1000,
    maxRetryDelayMs: 60000,
    maxRetries: 5,
    queueTimeout: 300000, // 5 minutes max queue time
  };

  constructor() {
    this.stats = {
      requestsThisSecond: 0,
      requestsThisMinute: 0,
      lastRequestTime: 0,
      windowStart: Date.now(),
      dailyRequests: 0,
      dailyWindowStart: Date.now(),
    };

    // Clean up old queue items periodically
    setInterval(() => this.cleanupQueue(), 60000); // Every minute
  }

  async enqueue<T>(request: () => Promise<T>, priority: 'high' | 'normal' | 'low' = 'normal'): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const queueItem: QueueItem<T> = {
        request,
        resolve,
        reject,
        retryCount: 0,
        timestamp: Date.now(),
        id,
      };

      // Check if queue is getting too large
      if (this.requestQueue.size > 1000) {
        reject(new Error('Rate limiter queue is full. Please try again later.'));
        return;
      }

      this.requestQueue.set(id, queueItem);
      this.processQueue();

      // Set timeout for queue items
      setTimeout(() => {
        if (this.requestQueue.has(id)) {
          this.requestQueue.delete(id);
          reject(new Error('Request timed out in queue'));
        }
      }, this.config.queueTimeout);
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.requestQueue.size === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.size > 0) {
      // Check if we need to wait for rate limits
      const waitTime = await this.calculateWaitTime();
      if (waitTime > 0) {
        setTimeout(() => {
          this.isProcessing = false;
          this.processQueue();
        }, waitTime);
        return;
      }

      // Get next item from queue (FIFO)
      const [itemId, queueItem] = this.requestQueue.entries().next().value;
      if (!queueItem) break;

      this.requestQueue.delete(itemId);

      try {
        // Execute request with timeout
        const result = await Promise.race([
          queueItem.request(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 30000)
          )
        ]);

        // Update stats
        this.updateStats();
        
        queueItem.resolve(result);
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error: any) {
        await this.handleError(error, queueItem, itemId);
      }
    }

    this.isProcessing = false;
  }

  private async calculateWaitTime(): Promise<number> {
    const now = Date.now();
    
    // Reset windows if needed
    if (now - this.stats.windowStart >= 1000) {
      this.stats.windowStart = now;
      this.stats.requestsThisSecond = 0;
    }
    
    if (now - this.stats.windowStart >= 60000) {
      this.stats.requestsThisMinute = 0;
    }
    
    if (now - this.stats.dailyWindowStart >= 86400000) { // 24 hours
      this.stats.dailyWindowStart = now;
      this.stats.dailyRequests = 0;
    }

    // Check daily limit
    if (this.stats.dailyRequests >= this.config.dailyLimit) {
      return 86400000 - (now - this.stats.dailyWindowStart); // Wait until next day
    }

    // Check per-minute limit
    if (this.stats.requestsThisMinute >= this.config.requestsPerMinute) {
      return 60000 - (now - this.stats.windowStart); // Wait until next minute
    }

    // Check per-second limit
    if (this.stats.requestsThisSecond >= this.config.requestsPerSecond) {
      return 1000 - (now - this.stats.windowStart); // Wait until next second
    }

    // Check minimum interval
    const timeSinceLastRequest = now - this.stats.lastRequestTime;
    const minInterval = 1000 / this.config.requestsPerSecond;
    
    if (timeSinceLastRequest < minInterval) {
      return minInterval - timeSinceLastRequest;
    }

    return 0;
  }

  private updateStats(): void {
    const now = Date.now();
    this.stats.lastRequestTime = now;
    this.stats.requestsThisSecond++;
    this.stats.requestsThisMinute++;
    this.stats.dailyRequests++;
  }

  private async handleError(error: any, queueItem: QueueItem<any>, itemId: string): Promise<void> {
    const isRateLimit = error.status === 429 || 
                       error.message?.includes('rate limit') ||
                       error.message?.includes('429');

    if (isRateLimit && queueItem.retryCount < this.config.maxRetries) {
      // Exponential backoff with jitter
      const baseDelay = this.config.retryDelayMs * Math.pow(2, queueItem.retryCount);
      const jitter = Math.random() * 1000; // Add randomness
      const delay = Math.min(baseDelay + jitter, this.config.maxRetryDelayMs);
      
      console.warn(`Rate limit hit, retrying in ${delay}ms (attempt ${queueItem.retryCount + 1})`);
      
      setTimeout(() => {
        queueItem.retryCount++;
        this.requestQueue.set(itemId, queueItem);
        this.processQueue();
      }, delay);
      
    } else {
      // Max retries exceeded or non-rate-limit error
      const errorMessage = isRateLimit ? 
        'Spotify API rate limit exceeded. Please try again later.' :
        `Spotify API error: ${error.message}`;
      
      queueItem.reject(new Error(errorMessage));
    }
  }

  private cleanupQueue(): void {
    const now = Date.now();
    const expiredItems: string[] = [];
    
    for (const [id, item] of this.requestQueue.entries()) {
      if (now - item.timestamp > this.config.queueTimeout) {
        expiredItems.push(id);
      }
    }
    
    expiredItems.forEach(id => {
      const item = this.requestQueue.get(id);
      if (item) {
        item.reject(new Error('Request expired in queue'));
        this.requestQueue.delete(id);
      }
    });
    
    if (expiredItems.length > 0) {
      console.log(`Cleaned up ${expiredItems.length} expired queue items`);
    }
  }

  // Public method to get current stats
  getStats(): RateLimitStats & { queueSize: number } {
    return {
      ...this.stats,
      queueSize: this.requestQueue.size,
    };
  }

  // Public method to clear queue (emergency use)
  clearQueue(): void {
    this.requestQueue.forEach(item => {
      item.reject(new Error('Queue cleared'));
    });
    this.requestQueue.clear();
  }
}

// Global instance
export const spotifyRateLimiter = new EnhancedSpotifyRateLimiter();
