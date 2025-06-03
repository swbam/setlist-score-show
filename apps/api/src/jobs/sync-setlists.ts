// src/jobs/sync-setlists.ts
import { PrismaClient } from '@setlist/database'
import pLimit from 'p-limit'
import { SetlistFmClient } from '../lib/setlistfm'
import { SpotifyClient } from '../lib/spotify'

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

  private async syncArtistShows(artist: any, date: string) {
    try {
      const setlists = await this.setlistFm.getArtistSetlists(
        artist.setlistfmMbid,
        date
      )

      for (const setlist of setlists) {
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
}