// src/index.ts - Entry point
import * as dotenv from 'dotenv'
dotenv.config()

import { createServer } from './server'
import { PrismaClient } from '@setlist/database'
import { JobScheduler } from './lib/scheduler'
import { SetlistFmClient } from './lib/setlistfm'
import { SpotifyClient } from './lib/spotify'

let scheduler: JobScheduler | null = null

const start = async () => {
  try {
    const server = await createServer()
    
    const port = process.env.PORT || 4000
    const host = process.env.HOST || '0.0.0.0'
    
    await server.listen({ port: Number(port), host })
    
    console.log(`🚀 Server ready at http://${host}:${port}`)
    console.log(`📊 GraphQL playground at http://${host}:${port}/graphql`)
    
    // Start background job scheduler
    if (process.env.ENABLE_JOBS === 'true') {
      const prisma = new PrismaClient()
      const setlistFm = new SetlistFmClient(process.env.SETLISTFM_API_KEY!)
      const spotify = new SpotifyClient(
        process.env.SPOTIFY_CLIENT_ID!,
        process.env.SPOTIFY_CLIENT_SECRET!
      )
      
      scheduler = new JobScheduler(prisma, setlistFm, spotify)
      scheduler.start()
      console.log(`⏰ Job scheduler started`)
    }
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server')
  if (scheduler) {
    scheduler.stop()
  }
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server')
  if (scheduler) {
    scheduler.stop()
  }
  process.exit(0)
})

start()