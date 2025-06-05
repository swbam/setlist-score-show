import { IResolvers } from '@graphql-tools/utils'
import { GraphQLError } from 'graphql'
import type { Prisma } from '@setlist/database'

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
        where: { slug },
        include: {
          shows: {
            include: {
              venue: true,
            },
            orderBy: { date: 'desc' },
          },
          songs: {
            orderBy: { popularity: 'desc' },
            take: 50 // Load top 50 songs for the artist
          }
        },
      })

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

              // Refetch with songs included
              artist = await prisma.artist.findUnique({
                where: { id: artist.id },
                include: {
                  shows: {
                    include: {
                      venue: true,
                    },
                    orderBy: { date: 'desc' },
                  },
                  songs: {
                    orderBy: { popularity: 'desc' },
                    take: 50
                  }
                },
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
            status: 'UPCOMING',
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

    searchArtists: async (_parent, { query, limit = 10 }, { prisma }) => {
      return prisma.artist.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { genres: { hasSome: [query] } },
          ],
        },
        orderBy: [
          { popularity: 'desc' },
          { followers: 'desc' },
        ],
        take: limit,
      })
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

      const [shows, totalCount] = await Promise.all([
        prisma.show.findMany({
          where,
          orderBy: { date: 'asc' },
          take: limit,
          skip: offset,
        }),
        prisma.show.count({ where }),
      ])

      const edges = shows.map((show, index) => ({
        node: show,
        cursor: Buffer.from(`${offset + index}`).toString('base64'),
      }))

      return {
        edges,
        pageInfo: {
          hasNextPage: offset + shows.length < totalCount,
          hasPreviousPage: offset > 0,
          startCursor: edges[0]?.cursor || null,
          endCursor: edges[edges.length - 1]?.cursor || null,
        },
        totalCount,
      }
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

      const [songs, totalCount] = await Promise.all([
        prisma.song.findMany({
          where,
          orderBy: orderByMap[orderBy || 'POPULARITY_DESC'],
          take: limit,
          skip: offset,
        }),
        prisma.song.count({ where }),
      ])

      const edges = songs.map((song, index) => ({
        node: song,
        cursor: Buffer.from(`${offset + index}`).toString('base64'),
      }))

      return {
        edges,
        pageInfo: {
          hasNextPage: offset + songs.length < totalCount,
          hasPreviousPage: offset > 0,
          startCursor: edges[0]?.cursor || null,
          endCursor: edges[edges.length - 1]?.cursor || null,
        },
        totalCount,
      }
    },

    upcomingShowsCount: async (parent, _args, { prisma }) => {
      return prisma.show.count({
        where: {
          artistId: parent.id,
          status: 'UPCOMING',
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
    const albumsResponse = await spotify.spotify.getArtistAlbums(spotifyArtistId, {
      include_groups: 'album,single',
      limit: 20
    })

    let importedCount = 0

    for (const album of albumsResponse.body.items) {
      try {
        // Get tracks for this album
        const tracksResponse = await spotify.spotify.getAlbumTracks(album.id, { limit: 50 })

        for (const track of tracksResponse.body.items) {
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
                  albumImageUrl: album.images[0]?.url || null,
                  durationMs: track.duration_ms,
                  popularity: 0, // We'll update this later
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
    console.log(`🎫 Syncing shows from Ticketmaster for artist ${artistId}`)
    
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 180) // Next 6 months
    
    const events = await ticketmaster.getArtistEvents(ticketmasterId, {
      startDate,
      endDate,
      size: 50
    })
    
    console.log(`Found ${events.length} upcoming shows`)
    
    for (const event of events) {
      try {
        const venue = event._embedded.venues[0]
        
        // Upsert venue
        const dbVenue = await prisma.venue.upsert({
          where: { ticketmasterId: venue.id },
          create: {
            ticketmasterId: venue.id,
            name: venue.name,
            address: venue.address?.line1,
            city: venue.city.name,
            state: venue.state?.name,
            country: venue.country.name,
            postalCode: venue.postalCode,
            latitude: venue.location?.latitude ? parseFloat(venue.location.latitude) : null,
            longitude: venue.location?.longitude ? parseFloat(venue.location.longitude) : null,
            timezone: venue.timezone
          },
          update: {}
        })
        
        // Upsert show
        const show = await prisma.show.upsert({
          where: { ticketmasterId: event.id },
          create: {
            ticketmasterId: event.id,
            artistId: artistId,
            venueId: dbVenue.id,
            date: new Date(event.dates.start.localDate),
            startTime: event.dates.start.localTime,
            title: event.name,
            status: 'upcoming',
            ticketmasterUrl: event.url,
            viewCount: 0
          },
          update: {
            status: 'upcoming',
            ticketmasterUrl: event.url
          }
        })
        
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
        
        // Add some songs to the setlist from the artist's catalog
        const songs = await prisma.song.findMany({
          where: { artistId: artistId },
          take: 15,
          orderBy: { popularity: 'desc' }
        })
        
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
          } catch (error) {
            // Song might already be in setlist
          }
        }
      } catch (showError) {
        console.error('Error creating show:', showError)
      }
    }
  } catch (error) {
    console.error('Error syncing Ticketmaster shows:', error)
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