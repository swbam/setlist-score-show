// src/server.ts
import Fastify from 'fastify'
import mercurius from 'mercurius'
import { PrismaClient } from '@setlist/database'
import Redis from 'ioredis'
import { createClient } from '@supabase/supabase-js'
import { schema } from './schema'
import { resolvers } from './resolvers'
import type { MercuriusContext } from 'mercurius'
import { authPlugin } from './plugins/auth'
import { corsPlugin } from './plugins/cors'
import { rateLimitPlugin } from './plugins/ratelimit'
import { supabaseRealtimePlugin } from './plugins/supabase-realtime'
import { SpotifyService } from './lib/spotify'
import { TicketmasterClient } from './lib/ticketmaster'
import { SetlistFmClient } from './lib/setlistfm'

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
  const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null
  
  // Supabase client for server-side operations
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role key for bypassing RLS
  )

  // External API services
  const spotify = new SpotifyService(redis)
  const ticketmaster = new TicketmasterClient({
    apiKey: process.env.TICKETMASTER_API_KEY!,
    rateLimit: 5
  })
  const setlistfm = new SetlistFmClient(process.env.SETLIST_FM_API_KEY!)

  app.decorate('prisma', prisma)
  app.decorate('redis', redis)
  app.decorate('supabase', supabase)
  app.decorate('spotify', spotify)
  app.decorate('ticketmaster', ticketmaster)
  app.decorate('setlistfm', setlistfm)

  // Plugins
  await app.register(corsPlugin)
  await app.register(authPlugin)
  await app.register(rateLimitPlugin)
  await app.register(supabaseRealtimePlugin) // Sets up Realtime channels

  // GraphQL
  await app.register(mercurius, {
    schema,
    resolvers: resolvers as any, // Type assertion to resolve Mercurius type conflicts
    context: async (request, reply) => ({
      prisma,
      redis,
      supabase,
      spotify,
      ticketmaster,
      setlistfm,
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