// src/server.ts
import Fastify from 'fastify'
import mercurius from 'mercurius'
import { PrismaClient } from '@setlist/database'
import Redis from 'ioredis'
import { createClient } from '@supabase/supabase-js'
import { schema } from './schema'
import { resolvers } from './resolvers'
import { authPlugin } from './plugins/auth'
import { rateLimitPlugin } from './plugins/ratelimit'
import { supabaseRealtimePlugin } from './plugins/supabase-realtime'

export async function createServer() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true
        }
      }
    }
  })

  // Database & Redis
  const prisma = new PrismaClient()
  const redis = new Redis(process.env.REDIS_URL!)
  
  // Supabase client for server-side operations
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role key for bypassing RLS
  )

  app.decorate('prisma', prisma)
  app.decorate('redis', redis)
  app.decorate('supabase', supabase)

  // Plugins
  await app.register(authPlugin)
  await app.register(rateLimitPlugin)
  await app.register(supabaseRealtimePlugin) // Sets up Realtime channels

  // GraphQL
  await app.register(mercurius, {
    schema,
    resolvers,
    context: async (request, reply) => ({
      prisma,
      redis,
      supabase,
      user: request.user
    }),
    graphiql: process.env.NODE_ENV !== 'production'
  })

  // Health check
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }))

  return app
}