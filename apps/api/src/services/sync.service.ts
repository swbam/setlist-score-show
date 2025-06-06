// src/services/sync.service.ts
import { PrismaClient } from '@setlist/database'
import Redis from 'ioredis'
import { SupabaseClient } from '@supabase/supabase-js'
import pLimit from 'p-limit'
import { SetlistFmClient } from '../lib/setlistfm'
// import { SpotifyClient } from '../lib/spotify' // No longer directly using SpotifyClient type here
import { SpotifyService } from '../lib/spotify' // Import SpotifyService
import { TicketmasterClient } from '../lib/ticketmaster'

export interface SyncOptions {
  artistIds?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  forceUpdate?: boolean
}

export class SyncService {
  private limit = pLimit(3) // Max 3 concurrent API calls
  
  constructor(
    private prisma: PrismaClient,
    private redis: Redis,
    private supabase: SupabaseClient,
    private setlistFm: SetlistFmClient,
    private spotify: SpotifyService, // Changed type to SpotifyService
    private ticketmaster: TicketmasterClient
  ) {}

  async syncArtistCatalog(artistId: string) {
    const cacheKey = `sync:artist:${artistId}:catalog`
    const cached = await this.redis.get(cacheKey)
    
    if (cached && !this.isStale(cached)) {
      return JSON.parse(cached)
    }

    const artist = await this.prisma.artist.findUnique({
      where: { id: artistId }
    })

    if (!artist?.spotifyId) {
      throw new Error('Artist missing Spotify ID')
    }

    // Sync history entry
    const syncEntry = await this.prisma.syncHistory.create({
      data: {
        syncType: 'spotify',
        entityType: 'artist',
        entityId: artistId,
        status: 'started'
      }
    })

    try {
      // Get all albums
      const albums = await this.spotify.getArtistAlbums(artist.spotifyId)
      
      // Get tracks for each album
      const allTracks = await Promise.all(
        albums.map((album) => 
          this.limit(() => this.spotify.getAlbumTracks(album.id))
        )
      )

      const tracks = allTracks.flat()
      let processedCount = 0

      // Upsert songs
      for (const track of tracks) {
        await this.prisma.song.upsert({
          where: {
            spotifyId: track.id
          },
          create: {
            spotifyId: track.id,
            artistId: artistId,
            title: track.name,
            album: track.album.name,
            albumImageUrl: track.album.images[0]?.url,
            durationMs: track.duration_ms,
            popularity: track.popularity,
            previewUrl: track.preview_url,
            spotifyUrl: track.external_urls.spotify
          },
          update: {
            popularity: track.popularity,
            previewUrl: track.preview_url
          }
        })
        processedCount++
      }

      // Update sync history
      await this.prisma.syncHistory.update({
        where: { id: syncEntry.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          itemsProcessed: processedCount
        }
      })

      // Cache result
      const result = { success: true, songsProcessed: processedCount }
      await this.redis.setex(cacheKey, 3600, JSON.stringify(result)) // 1 hour cache

      return result
    } catch (error) {
      await this.prisma.syncHistory.update({
        where: { id: syncEntry.id },
        data: {
          status: 'failed',
          errorMessage: error.message,
          completedAt: new Date()
        }
      })
      throw error
    }
  }

  async syncUpcomingShows(options: SyncOptions = {}) {
    const { artistIds, dateRange, forceUpdate } = options
    
    // Default to next 90 days
    const startDate = dateRange?.start || new Date()
    const endDate = dateRange?.end || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)

    // Get artists to sync
    const artists = await this.prisma.artist.findMany({
      where: artistIds ? { id: { in: artistIds } } : undefined
    })

    const results = []

    for (const artist of artists) {
      try {
        // Check if we should skip based on last sync
        if (!forceUpdate) {
          const lastSync = await this.prisma.syncHistory.findFirst({
            where: {
              entityId: artist.id,
              syncType: 'ticketmaster',
              status: 'completed',
              completedAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours
              }
            }
          })
          
          if (lastSync) {
            console.log(`Skipping ${artist.name} - synced recently`)
            continue
          }
        }

        // Sync from Ticketmaster
        if (artist.ticketmasterId) {
          const shows = await this.ticketmaster.getArtistEvents(
            artist.ticketmasterId,
            { startDate, endDate }
          )

          for (const show of shows) {
            await this.upsertShow(artist.id, show)
          }

          results.push({
            artistId: artist.id,
            source: 'ticketmaster',
            showsFound: shows.length
          })
        }

        // Also check Setlist.fm for recent shows
        if (artist.setlistfmMbid) {
          const setlists = await this.setlistFm.getArtistSetlists(
            artist.setlistfmMbid
          )

          // Filter to upcoming shows only
          const upcomingSetlists = setlists.filter(s => 
            new Date(s.eventDate) >= startDate &&
            new Date(s.eventDate) <= endDate
          )

          for (const setlist of upcomingSetlists) {
            await this.upsertShowFromSetlist(artist.id, setlist)
          }

          results.push({
            artistId: artist.id,
            source: 'setlistfm',
            showsFound: upcomingSetlists.length
          })
        }

      } catch (error) {
        console.error(`Failed to sync shows for ${artist.name}:`, error)
        results.push({
          artistId: artist.id,
          error: error.message
        })
      }
    }

    // Broadcast sync complete
    await this.supabase.channel('admin')
      .send({
        type: 'broadcast',
        event: 'sync_complete',
        payload: {
          type: 'shows',
          results,
          timestamp: new Date().toISOString()
        }
      })

    return results
  }

  private async upsertShow(artistId: string, showData: any) {
    // Upsert venue first
    const venue = await this.prisma.venue.upsert({
      where: {
        ticketmasterId: showData.venue.id
      },
      create: {
        ticketmasterId: showData.venue.id,
        name: showData.venue.name,
        address: showData.venue.address?.line1,
        city: showData.venue.city.name,
        state: showData.venue.state?.name,
        country: showData.venue.country.name,
        postalCode: showData.venue.postalCode,
        latitude: showData.venue.location?.latitude,
        longitude: showData.venue.location?.longitude,
        timezone: showData.venue.timezone
      },
      update: {}
    })

    // Upsert show
    const show = await this.prisma.show.upsert({
      where: {
        ticketmasterId: showData.id
      },
      create: {
        ticketmasterId: showData.id,
        artistId: artistId,
        venueId: venue.id,
        date: new Date(showData.dates.start.localDate),
        startTime: showData.dates.start.localTime,
        title: showData.name,
        status: 'upcoming',
        ticketmasterUrl: showData.url
      },
      update: {
        status: 'upcoming',
        ticketmasterUrl: showData.url
      }
    })

    // Create default setlist
    await this.prisma.setlist.upsert({
      where: {
        showId_orderIndex: {
          showId: show.id,
          orderIndex: 0
        }
      },
      create: {
        showId: show.id,
        name: 'Main Set',
        orderIndex: 0
      },
      update: {}
    })

    return show
  }

  private async upsertShowFromSetlist(artistId: string, setlistData: any) {
    // Similar to upsertShow but for Setlist.fm data
    const venue = await this.prisma.venue.upsert({
      where: {
        setlistfmId: setlistData.venue.id
      },
      create: {
        setlistfmId: setlistData.venue.id,
        name: setlistData.venue.name,
        city: setlistData.venue.city.name,
        state: setlistData.venue.city.state,
        country: setlistData.venue.city.country.name,
        latitude: setlistData.venue.city.coords?.lat,
        longitude: setlistData.venue.city.coords?.long
      },
      update: {}
    })

    const show = await this.prisma.show.upsert({
      where: {
        artistId_venueId_date: {
          artistId: artistId,
          venueId: venue.id,
          date: new Date(setlistData.eventDate)
        }
      },
      create: {
        artistId: artistId,
        venueId: venue.id,
        setlistfmId: setlistData.id,
        date: new Date(setlistData.eventDate),
        title: setlistData.tour?.name || `${setlistData.artist.name} at ${venue.name}`,
        tourName: setlistData.tour?.name,
        status: new Date(setlistData.eventDate) > new Date() ? 'upcoming' : 'completed'
      },
      update: {}
    })

    return show
  }

  private isStale(cachedData: string): boolean {
    try {
      const parsed = JSON.parse(cachedData)
      if (parsed._cacheTime) {
        const cacheAge = Date.now() - parsed._cacheTime
        return cacheAge > 3600000 // 1 hour
      }
      return true
    } catch {
      return true
    }
  }

  async calculateTrendingScores() {
    console.log('Calculating trending scores...')
    
    // Refresh the materialized view
    await this.prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY trending_shows`
    
    // Get top trending shows
    const trending = await this.prisma.$queryRaw`
      SELECT 
        ts.*,
        a.name as artist_name,
        a.image_url as artist_image,
        v.name as venue_name,
        v.city as venue_city
      FROM trending_shows ts
      JOIN shows s ON ts.show_id = s.id
      JOIN artists a ON s.artist_id = a.id
      JOIN venues v ON s.venue_id = v.id
      ORDER BY ts.trending_score DESC
      LIMIT 20
    `

    // Cache trending shows
    await this.redis.setex(
      'trending:shows',
      300, // 5 minutes
      JSON.stringify(trending)
    )

    return trending
  }
}