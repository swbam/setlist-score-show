import fp from 'fastify-plugin'
import { FastifyRequest, FastifyReply } from 'fastify'
import Redis from 'ioredis'

interface RateLimitOptions {
  redis?: Redis
  redisUrl?: string
  global?: {
    max: number
    window: number // in seconds
  }
  routes?: {
    [key: string]: {
      max: number
      window: number // in seconds
    }
  }
}

interface RateLimitStore {
  incr(key: string): Promise<number>
  expire(key: string, seconds: number): Promise<number>
  ttl(key: string): Promise<number>
}

class RedisStore implements RateLimitStore {
  constructor(private redis: Redis) {}

  async incr(key: string): Promise<number> {
    return this.redis.incr(key)
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.redis.expire(key, seconds)
  }

  async ttl(key: string): Promise<number> {
    return this.redis.ttl(key)
  }
}

// In-memory store for development/testing
class MemoryStore implements RateLimitStore {
  private store = new Map<string, { count: number; expiresAt: number }>()

  async incr(key: string): Promise<number> {
    const now = Date.now()
    const existing = this.store.get(key)

    if (existing && existing.expiresAt > now) {
      existing.count++
      return existing.count
    }

    this.store.set(key, { count: 1, expiresAt: now + 60000 }) // Default 1 minute
    return 1
  }

  async expire(key: string, seconds: number): Promise<number> {
    const existing = this.store.get(key)
    if (existing) {
      existing.expiresAt = Date.now() + (seconds * 1000)
      return 1
    }
    return 0
  }

  async ttl(key: string): Promise<number> {
    const existing = this.store.get(key)
    if (existing) {
      const ttl = Math.floor((existing.expiresAt - Date.now()) / 1000)
      return ttl > 0 ? ttl : -1
    }
    return -1
  }
}

export const rateLimitPlugin = fp(async (fastify, opts: RateLimitOptions) => {
  // Initialize store
  let store: RateLimitStore

  if (opts.redis) {
    store = new RedisStore(opts.redis)
  } else if (opts.redisUrl || process.env.REDIS_URL) {
    const redis = new Redis(opts.redisUrl || process.env.REDIS_URL!)
    store = new RedisStore(redis)
    
    // Ensure Redis connection is closed on app shutdown
    fastify.addHook('onClose', async () => {
      await redis.quit()
    })
  } else {
    fastify.log.warn('No Redis connection provided for rate limiting, using in-memory store')
    store = new MemoryStore()
  }

  // Default limits
  const defaultLimits = {
    global: opts.global || { max: 100, window: 60 }, // 100 requests per minute
    routes: {
      '/graphql': { max: 30, window: 60 }, // 30 GraphQL requests per minute
      '/api/vote': { max: 10, window: 60 }, // 10 votes per minute
      '/api/auth/register': { max: 5, window: 3600 }, // 5 registrations per hour
      '/api/auth/login': { max: 10, window: 300 }, // 10 login attempts per 5 minutes
      ...opts.routes
    }
  }

  // Get client identifier (IP or user ID)
  function getClientId(request: FastifyRequest): string {
    // Prefer authenticated user ID
    if (request.user?.id) {
      return `user:${request.user.id}`
    }

    // Fallback to IP address
    const forwarded = request.headers['x-forwarded-for']
    const ip = forwarded
      ? (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',')[0].trim()
      : request.ip

    return `ip:${ip}`
  }

  // Rate limit checker
  async function checkRateLimit(
    clientId: string,
    route: string,
    limits: { max: number; window: number }
  ): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
    const key = `ratelimit:${route}:${clientId}`
    const count = await store.incr(key)

    if (count === 1) {
      await store.expire(key, limits.window)
    }

    const ttl = await store.ttl(key)
    const remaining = Math.max(0, limits.max - count)

    return {
      allowed: count <= limits.max,
      remaining,
      resetIn: ttl > 0 ? ttl : limits.window
    }
  }

  // Main rate limit preHandler
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip rate limiting for health checks
    if (request.url === '/health' || request.url === '/metrics') {
      return
    }

    const clientId = getClientId(request)
    const route = request.routerPath || request.url

    // Check route-specific limit first
    let limits = defaultLimits.routes[route] || defaultLimits.global
    
    // For GraphQL, check operation-specific limits
    if (route === '/graphql' && request.body && typeof request.body === 'object') {
      const body = request.body as any
      if (body.operationName === 'CastVote') {
        limits = { max: 10, window: 60 } // More restrictive for voting
      }
    }

    const result = await checkRateLimit(clientId, route, limits)

    // Set rate limit headers
    reply.header('X-RateLimit-Limit', limits.max.toString())
    reply.header('X-RateLimit-Remaining', result.remaining.toString())
    reply.header('X-RateLimit-Reset', (Date.now() + result.resetIn * 1000).toString())

    if (!result.allowed) {
      reply.header('Retry-After', result.resetIn.toString())
      
      return reply.code(429).send({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${result.resetIn} seconds.`,
        retryAfter: result.resetIn
      })
    }
  })

  // Decorator for custom rate limits on specific routes
  fastify.decorate('rateLimit', function (limits: { max: number; window: number }) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
      const clientId = getClientId(request)
      const route = `custom:${request.id}` // Unique key for custom limits

      const result = await checkRateLimit(clientId, route, limits)

      reply.header('X-RateLimit-Limit', limits.max.toString())
      reply.header('X-RateLimit-Remaining', result.remaining.toString())
      reply.header('X-RateLimit-Reset', (Date.now() + result.resetIn * 1000).toString())

      if (!result.allowed) {
        reply.header('Retry-After', result.resetIn.toString())
        
        return reply.code(429).send({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${result.resetIn} seconds.`,
          retryAfter: result.resetIn
        })
      }
    }
  })

  // Add store to fastify instance for direct access
  fastify.decorate('rateLimitStore', store)

  fastify.log.info('Rate limit plugin loaded')
}, {
  name: 'ratelimit-plugin',
  dependencies: []
})

// Type augmentation for TypeScript
declare module 'fastify' {
  interface FastifyInstance {
    rateLimit: (limits: { max: number; window: number }) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    rateLimitStore: RateLimitStore
  }
}