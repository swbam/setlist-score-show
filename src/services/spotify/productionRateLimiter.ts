import { EventEmitter } from 'events';

interface QueuedRequest<T> {
  id: string;
  request: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
  retries: number;
  timestamp: number;
}

interface RateLimitConfig {
  requestsPerSecond: number;
  requestsPerMinute: number;
  requestsPerHour: number;
  retryDelayMs: number;
  maxRetries: number;
  backoffMultiplier: number;
}

export class ProductionSpotifyRateLimiter extends EventEmitter {
  private queue: Map<string, QueuedRequest<any>> = new Map();
  private processing = false;
  
  // Rate limit tracking
  private secondCounter = 0;
  private minuteCounter = 0;
  private hourCounter = 0;
  
  // Timestamps for rate limit windows
  private lastSecondReset = Date.now();
  private lastMinuteReset = Date.now();
  private lastHourReset = Date.now();
  
  private config: RateLimitConfig = {
    requestsPerSecond: 10,
    requestsPerMinute: 180,
    requestsPerHour: 10000,
    retryDelayMs: 1000,
    maxRetries: 3,
    backoffMultiplier: 2
  };

  constructor(config?: Partial<RateLimitConfig>) {
    super();
    this.config = { ...this.config, ...config };
    this.startProcessing();
  }

  async enqueue<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = this.generateId();
      const queuedRequest: QueuedRequest<T> = {
        id,
        request,
        resolve,
        reject,
        retries: 0,
        timestamp: Date.now()
      };
      
      this.queue.set(id, queuedRequest);
      this.emit('queued', { id, queueSize: this.queue.size });
      
      // Start processing if not already running
      if (!this.processing) {
        this.startProcessing();
      }
    });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async startProcessing() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.size > 0) {
      await this.processNext();
    }

    this.processing = false;
  }

  private async processNext() {
    // Reset counters if windows have expired
    this.resetCounters();

    // Check if we can make a request
    if (!this.canMakeRequest()) {
      // Calculate wait time until next available slot
      const waitTime = this.getWaitTime();
      await this.sleep(waitTime);
      return;
    }

    // Get the oldest request from queue
    const [id, queuedRequest] = Array.from(this.queue.entries())[0];
    if (!queuedRequest) return;

    this.queue.delete(id);
    this.incrementCounters();

    try {
      const result = await queuedRequest.request();
      
      // Check for rate limit response
      if (this.isRateLimitResponse(result)) {
        const retryAfter = this.getRetryAfter(result);
        await this.handleRateLimit(queuedRequest, retryAfter);
      } else {
        queuedRequest.resolve(result);
        this.emit('processed', { id, success: true });
      }
    } catch (error) {
      await this.handleError(queuedRequest, error);
    }
  }

  private resetCounters() {
    const now = Date.now();

    // Reset second counter
    if (now - this.lastSecondReset >= 1000) {
      this.secondCounter = 0;
      this.lastSecondReset = now;
    }

    // Reset minute counter
    if (now - this.lastMinuteReset >= 60000) {
      this.minuteCounter = 0;
      this.lastMinuteReset = now;
    }

    // Reset hour counter
    if (now - this.lastHourReset >= 3600000) {
      this.hourCounter = 0;
      this.lastHourReset = now;
    }
  }

  private canMakeRequest(): boolean {
    return (
      this.secondCounter < this.config.requestsPerSecond &&
      this.minuteCounter < this.config.requestsPerMinute &&
      this.hourCounter < this.config.requestsPerHour
    );
  }

  private incrementCounters() {
    this.secondCounter++;
    this.minuteCounter++;
    this.hourCounter++;
  }

  private getWaitTime(): number {
    const now = Date.now();
    const waitTimes = [];

    // Calculate wait time for each limit
    if (this.secondCounter >= this.config.requestsPerSecond) {
      waitTimes.push(1000 - (now - this.lastSecondReset));
    }
    if (this.minuteCounter >= this.config.requestsPerMinute) {
      waitTimes.push(60000 - (now - this.lastMinuteReset));
    }
    if (this.hourCounter >= this.config.requestsPerHour) {
      waitTimes.push(3600000 - (now - this.lastHourReset));
    }

    return Math.max(...waitTimes, 100); // Minimum 100ms wait
  }

  private isRateLimitResponse(response: any): boolean {
    if (response instanceof Response) {
      return response.status === 429;
    }
    return false;
  }

  private getRetryAfter(response: any): number {
    if (response instanceof Response) {
      const retryAfter = response.headers.get('Retry-After');
      if (retryAfter) {
        return parseInt(retryAfter) * 1000;
      }
    }
    return 60000; // Default to 1 minute
  }

  private async handleRateLimit(queuedRequest: QueuedRequest<any>, retryAfter: number) {
    this.emit('rateLimited', { retryAfter });
    
    if (queuedRequest.retries < this.config.maxRetries) {
      queuedRequest.retries++;
      
      // Add back to queue with delay
      setTimeout(() => {
        this.queue.set(queuedRequest.id, queuedRequest);
      }, retryAfter);
    } else {
      queuedRequest.reject(new Error('Max retries exceeded due to rate limiting'));
    }
  }

  private async handleError(queuedRequest: QueuedRequest<any>, error: any) {
    if (queuedRequest.retries < this.config.maxRetries) {
      queuedRequest.retries++;
      
      // Exponential backoff
      const delay = this.config.retryDelayMs * Math.pow(this.config.backoffMultiplier, queuedRequest.retries);
      
      setTimeout(() => {
        this.queue.set(queuedRequest.id, queuedRequest);
      }, delay);
      
      this.emit('retry', { id: queuedRequest.id, retries: queuedRequest.retries, delay });
    } else {
      queuedRequest.reject(error);
      this.emit('processed', { id: queuedRequest.id, success: false, error });
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public methods for monitoring
  getQueueSize(): number {
    return this.queue.size;
  }

  getStats() {
    return {
      queueSize: this.queue.size,
      secondCounter: this.secondCounter,
      minuteCounter: this.minuteCounter,
      hourCounter: this.hourCounter,
      processing: this.processing
    };
  }

  // Clean up old requests
  cleanupStaleRequests(maxAgeMs = 300000) { // 5 minutes default
    const now = Date.now();
    let cleaned = 0;
    
    for (const [id, request] of this.queue.entries()) {
      if (now - request.timestamp > maxAgeMs) {
        request.reject(new Error('Request timed out in queue'));
        this.queue.delete(id);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      this.emit('cleanup', { cleaned });
    }
  }
}

// Export singleton instance
export const spotifyRateLimiter = new ProductionSpotifyRateLimiter();

// Set up periodic cleanup
setInterval(() => {
  spotifyRateLimiter.cleanupStaleRequests();
}, 60000); // Every minute