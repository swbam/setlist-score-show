import { PrismaClient } from '@setlist/database'
import { TicketmasterClient } from '../lib/ticketmaster'
import { SpotifyClient } from '../lib/spotify'
import { SetlistService } from './setlist.service'
import { logger } from '../lib/logger'

export class ShowImportService {
  private setlistService: SetlistService

  constructor(
    private prisma: PrismaClient,
    private ticketmaster: TicketmasterClient,
    private spotify: SpotifyClient
  ) {
    this.setlistService = new SetlistService(prisma)
  }

  /**
   * Imports trending shows from Ticketmaster
   */
  async importTrendingShows(options: {
    daysAhead?: number
    maxShows?: number
    cities?: string[]
  } = {}): Promise<void> {
    const { daysAhead = 90, maxShows = 100, cities = [] } = options

    try {
      logger.info('Starting trending shows import')

      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + daysAhead)

      // Search for music events
      const searchParams = {
        startDate,
        endDate,
        size: maxShows,
        includeTest: false
      }

      // If specific cities are provided, search each one
      const searchPromises = cities.length > 0 
        ? cities.map(city => this.ticketmaster.searchEvents({ ...searchParams, city }))
        : [this.ticketmaster.searchEvents(searchParams)]

      const eventResults = await Promise.all(searchPromises)
      const allEvents = eventResults.flat()

      logger.info(`Found ${allEvents.length} events from Ticketmaster`)

      // Process each event
      let importedCount = 0
      for (const event of allEvents) {
        try {
          const imported = await this.importSingleShow(event)
          if (imported) importedCount++
        } catch (error) {
          logger.error(`Failed to import event ${event.id}:`, error)
        }
      }

      logger.info(`Successfully imported ${importedCount} shows`)
    } catch (error) {
      logger.error('Failed to import trending shows:', error)
      throw error
    }
  }

  /**
   * Imports a single show from Ticketmaster event data
   */
  private async importSingleShow(event: any): Promise<boolean> {
    try {
      // Parse the event data
      const parsedEvent = this.ticketmaster.parseEvent(event)
      
      // Skip if no artist information
      if (!parsedEvent.artist) {
        logger.debug(`Skipping event ${event.id} - no artist information`)
        return false
      }

      // Check if show already exists
      const existingShow = await this.prisma.show.findFirst({
        where: { ticketmasterId: parsedEvent.ticketmaster_id }
      })

      if (existingShow) {
        logger.debug(`Show ${parsedEvent.ticketmaster_id} already exists`)
        return false
      }

      // Find or create artist
      const artist = await this.findOrCreateArtist(parsedEvent.artist)
      if (!artist) {
        logger.debug(`Could not find/create artist for event ${event.id}`)
        return false
      }

      // Find or create venue
      const venue = await this.findOrCreateVenue(parsedEvent.venue)
      if (!venue) {
        logger.debug(`Could not find/create venue for event ${event.id}`)
        return false
      }

      // Create the show
      const show = await this.prisma.show.create({
        data: {
          artistId: artist.id,
          venueId: venue.id,
          ticketmasterId: parsedEvent.ticketmaster_id,
          date: new Date(parsedEvent.date),
          startTime: parsedEvent.time ? new Date(`1970-01-01T${parsedEvent.time}`) : null,
          title: parsedEvent.name,
          status: 'upcoming',
          ticketmasterUrl: parsedEvent.url,
          viewCount: 0
        }
      })

      // Create initial setlist for the show
      await this.setlistService.createInitialSetlist(show.id, artist.id)

      logger.info(`Imported show: ${artist.name} at ${venue.name} on ${parsedEvent.date}`)
      return true
    } catch (error) {
      logger.error(`Failed to import single show:`, error)
      return false
    }
  }

  /**
   * Finds existing artist or creates new one with Spotify data
   */
  private async findOrCreateArtist(artistData: any): Promise<any> {
    try {
      // First try to find by Ticketmaster ID
      let artist = await this.prisma.artist.findFirst({
        where: { ticketmasterId: artistData.ticketmaster_id }
      })

      if (artist) return artist

      // Try to find by name
      artist = await this.prisma.artist.findFirst({
        where: { 
          name: {
            equals: artistData.name,
            mode: 'insensitive'
          }
        }
      })

      if (artist) {
        // Update with Ticketmaster ID
        return this.prisma.artist.update({
          where: { id: artist.id },
          data: { ticketmasterId: artistData.ticketmaster_id }
        })
      }

      // Search Spotify for artist data
      const spotifyArtist = await this.spotify.searchArtist(artistData.name)
      
      // Create new artist
      const newArtistData = {
        name: artistData.name,
        slug: this.generateSlug(artistData.name),
        ticketmasterId: artistData.ticketmaster_id,
        spotifyId: spotifyArtist?.id,
        imageUrl: spotifyArtist?.images?.[0]?.url,
        genres: spotifyArtist?.genres || [],
        popularity: spotifyArtist?.popularity || 0,
        followers: spotifyArtist?.followers?.total || 0
      }

      artist = await this.prisma.artist.create({ data: newArtistData })

      // Import artist's song catalog if we have Spotify data
      if (spotifyArtist?.id) {
        await this.importArtistCatalog(artist.id, spotifyArtist.id)
      }

      return artist
    } catch (error) {
      logger.error(`Failed to find/create artist:`, error)
      return null
    }
  }

  /**
   * Finds existing venue or creates new one
   */
  private async findOrCreateVenue(venueData: any): Promise<any> {
    try {
      // Try to find by Ticketmaster ID
      let venue = await this.prisma.venue.findFirst({
        where: { ticketmasterId: venueData.ticketmaster_id }
      })

      if (venue) return venue

      // Try to find by name and city
      venue = await this.prisma.venue.findFirst({
        where: {
          name: {
            equals: venueData.name,
            mode: 'insensitive'
          },
          city: {
            equals: venueData.city,
            mode: 'insensitive'
          }
        }
      })

      if (venue) {
        // Update with Ticketmaster ID
        return this.prisma.venue.update({
          where: { id: venue.id },
          data: { ticketmasterId: venueData.ticketmaster_id }
        })
      }

      // Create new venue
      return this.prisma.venue.create({
        data: {
          ticketmasterId: venueData.ticketmaster_id,
          name: venueData.name,
          address: venueData.address,
          city: venueData.city,
          state: venueData.state,
          country: venueData.country,
          postalCode: venueData.postal_code,
          latitude: venueData.latitude,
          longitude: venueData.longitude,
          timezone: venueData.timezone
        }
      })
    } catch (error) {
      logger.error(`Failed to find/create venue:`, error)
      return null
    }
  }

  /**
   * Imports an artist's song catalog from Spotify
   */
  private async importArtistCatalog(artistId: string, spotifyId: string): Promise<void> {
    try {
      logger.info(`Importing catalog for artist ${artistId} from Spotify ${spotifyId}`)

      const catalog = await this.spotify.getArtistCatalog(spotifyId)
      
      // Import songs
      for (const track of catalog.tracks) {
        try {
          await this.prisma.song.upsert({
            where: {
              artistId_title_album: {
                artistId,
                title: track.name,
                album: track.album.name
              }
            },
            update: {
              spotifyId: track.id,
              durationMs: track.duration_ms,
              popularity: track.popularity,
              previewUrl: track.preview_url,
              spotifyUrl: track.external_urls.spotify,
              albumImageUrl: track.album.images?.[0]?.url
            },
            create: {
              artistId,
              spotifyId: track.id,
              title: track.name,
              album: track.album.name,
              albumImageUrl: track.album.images?.[0]?.url,
              durationMs: track.duration_ms,
              popularity: track.popularity,
              previewUrl: track.preview_url,
              spotifyUrl: track.external_urls.spotify
            }
          })
        } catch (error) {
          logger.error(`Failed to import song ${track.name}:`, error)
        }
      }

      logger.info(`Imported ${catalog.tracks.length} songs for artist ${artistId}`)
    } catch (error) {
      logger.error(`Failed to import artist catalog:`, error)
    }
  }

  /**
   * Updates show statuses based on dates
   */
  async updateShowStatuses(): Promise<void> {
    try {
      const now = new Date()
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)

      // Mark past shows as completed
      await this.prisma.show.updateMany({
        where: {
          date: { lt: yesterday },
          status: 'upcoming'
        },
        data: { status: 'completed' }
      })

      logger.info('Updated show statuses')
    } catch (error) {
      logger.error('Failed to update show statuses:', error)
    }
  }

  /**
   * Generates a URL-friendly slug from artist name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  /**
   * Gets import statistics
   */
  async getImportStats(): Promise<{
    totalShows: number
    upcomingShows: number
    completedShows: number
    totalArtists: number
    totalVenues: number
    recentImports: number
  }> {
    const [
      totalShows,
      upcomingShows,
      completedShows,
      totalArtists,
      totalVenues,
      recentImports
    ] = await Promise.all([
      this.prisma.show.count(),
      this.prisma.show.count({ where: { status: 'upcoming' } }),
      this.prisma.show.count({ where: { status: 'completed' } }),
      this.prisma.artist.count(),
      this.prisma.venue.count(),
      this.prisma.show.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })
    ])

    return {
      totalShows,
      upcomingShows,
      completedShows,
      totalArtists,
      totalVenues,
      recentImports
    }
  }
}