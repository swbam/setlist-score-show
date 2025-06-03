// src/lib/redis.ts
import Redis from 'ioredis'

let redis: Redis | null = null

export function getRedisClient(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
      reconnectOnError(err) {
        const targetError = 'READONLY'
        if (err.message.includes(targetError)) {
          // Only reconnect when the error contains "READONLY"
          return true
        }
        return false
      },
      lazyConnect: true
    })

    redis.on('error', (err) => {
      console.error('Redis Client Error:', err)
    })

    redis.on('connect', () => {
      console.log('Redis Client Connected')
    })

    redis.on('ready', () => {
      console.log('Redis Client Ready')
    })
  }

  return redis
}

export async function closeRedisConnection() {
  if (redis) {
    await redis.quit()
    redis = null
  }
}

// Cache utilities
export const CacheKeys = {
  TRENDING_SHOWS: 'trending:shows',
  SHOW_SONGS: (showId: string) => `show:${showId}:songs`,
  ARTIST_SHOWS: (artistId: string) => `artist:${artistId}:shows`,
  USER_VOTES: (userId: string, showId: string) => `user:${userId}:show:${showId}:votes`,
  RATE_LIMIT: (key: string) => `ratelimit:${key}`,
  SYNC_LOCK: (type: string, entityId: string) => `sync:lock:${type}:${entityId}`,
  SEARCH_RESULTS: (query: string) => `search:${query}`,
  ARTIST_CATALOG: (artistId: string) => `artist:${artistId}:catalog`
} as const

export class CacheManager {
  constructor(private redis: Redis) {}

  async get<T = any>(key: string): Promise<T | null> {
    const value = await this.redis.get(key)
    if (!value) return null
    
    try {
      return JSON.parse(value)
    } catch {
      return value as any
    }
  }

  async set(key: string, value: any, ttl?: number) {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value)
    
    if (ttl) {
      await this.redis.setex(key, ttl, serialized)
    } else {
      await this.redis.set(key, serialized)
    }
  }

  async delete(key: string | string[]) {
    if (Array.isArray(key)) {
      if (key.length > 0) {
        await this.redis.del(...key)
      }
    } else {
      await this.redis.del(key)
    }
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key)
    return result === 1
  }

  async increment(key: string, amount = 1): Promise<number> {
    return await this.redis.incrby(key, amount)
  }

  async expire(key: string, seconds: number) {
    await this.redis.expire(key, seconds)
  }

  async ttl(key: string): Promise<number> {
    return await this.redis.ttl(key)
  }

  // Pattern-based operations
  async deletePattern(pattern: string) {
    const keys = await this.redis.keys(pattern)
    if (keys.length > 0) {
      await this.redis.del(...keys)
    }
  }

  async getMany<T = any>(keys: string[]): Promise<(T | null)[]> {
    if (keys.length === 0) return []
    
    const values = await this.redis.mget(...keys)
    return values.map(value => {
      if (!value) return null
      try {
        return JSON.parse(value)
      } catch {
        return value as any
      }
    })
  }

  // Lock mechanism for distributed operations
  async acquireLock(key: string, ttl = 30): Promise<boolean> {
    const lockKey = `lock:${key}`
    const result = await this.redis.set(lockKey, '1', 'EX', ttl, 'NX')
    return result === 'OK'
  }

  async releaseLock(key: string) {
    const lockKey = `lock:${key}`
    await this.redis.del(lockKey)
  }

  // Rate limiting
  async checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<{
    allowed: boolean
    remaining: number
    resetAt: Date
  }> {
    const now = Date.now()
    const window = Math.floor(now / (windowSeconds * 1000))
    const rateLimitKey = `${CacheKeys.RATE_LIMIT(key)}:${window}`
    
    const current = await this.increment(rateLimitKey)
    
    if (current === 1) {
      await this.expire(rateLimitKey, windowSeconds + 1)
    }
    
    const allowed = current <= limit
    const remaining = Math.max(0, limit - current)
    const resetAt = new Date((window + 1) * windowSeconds * 1000)
    
    return { allowed, remaining, resetAt }
  }
}

export default getRedisClient