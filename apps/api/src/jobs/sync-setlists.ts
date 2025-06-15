// src/jobs/sync-setlists.ts
import { PrismaClient } from '@setlist/database'
import pLimit from 'p-limit'
import { SetlistFmClient } from '../lib/setlistfm'
import { SpotifyClient } from '../lib/spotify'
import 'dotenv/config'

export class SetlistSyncJob {
  private limit = pLimit(3) // Max 3 concurrent API calls
  
  constructor(
    private prisma: PrismaClient,
    private setlistFm: SetlistFmClient,
    private spotify: SpotifyClient
  ) {}

  async syncYesterdaysShows() {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const dateStr = yesterday.toISOString().split('T')[0]
    
    console.log(`Starting sync for ${dateStr}`)
    
    // Get all tracked artists
    const artists = await this.prisma.artist.findMany({
      where: {
        setlistfmMbid: { not: null }
      }
    })

    // Sync each artist's shows
    const results = await Promise.allSettled(
      artists.map((artist) => 
        this.limit(() => this.syncArtistShows(artist, dateStr))
      )
    )

    // Log results
    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length
    
    console.log(`Sync complete: ${successful} successful, ${failed} failed`)
  }

  async syncRecentShows() {
    // Sync shows from the last month only
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    
    console.log(`Starting sync for shows from last month: ${oneMonthAgo.toISOString().split('T')[0]} onwards`)
    
    // Get all tracked artists
    const artists = await this.prisma.artist.findMany({
      where: {
        setlistfmMbid: { not: null }
      }
    })

    // Sync each artist's shows for the last month
    const results = await Promise.allSettled(
      artists.map((artist) => 
        this.limit(() => this.syncArtistShowsInDateRange(artist, oneMonthAgo, new Date()))
      )
    )

    // Log results
    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length
    
    console.log(`Recent shows sync complete: ${successful} successful, ${failed} failed`)
  }

  private async syncArtistShowsInDateRange(artist: any, startDate: Date, endDate: Date) {
    try {
      console.log(`Syncing shows for ${artist.name} from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`)
      
      // Get setlists for this artist in the date range
      const setlists = await this.setlistFm.getArtistSetlists(artist.setlistfmMbid)
      
      // Filter setlists to the date range
      const relevantSetlists = setlists.filter(setlist => {
        const showDate = new Date(setlist.eventDate)
        return showDate >= startDate && showDate <= endDate
      })

      console.log(`Found ${relevantSetlists.length} setlists for ${artist.name} in date range`)

      for (const setlist of relevantSetlists) {
        await this.processSetlist(artist, setlist)
      }
    } catch (error) {
      console.error(`Failed to sync shows for ${artist.name}:`, error)
      
      await this.prisma.syncHistory.create({
        data: {
          syncType: 'setlistfm',
          entityType: 'artist',
          entityId: artist.id,
          status: 'failed',
          errorMessage: error.message
        }
      })
      
      throw error
    }
  }

  private async syncArtistShows(artist: any, date: string) {
    try {
      const setlists = await this.setlistFm.getArtistSetlists(
        artist.setlistfmMbid,
        date
      )

      for (const setlist of setlists) {
        await this.processSetlist(artist, setlist)
      }
    } catch (error) {
      console.error(`Failed to sync artist ${artist.name}:`, error)
      
      await this.prisma.syncHistory.create({
        data: {
          syncType: 'setlistfm',
          entityType: 'artist',
          entityId: artist.id,
          status: 'failed',
          errorMessage: error.message
        }
      })
      
      throw error
    }
  }

  private async processSetlist(artist: any, setlist: any) {
    await this.prisma.$transaction(async (tx) => {
      // Upsert venue
      const venue = await tx.venue.upsert({
        where: {
          setlistfmId: setlist.venue.id
        },
        create: {
          setlistfmId: setlist.venue.id,
          name: setlist.venue.name,
          city: setlist.venue.city.name,
          state: setlist.venue.city.state,
          country: setlist.venue.city.country.name,
          latitude: setlist.venue.city.coords?.lat,
          longitude: setlist.venue.city.coords?.long
        },
        update: {}
      })

      // Create show
      const show = await tx.show.create({
        data: {
          artistId: artist.id,
          venueId: venue.id,
          setlistfmId: setlist.id,
          date: new Date(setlist.eventDate),
          title: setlist.tour?.name || `${artist.name} at ${venue.name}`,
          tourName: setlist.tour?.name,
          status: 'completed'
        }
      })

      // Create setlist and songs
      const mainSetlist = await tx.setlist.create({
        data: {
          showId: show.id,
          name: 'Main Set',
          orderIndex: 0
        }
      })

      // Process songs
      let position = 1
      for (const set of setlist.sets.set) {
        for (const song of set.song) {
          // Try to match with existing song
          let dbSong = await tx.song.findFirst({
            where: {
              artistId: artist.id,
              title: {
                equals: song.name,
                mode: 'insensitive'
              }
            }
          })

          // If not found, try Spotify search
          if (!dbSong && artist.spotifyId) {
            const spotifyTrack = await this.spotify.searchTrack(
              song.name,
              artist.name
            )
            
            if (spotifyTrack) {
              dbSong = await tx.song.create({
                data: {
                  artistId: artist.id,
                  spotifyId: spotifyTrack.id,
                  title: spotifyTrack.name,
                  album: spotifyTrack.album.name,
                  albumImageUrl: spotifyTrack.album.images[0]?.url,
                  durationMs: spotifyTrack.duration_ms,
                  popularity: spotifyTrack.popularity,
                  previewUrl: spotifyTrack.preview_url,
                  spotifyUrl: spotifyTrack.external_urls.spotify
                }
              })
            }
          }

          // Create as unmatched song if still not found
          if (!dbSong) {
            dbSong = await tx.song.create({
              data: {
                artistId: artist.id,
                title: song.name,
                album: 'Unknown'
              }
            })
          }

          // Add to setlist
          await tx.setlistSong.create({
            data: {
              setlistId: mainSetlist.id,
              songId: dbSong.id,
              position: position++
            }
          })
        }
      }

      // Log sync
      await tx.syncHistory.create({
        data: {
          syncType: 'setlistfm',
          entityType: 'setlist',
          entityId: show.id,
          externalId: setlist.id,
          status: 'completed',
          itemsProcessed: position - 1
        }
      })
    })
  }
}

// Main execution when run directly
async function main() {
  const { PrismaClient } = await import('@setlist/database')
  const { SetlistFmClient } = await import('../lib/setlistfm')
  const { SpotifyClient } = await import('../lib/spotify')
  
  const prisma = new PrismaClient()
  const setlistFm = new SetlistFmClient(process.env.SETLISTFM_API_KEY!)
  const spotify = new SpotifyClient(
    process.env.SPOTIFY_CLIENT_ID!,
    process.env.SPOTIFY_CLIENT_SECRET!
  )
  
  const job = new SetlistSyncJob(prisma, setlistFm, spotify)
  
  try {
    console.log('Starting setlist sync job...')
    await job.syncRecentShows()
    console.log('Setlist sync completed successfully')
  } catch (error) {
    console.error('Setlist sync failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error)
}