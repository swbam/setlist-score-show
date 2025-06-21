import { IResolvers } from '@graphql-tools/utils'
import { GraphQLError } from 'graphql'
import { Prisma } from '@prisma/client'

export const artistResolvers: IResolvers = {
  Query: {
    artist: async (_parent, { id, slug }, { prisma, loaders }) => {
      if (!id && !slug) {
        throw new GraphQLError('Must provide either id or slug', {
          extensions: { code: 'BAD_REQUEST' },
        })
      }

      const where: Prisma.ArtistWhereUniqueInput = id 
        ? { id } 
        : { slug: slug! }

      const artist = await prisma.artist.findUnique({ where })
      
      if (!artist) {
        throw new GraphQLError('Artist not found', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      return artist
    },

    artistBySlug: async (_parent, { slug }, { prisma, spotify, ticketmaster, setlistfm }) => {
      // First try to find artist in database
      let artist = await prisma.artist.findUnique({
        where: { slug }
      })
      
      // If artist exists, check if we need to import songs or sync shows
      if (artist) {
        // Check if we need to import songs
        const songCount = await prisma.song.count({
          where: { artistId: artist.id }
        })
        
        if (songCount === 0 && artist.spotifyId && spotify) {
          console.log(`🎵 No songs found for ${artist.name}, importing from Spotify...`)
          try {
            await importArtistSongCatalog(prisma, spotify, artist.id, artist.spotifyId)
          } catch (error) {
            console.error(`Failed to import songs:`, error)
          }
        }
        
        // Check if we need to sync shows
        if (artist.ticketmasterId && ticketmaster) {
          const showCount = await prisma.show.count({
            where: { artistId: artist.id }
          })
          
          if (showCount === 0) {
            console.log(`🎫 No shows found for ${artist.name}, syncing from Ticketmaster...`)
            try {
              await syncTicketmasterShows(artist.id, artist.ticketmasterId, { prisma, ticketmaster })
            } catch (error) {
              console.error(`Failed to sync shows:`, error)
            }
          }
        }
      }

      // If artist not found and it looks like a slug we might have seen in search,
      // try to import from Spotify
      if (!artist && slug) {
        try {
          console.log(`🔍 Artist "${slug}" not found in DB, searching Spotify...`)
          
          // Convert slug back to search query
          const searchQuery = slug.replace(/-/g, ' ')
          const spotifyResults = await spotify.searchArtists(searchQuery, { limit: 1 })
          
          if (spotifyResults.body.artists.items.length > 0) {
            const spotifyArtist = spotifyResults.body.artists.items[0]
            const artistSlug = spotifyArtist.name.toLowerCase()
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .trim()

            // Only import if the slug matches (exact match)
            if (artistSlug === slug) {
              // Import artist and their song catalog
              artist = await prisma.artist.create({
                data: {
                  spotifyId: spotifyArtist.id,
                  name: spotifyArtist.name,
                  slug: artistSlug,
                  imageUrl: spotifyArtist.images[0]?.url || null,
                  genres: spotifyArtist.genres,
                  popularity: spotifyArtist.popularity || 0,
                  followers: spotifyArtist.followers?.total || 0,
                  lastSyncedAt: new Date(),
                }
              })

              console.log(`✅ Imported artist: ${spotifyArtist.name}`)

              // Import song catalog from Spotify
              await importArtistSongCatalog(prisma, spotify, artist.id, spotifyArtist.id)

              // Try to get other external IDs and sync shows
              if (!artist.ticketmasterId && ticketmaster) {
                try {
                  const tmArtists = await ticketmaster.searchArtists(spotifyArtist.name)
                  if (tmArtists.length > 0) {
                    const bestMatch = tmArtists.find((tm: any) => 
                      tm.name.toLowerCase() === spotifyArtist.name.toLowerCase()
                    ) || tmArtists[0]
                    
                    await prisma.artist.update({
                      where: { id: artist.id },
                      data: { ticketmasterId: bestMatch.id }
                    })
                    
                    // Sync shows from Ticketmaster
                    await syncTicketmasterShows(artist.id, bestMatch.id, { prisma, ticketmaster })
                  }
                } catch (error) {
                  console.error('Error getting Ticketmaster data:', error)
                }
              }
              
              if (!artist.setlistfmMbid && setlistfm) {
                try {
                  const sfResults = await setlistfm.searchArtists(spotifyArtist.name)
                  if (sfResults.artists.length > 0) {
                    const bestMatch = sfResults.artists.find((sf: any) => 
                      sf.name.toLowerCase() === spotifyArtist.name.toLowerCase()
                    ) || sfResults.artists[0]
                    
                    await prisma.artist.update({
                      where: { id: artist.id },
                      data: { setlistfmMbid: bestMatch.mbid }
                    })
                  }
                } catch (error) {
                  console.error('Error getting Setlist.fm data:', error)
                }
              }

              // Refetch artist
              artist = await prisma.artist.findUnique({
                where: { id: artist.id }
              })
            }
          }
        } catch (error) {
          console.error(`❌ Error importing artist for slug "${slug}":`, error)
        }
      }

      if (!artist) {
        throw new GraphQLError('Artist not found', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      return artist
    },

    artists: async (_parent, { filter, orderBy, limit = 20, offset = 0, search }, { prisma }) => {
      const where: Prisma.ArtistWhereInput = {}

      if (filter?.search || search) {
        const searchTerm = filter?.search || search
        where.OR = [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { genres: { hasSome: [searchTerm] } },
        ]
      }

      if (filter?.genres && filter.genres.length > 0) {
        where.genres = { hasSome: filter.genres }
      }

      if (filter?.hasUpcomingShows) {
        where.shows = {
          some: {
            status: 'upcoming',
            date: { gte: new Date() },
          },
        }
      }

      if (filter?.minFollowers) {
        where.followers = { gte: filter.minFollowers }
      }

      const orderByMap: Record<string, Prisma.ArtistOrderByWithRelationInput> = {
        NAME_ASC: { name: 'asc' },
        NAME_DESC: { name: 'desc' },
        POPULARITY_ASC: { popularity: 'asc' },
        POPULARITY_DESC: { popularity: 'desc' },
        FOLLOWERS_ASC: { followers: 'asc' },
        FOLLOWERS_DESC: { followers: 'desc' },
        RECENTLY_SYNCED: { lastSyncedAt: 'desc' },
      }

      const artists = await prisma.artist.findMany({
        where,
        orderBy: orderByMap[orderBy || 'POPULARITY_DESC'],
        take: limit,
        skip: offset,
      })

      return artists
    },

    searchArtists: async (_parent, { query, limit = 10 }, { ticketmaster }) => {
      if (!ticketmaster) {
        throw new GraphQLError('Ticketmaster service unavailable', {
          extensions: { code: 'SERVICE_UNAVAILABLE' },
        })
      }

      try {
        // Search Ticketmaster API directly
        const tmResults = await ticketmaster.searchArtists(query, { limit })
        
        // Extract unique artist names from TM results
        const uniqueArtists = [...new Set(tmResults.map(event => event._embedded.attractions[0].name))]
          .slice(0, limit)
        
        // Return simplified artist objects
        return uniqueArtists.map(name => ({
          id: `tm-${String(name).toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          name,
          slug: String(name).toLowerCase().replace(/[^a-z0-9]/g, '-'),
          imageUrl: null, // Would need to fetch from TM images
          popularity: 0, // Would need to calculate
          followers: 0,
          lastSyncedAt: new Date(),
        }))
      } catch (error) {
        console.error('Ticketmaster search error:', error)
        return []
      }
    },

    trendingArtists: async (_parent, { limit = 10 }, { prisma }) => {
      // Get artists with the most recent show activity and votes
      const trendingArtists = await prisma.$queryRaw`
        SELECT a.*, 
               COUNT(DISTINCT s.id) as recent_shows,
               COALESCE(SUM(ss."voteCount"), 0) as total_votes
        FROM artists a
        JOIN shows s ON s."artistId" = a.id
        LEFT JOIN setlists sl ON sl."showId" = s.id
        LEFT JOIN "setlistSongs" ss ON ss."setlistId" = sl.id
        WHERE s.date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY a.id
        ORDER BY total_votes DESC, recent_shows DESC
        LIMIT ${limit}
      `

      return trendingArtists
    },

    featuredArtists: async (_parent, { limit = 12 }, { prisma }) => {
      // Get featured artists based on followers, popularity, and recent shows
      return await prisma.artist.findMany({
        where: {
          imageUrl: { not: null }, // Only artists with images
          shows: {
            some: {
              status: 'upcoming',
              date: { gte: new Date() }
            }
          }
        },
        orderBy: [
          { followers: 'desc' },
          { popularity: 'desc' },
          { lastSyncedAt: 'desc' }
        ],
        take: limit,
      })
    },
  },

  Mutation: {
    syncArtist: async (_parent, { artistId }, { prisma, services, user }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      const artist = await prisma.artist.findUnique({
        where: { id: artistId },
      })

      if (!artist) {
        throw new GraphQLError('Artist not found', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      try {
        // Sync from Spotify if we have a Spotify ID
        if (artist.spotifyId && services?.spotify) {
          await services.spotify.syncArtist(artist.spotifyId)
        }

        // Sync shows from Ticketmaster
        if (artist.ticketmasterId && services?.ticketmaster) {
          await services.ticketmaster.syncArtistShows(artist.ticketmasterId)
        }

        // Update last synced timestamp
        await prisma.artist.update({
          where: { id: artistId },
          data: { lastSyncedAt: new Date() },
        })

        return {
          success: true,
          message: 'Artist synced successfully',
          timestamp: new Date().toISOString(),
        }
      } catch (error: any) {
        return {
          success: false,
          message: error.message || 'Sync failed',
          timestamp: new Date().toISOString(),
        }
      }
    },

    trackArtist: async (_parent, { spotifyId, ticketmasterId, setlistfmMbid }, { prisma, services, user }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      if (!spotifyId && !ticketmasterId && !setlistfmMbid) {
        throw new GraphQLError('Must provide at least one external ID', {
          extensions: { code: 'BAD_REQUEST' },
        })
      }

      // Check if artist already exists
      const existingArtist = await prisma.artist.findFirst({
        where: {
          OR: [
            spotifyId ? { spotifyId: spotifyId } : {},
            ticketmasterId ? { ticketmasterId: ticketmasterId } : {},
            setlistfmMbid ? { setlistfmMbid: setlistfmMbid } : {},
          ].filter(obj => Object.keys(obj).length > 0),
        },
      })

      if (existingArtist) {
        return existingArtist
      }

      // Fetch artist data from external APIs
      let artistData: any = {
        name: 'Unknown Artist',
        genres: [],
        popularity: 0,
        followers: 0,
      }

      if (spotifyId && services?.spotify) {
        const spotifyData = await services.spotify.getArtist(spotifyId)
        if (spotifyData) {
          artistData = {
            name: spotifyData.name,
            genres: spotifyData.genres || [],
            popularity: spotifyData.popularity || 0,
            followers: spotifyData.followers?.total || 0,
            imageUrl: spotifyData.images?.[0]?.url,
          }
        }
      }

      // Create the artist
      const slug = artistData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      
      return prisma.artist.create({
        data: {
          spotifyId: spotifyId,
          ticketmasterId: ticketmasterId,
          setlistfmMbid: setlistfmMbid,
          name: artistData.name,
          slug,
          genres: artistData.genres,
          popularity: artistData.popularity,
          followers: artistData.followers,
          imageUrl: artistData.imageUrl,
          lastSyncedAt: new Date(),
        },
      })
    },
  },

  Artist: {
    shows: async (parent, { status, startDate, endDate, limit = 20, offset = 0 }, { prisma }) => {
      const where: Prisma.ShowWhereInput = {
        artistId: parent.id,
      }

      if (status) {
        where.status = status
      }

      if (startDate || endDate) {
        where.date = {}
        if (startDate) where.date.gte = new Date(startDate)
        if (endDate) where.date.lte = new Date(endDate)
      }

      const shows = await prisma.show.findMany({
        where,
        orderBy: { date: 'asc' },
        take: limit,
        skip: offset,
        include: {
          venue: true,
          artist: true
        }
      })

      return shows
    },

    songs: async (parent, { limit = 50, offset = 0, orderBy }, { prisma }) => {
      const orderByMap: Record<string, Prisma.SongOrderByWithRelationInput> = {
        NAME_ASC: { title: 'asc' },
        NAME_DESC: { title: 'desc' },
        POPULARITY_ASC: { popularity: 'asc' },
        POPULARITY_DESC: { popularity: 'desc' },
        DURATION_ASC: { durationMs: 'asc' },
        DURATION_DESC: { durationMs: 'desc' },
      }

      const where: Prisma.SongWhereInput = {
        artistId: parent.id,
      }

      const songs = await prisma.song.findMany({
        where,
        orderBy: orderByMap[orderBy || 'POPULARITY_DESC'],
        take: limit,
        skip: offset,
      })

      return songs
    },

    upcomingShowsCount: async (parent, _args, { prisma }) => {
      return prisma.show.count({
        where: {
          artistId: parent.id,
          status: 'upcoming',
          date: { gte: new Date() },
        },
      })
    },

    totalSongs: async (parent, _args, { prisma }) => {
      return prisma.song.count({
        where: { artistId: parent.id },
      })
    },
  },
}

// Helper function to import artist's song catalog
async function importArtistSongCatalog(prisma: any, spotify: any, artistId: string, spotifyArtistId: string) {
  try {
    console.log(`🎵 Importing song catalog for artist...`)
    
    // Get artist's albums
    const albums = await spotify.getArtistAlbums(spotifyArtistId, {
      include_groups: 'album,single',
      limit: 20
    })

    let importedCount = 0

    for (const album of albums.slice(0, 5)) { // Limit to first 5 albums for speed
      try {
        // Get tracks for this album
        const tracks = await spotify.getAlbumTracks(album.id, { limit: 50 })

        for (const track of tracks) {
          try {
            // Check if song already exists
            const existingSong = await prisma.song.findFirst({
              where: {
                artistId: artistId,
                title: track.name
              }
            })

            if (!existingSong) {
              await prisma.song.create({
                data: {
                  artistId: artistId,
                  spotifyId: track.id,
                  title: track.name,
                  album: album.name,
                  albumImageUrl: album.images?.[0]?.url || null,
                  durationMs: track.duration_ms,
                  popularity: track.popularity || 0,
                  previewUrl: track.preview_url,
                  spotifyUrl: track.external_urls?.spotify,
                }
              })
              importedCount++
            }
          } catch (songError) {
            console.error(`❌ Error importing song "${track.name}":`, songError)
          }
        }
      } catch (albumError) {
        console.error(`❌ Error importing album "${album.name}":`, albumError)
      }
    }

    console.log(`✅ Imported ${importedCount} songs for artist`)
  } catch (error) {
    console.error(`❌ Error importing song catalog:`, error)
  }
}

// Helper function to sync shows from Ticketmaster
async function syncTicketmasterShows(artistId: string, ticketmasterId: string, { prisma, ticketmaster }: any) {
  try {
    console.log(`🎫 Syncing shows from Ticketmaster for artist ${artistId} (TM ID: ${ticketmasterId})`)
    
    const startDate = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 12) // Next 12 months
    
    console.log(`📅 Searching for events from ${startDate.toISOString()} to ${endDate.toISOString()}`)
    
    let events = []
    try {
      events = await ticketmaster.getArtistEvents(ticketmasterId, {
        startDate,
        endDate,
        size: 200
      })
    } catch (apiError: any) {
      console.error(`❌ Ticketmaster API error:`, apiError.message)
      if (apiError.response) {
        console.error(`Response status: ${apiError.response.status}`)
        console.error(`Response data:`, JSON.stringify(apiError.response.data, null, 2))
      }
      return
    }
    
    console.log(`✅ Found ${events.length} upcoming shows`)
    
    if (events.length === 0) {
      console.log(`⚠️ No upcoming shows found for artist with Ticketmaster ID: ${ticketmasterId}`)
      return
    }
    
    let createdCount = 0
    let errorCount = 0
    
    for (const event of events) {
      try {
        if (!event._embedded || !event._embedded.venues || event._embedded.venues.length === 0) {
          console.warn(`⚠️ Event ${event.id} has no venue information, skipping`)
          continue
        }
        
        const venue = event._embedded.venues[0]
        
        // Log venue data to debug
        console.log(`🏛️ Processing venue: ${venue.name} (${venue.id})`)
        
        // Upsert venue with more robust handling
        const dbVenue = await prisma.venue.upsert({
          where: { ticketmasterId: venue.id },
          create: {
            ticketmasterId: venue.id,
            name: venue.name,
            address: venue.address?.line1 || null,
            city: venue.city?.name || 'Unknown City',
            state: venue.state?.name || null,
            country: venue.country?.name || 'Unknown Country',
            postalCode: venue.postalCode || null,
            latitude: venue.location?.latitude ? parseFloat(venue.location.latitude) : null,
            longitude: venue.location?.longitude ? parseFloat(venue.location.longitude) : null,
            timezone: venue.timezone || null,
            capacity: null // Will be updated later if available
          },
          update: {
            // Update only if better data is available
            name: venue.name,
            ...(venue.address?.line1 && { address: venue.address.line1 }),
            ...(venue.city?.name && { city: venue.city.name }),
            ...(venue.state?.name && { state: venue.state.name }),
            ...(venue.country?.name && { country: venue.country.name }),
            ...(venue.postalCode && { postalCode: venue.postalCode }),
            ...(venue.timezone && { timezone: venue.timezone })
          }
        })
        
        console.log(`✅ Venue upserted: ${dbVenue.name}`)
        
        // Parse date properly
        const eventDate = new Date(event.dates.start.localDate)
        if (isNaN(eventDate.getTime())) {
          console.error(`❌ Invalid date for event ${event.id}: ${event.dates.start.localDate}`)
          continue
        }
        
        // Upsert show
        const show = await prisma.show.upsert({
          where: { ticketmasterId: event.id },
          create: {
            ticketmasterId: event.id,
            artistId: artistId,
            venueId: dbVenue.id,
            date: eventDate,
            startTime: event.dates.start.localTime ? new Date(`1970-01-01T${event.dates.start.localTime}`) : null,
            title: event.name,
            status: 'upcoming', // Use lowercase to match schema default
            ticketmasterUrl: event.url || null,
            viewCount: 0
          },
          update: {
            status: 'upcoming',
            date: eventDate,
            ...(event.dates.start.localTime && { startTime: new Date(`1970-01-01T${event.dates.start.localTime}`) }),
            ...(event.url && { ticketmasterUrl: event.url })
          }
        })
        
        console.log(`✅ Show created/updated: ${show.title} on ${eventDate.toDateString()}`)
        createdCount++
        
        // Create default setlist
        const setlist = await prisma.setlist.upsert({
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
        
        // Add songs to the setlist only if they don't exist
        const existingSetlistSongs = await prisma.setlistSong.count({
          where: { setlistId: setlist.id }
        })
        
        if (existingSetlistSongs === 0) {
          const songs = await prisma.song.findMany({
            where: { artistId: artistId },
            take: 15,
            orderBy: { popularity: 'desc' }
          })
          
          console.log(`🎵 Adding ${songs.length} songs to setlist`)
          
          for (let i = 0; i < songs.length; i++) {
            try {
              await prisma.setlistSong.create({
                data: {
                  setlistId: setlist.id,
                  songId: songs[i].id,
                  position: i + 1,
                  voteCount: 0
                }
              })
            } catch (songError: any) {
              if (!songError.message.includes('Unique constraint')) {
                console.error(`Error adding song to setlist:`, songError.message)
              }
            }
          }
        }
      } catch (showError: any) {
        errorCount++
        console.error(`❌ Error creating show ${event.name}:`, showError.message)
        if (showError.code === 'P2002') {
          console.error(`Unique constraint violation:`, showError.meta)
        }
      }
    }
    
    console.log(`✅ Show sync completed: ${createdCount} created/updated, ${errorCount} errors`)
  } catch (error: any) {
    console.error(`❌ Error syncing Ticketmaster shows:`, error.message)
    console.error(`Full error:`, error)
  }
}

// Helper function to create a demo show for artists
async function createDemoShow(prisma: any, artistId: string) {
  try {
    console.log(`🎪 Creating demo show for artist...`)

    // Create a demo venue if it doesn't exist
    let venue = await prisma.venue.findFirst({
      where: { name: 'Demo Venue' }
    })

    if (!venue) {
      venue = await prisma.venue.create({
        data: {
          name: 'Demo Venue',
          city: 'Los Angeles',
          state: 'CA',
          country: 'United States',
          address: '123 Demo Street',
          capacity: 5000,
        }
      })
    }

    // Create an upcoming show
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30) // 30 days from now

    const show = await prisma.show.create({
      data: {
        artistId: artistId,
        venueId: venue.id,
        date: futureDate,
        title: 'Demo Concert',
        status: 'UPCOMING',
        viewCount: 0,
      }
    })

    // Create a setlist for the show
    const setlist = await prisma.setlist.create({
      data: {
        showId: show.id,
        name: 'Main Set',
        orderIndex: 0,
      }
    })

    // Get some songs for this artist and add them to the setlist
    const songs = await prisma.song.findMany({
      where: { artistId: artistId },
      take: 10,
      orderBy: { popularity: 'desc' }
    })

    // Add songs to setlist
    for (let i = 0; i < songs.length; i++) {
      await prisma.setlistSong.create({
        data: {
          setlistId: setlist.id,
          songId: songs[i].id,
          position: i + 1,
          voteCount: Math.floor(Math.random() * 20), // Random vote count for demo
        }
      })
    }

    console.log(`✅ Created demo show with ${songs.length} songs`)
  } catch (error) {
    console.error(`❌ Error creating demo show:`, error)
  }
}