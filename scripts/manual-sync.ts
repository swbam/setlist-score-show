#!/usr/bin/env tsx
/**
 * Manual sync script for TheSet platform
 * Alternative to Edge Functions for data synchronization
 */

import { PrismaClient } from '@setlist/database'
import { SpotifySyncJob } from '../apps/api/src/jobs/sync-spotify'
import { SyncService } from '../apps/api/src/services/sync.service'
import { createClient } from '@supabase/supabase-js'
import Redis from 'ioredis'
import { SetlistFmClient } from '../apps/api/src/lib/setlistfm'
import { SpotifyService } from '../apps/api/src/lib/spotify'
import { TicketmasterClient } from '../apps/api/src/lib/ticketmaster'

// Load environment variables
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

async function main() {
  console.log('🚀 Starting manual sync for TheSet...')
  
  // Check required environment variables
  const requiredVars = [
    'DATABASE_URL',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SPOTIFY_CLIENT_ID',
    'SPOTIFY_CLIENT_SECRET'
  ]
  
  const missing = requiredVars.filter(v => !process.env[v])
  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing)
    process.exit(1)
  }

  // Initialize clients
  const prisma = new PrismaClient()
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // 1. Test database connectivity
    console.log('📊 Testing database connection...')
    const artistCount = await prisma.artist.count()
    console.log(`✅ Connected to database. Found ${artistCount} artists.`)

    // 2. Run sample data population if needed
    if (artistCount === 0) {
      console.log('📝 No artists found. Populating sample data...')
      const { data, error } = await supabase.rpc('populate_sample_data')
      if (error) {
        console.error('❌ Failed to populate sample data:', error)
      } else {
        console.log('✅ Sample data populated:', data)
      }
    }

    // 3. Sync artist data if Spotify credentials are available
    if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
      console.log('🎵 Starting Spotify sync...')
      const spotifyJob = new SpotifySyncJob(
        prisma,
        process.env.SPOTIFY_CLIENT_ID,
        process.env.SPOTIFY_CLIENT_SECRET
      )
      
      try {
        // Get artists that need syncing (those with Spotify IDs but few songs)
        const artistsToSync = await prisma.artist.findMany({
          where: {
            spotifyId: { not: null }
          },
          include: {
            songs: true
          }
        })

        const needSync = artistsToSync.filter(a => a.songs.length < 5)
        
        if (needSync.length > 0) {
          console.log(`🎵 Syncing ${needSync.length} artists with Spotify...`)
          const result = await spotifyJob.syncArtistCatalogs(needSync.map(a => a.id))
          console.log(`✅ Spotify sync complete: ${result.successful} successful, ${result.failed} failed`)
        } else {
          console.log('ℹ️  All artists already have sufficient songs')
        }
      } catch (error) {
        console.error('❌ Spotify sync failed:', error.message)
      }
    } else {
      console.log('⚠️  Spotify credentials not found. Skipping Spotify sync.')
    }

    // 4. Sync shows if Ticketmaster is available
    if (process.env.TICKETMASTER_API_KEY) {
      console.log('🎪 Starting show sync...')
      try {
        const spotify = new SpotifyService(
          process.env.SPOTIFY_CLIENT_ID!,
          process.env.SPOTIFY_CLIENT_SECRET!
        )
        const setlistFm = new SetlistFmClient(process.env.SETLIST_FM_API_KEY!)
        const ticketmaster = new TicketmasterClient(process.env.TICKETMASTER_API_KEY!)
        
        const syncService = new SyncService(
          prisma,
          redis,
          supabase,
          setlistFm,
          spotify,
          ticketmaster
        )

        const results = await syncService.syncUpcomingShows()
        console.log(`✅ Show sync complete. Processed ${results.length} artists.`)
      } catch (error) {
        console.error('❌ Show sync failed:', error.message)
      }
    } else {
      console.log('⚠️  Ticketmaster API key not found. Skipping show sync.')
    }

    // 5. Calculate trending scores
    console.log('📈 Calculating trending scores...')
    try {
      const { data, error } = await supabase.rpc('refresh_trending_shows')
      if (error) {
        console.error('❌ Failed to refresh trending scores:', error)
      } else {
        console.log('✅ Trending scores updated')
      }
    } catch (error) {
      console.error('❌ Trending calculation failed:', error.message)
    }

    // 6. Test RPC functions
    console.log('🔧 Testing RPC functions...')
    try {
      const { data: artists, error: artistError } = await supabase.rpc('get_trending_artists', { p_limit: 5 })
      const { data: shows, error: showError } = await supabase.rpc('get_top_shows', { p_limit: 5 })
      
      if (artistError) {
        console.error('❌ get_trending_artists failed:', artistError)
      } else {
        console.log(`✅ get_trending_artists returned ${artists?.length || 0} artists`)
      }
      
      if (showError) {
        console.error('❌ get_top_shows failed:', showError)
      } else {
        console.log(`✅ get_top_shows returned ${shows?.length || 0} shows`)
      }
    } catch (error) {
      console.error('❌ RPC function test failed:', error.message)
    }

    console.log('\n🎉 Manual sync completed successfully!')
    
  } catch (error) {
    console.error('💥 Sync failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
    redis.disconnect()
  }
}

if (require.main === module) {
  main()
}