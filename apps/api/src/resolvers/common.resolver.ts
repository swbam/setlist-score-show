import { IResolvers } from '@graphql-tools/utils'
import { GraphQLError } from 'graphql'
import { GraphQLScalarType, Kind } from 'graphql'
import { SetlistFmClient } from '../lib/setlistfm'
import { TicketmasterClient } from '../lib/ticketmaster'

// Helper function to sync artist shows from Ticketmaster
async function syncArtistShows(artistId: string, { prisma, ticketmaster }: any) {
  try {
    console.log(`🎫 Starting show sync for artist ${artistId}`)
    
    const artist = await prisma.artist.findUnique({ where: { id: artistId } })
    if (!artist?.ticketmasterId) return
    
    // Get upcoming shows from Ticketmaster
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 180) // Next 6 months
    
    console.log(`🔍 Searching Ticketmaster for artist ${artist.name} (ID: ${artist.ticketmasterId})`)
    console.log(`📅 Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`)
    
    let events = []
    try {
      events = await ticketmaster.getArtistEvents(artist.ticketmasterId, {
        startDate,
        endDate,
        size: 50
      })
      console.log(`🎫 Found ${events.length} upcoming shows for ${artist.name}`)
    } catch (tmError) {
      console.error(`❌ Ticketmaster API error for ${artist.name}:`, tmError.message)
      console.error(`Full error:`, tmError)
      return
    }
    
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
            timezone: venue.timezone,
            capacity: venue.capacity
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
            startTime: event.dates.start.localTime ? new Date(`1970-01-01T${event.dates.start.localTime}`) : null,
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
        await prisma.setlist.upsert({
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
        
        console.log(`✅ Created/updated show: ${event.name} on ${event.dates.start.localDate}`)
      } catch (showError) {
        console.error(`❌ Error creating show:`, showError)
      }
    }
  } catch (error) {
    console.error(`❌ Error syncing shows for artist ${artistId}:`, error)
  }
}

// Custom scalar resolvers
const dateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'DateTime custom scalar type',
  serialize(value: any) {
    if (value instanceof Date) {
      return value.toISOString()
    }
    return value
  },
  parseValue(value: any) {
    return new Date(value)
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value)
    }
    return null
  },
})

const dateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'Date custom scalar type (YYYY-MM-DD)',
  serialize(value: any) {
    if (value instanceof Date) {
      return value.toISOString().split('T')[0]
    }
    return value
  },
  parseValue(value: any) {
    return new Date(value + 'T00:00:00.000Z')
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value + 'T00:00:00.000Z')
    }
    return null
  },
})

const timeScalar = new GraphQLScalarType({
  name: 'Time',
  description: 'Time custom scalar type (HH:mm:ss)',
  serialize(value: any) {
    if (value instanceof Date) {
      return value.toISOString().split('T')[1].split('.')[0]
    }
    return value
  },
  parseValue(value: any) {
    return value
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return ast.value
    }
    return null
  },
})

const jsonScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'JSON custom scalar type',
  serialize(value: any) {
    return value
  },
  parseValue(value: any) {
    return value
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      try {
        return JSON.parse(ast.value)
      } catch {
        return null
      }
    }
    return null
  },
})

export const commonResolvers: IResolvers = {
  // Scalar types
  DateTime: dateTimeScalar,
  Date: dateScalar,
  Time: timeScalar,
  JSON: jsonScalar,

  Query: {
    search: async (_parent, { input, query }, { prisma, spotify, ticketmaster, setlistfm }) => {
      // Handle both input object and direct query parameter
      const searchQuery = input?.query || query
      const types = input?.types || ['ARTIST']
      const limit = input?.limit || 10

      if (!searchQuery) {
        return {
          artists: [],
          shows: [],
          songs: [],
          venues: [],
          totalResults: 0,
        }
      }

      const results = {
        artists: [],
        shows: [],
        songs: [],
        venues: [],
        totalResults: 0,
      }

      // Search artists - first check local DB, then Spotify if needed
      if (types.includes('ARTIST')) {
        let artists = []
        
        // Try local database first
        try {
          artists = await prisma.artist.findMany({
            where: {
              OR: [
                { name: { contains: searchQuery, mode: 'insensitive' } },
                { genres: { hasSome: [searchQuery] } },
              ],
            },
            take: limit,
            orderBy: { popularity: 'desc' },
          })
        } catch (dbError) {
          console.log('Database not available, searching Spotify directly:', dbError.message)
        }

        // If no local results or DB error, search and import from all sources
        if (artists.length === 0) {
          try {
            console.log(`🎵 Searching for artists: "${searchQuery}"`)
            const spotifyResults = await spotify.searchArtists(searchQuery, { limit: Math.min(limit, 10) })
            
            for (const spotifyArtist of spotifyResults.body.artists.items) {
              try {
                // Create slug from artist name
                const slug = spotifyArtist.name.toLowerCase()
                  .replace(/[^a-z0-9\s-]/g, '')
                  .replace(/\s+/g, '-')
                  .replace(/-+/g, '-')
                  .trim()

                // Try to get Ticketmaster ID
                let ticketmasterId = null
                try {
                  console.log(`🔍 Searching Ticketmaster for artist: ${spotifyArtist.name}`)
                  const tmArtists = await ticketmaster.searchArtists(spotifyArtist.name)
                  console.log(`🎫 Ticketmaster search returned ${tmArtists.length} results`)
                  if (tmArtists.length > 0) {
                    // Find best match by name similarity
                    const bestMatch = tmArtists.find((tm: any) => 
                      tm.name.toLowerCase() === spotifyArtist.name.toLowerCase()
                    ) || tmArtists[0]
                    ticketmasterId = bestMatch.id
                    console.log(`✅ Found Ticketmaster ID for ${spotifyArtist.name}: ${ticketmasterId}`)
                    console.log(`    Name: ${bestMatch.name}`)
                  } else {
                    console.log(`⚠️ No Ticketmaster results for ${spotifyArtist.name}`)
                  }
                } catch (tmError) {
                  console.error(`❌ Ticketmaster search error for ${spotifyArtist.name}:`, tmError.message)
                  console.error(`Full error:`, tmError)
                }

                // Try to get Setlist.fm MBID
                let setlistfmMbid = null
                try {
                  const setlistResults = await setlistfm.searchArtists(spotifyArtist.name)
                  if (setlistResults.artists.length > 0) {
                    // Find best match
                    const bestMatch = setlistResults.artists.find((sf: any) => 
                      sf.name.toLowerCase() === spotifyArtist.name.toLowerCase()
                    ) || setlistResults.artists[0]
                    setlistfmMbid = bestMatch.mbid
                    console.log(`✅ Found Setlist.fm MBID for ${spotifyArtist.name}: ${setlistfmMbid}`)
                  }
                } catch (sfError) {
                  console.log(`⚠️ Could not find Setlist.fm MBID for ${spotifyArtist.name}`)
                }

                // Check if artist already exists
                const existingArtist = await prisma.artist.findUnique({
                  where: { spotifyId: spotifyArtist.id }
                })

                if (!existingArtist) {
                  // Create new artist with all external IDs
                  const newArtist = await prisma.artist.create({
                    data: {
                      spotifyId: spotifyArtist.id,
                      ticketmasterId: ticketmasterId,
                      setlistfmMbid: setlistfmMbid,
                      name: spotifyArtist.name,
                      slug: slug,
                      imageUrl: spotifyArtist.images[0]?.url || null,
                      genres: spotifyArtist.genres,
                      popularity: spotifyArtist.popularity || 0,
                      followers: spotifyArtist.followers?.total || 0,
                      lastSyncedAt: new Date(),
                    }
                  })
                  artists.push(newArtist)
                  console.log(`✅ Created artist with all IDs: ${spotifyArtist.name}`)
                  
                  // Import song catalog from Spotify
                  try {
                    console.log(`🎵 Importing song catalog for ${spotifyArtist.name}...`)
                    const albums = await spotify.getArtistAlbums(spotifyArtist.id, {
                      include_groups: 'album,single',
                      limit: 20
                    })
                    
                    let songCount = 0
                    for (const album of albums.slice(0, 5)) { // Limit to first 5 albums for speed
                      try {
                        const tracks = await spotify.getAlbumTracks(album.id, { limit: 50 })
                        
                        for (const track of tracks) {
                          try {
                            await prisma.song.create({
                              data: {
                                artistId: newArtist.id,
                                spotifyId: track.id,
                                title: track.name,
                                album: album.name,
                                albumImageUrl: album.images?.[0]?.url || null,
                                durationMs: track.duration_ms,
                                popularity: 0,
                                previewUrl: track.preview_url,
                                spotifyUrl: track.external_urls?.spotify,
                              }
                            })
                            songCount++
                          } catch (songError: any) {
                            if (!songError.message.includes('Unique constraint')) {
                              console.error(`Error importing song:`, songError.message)
                            }
                          }
                        }
                      } catch (albumError) {
                        console.error(`Error importing album:`, albumError)
                      }
                    }
                    console.log(`✅ Imported ${songCount} songs for ${spotifyArtist.name}`)
                  } catch (error) {
                    console.error(`Error importing song catalog:`, error)
                  }
                  
                  // Trigger sync jobs to get shows
                  if (ticketmasterId) {
                    // Don't await - let it run in background
                    syncArtistShows(newArtist.id, { prisma, ticketmaster }).catch(err => 
                      console.error(`Failed to sync shows for ${newArtist.name}:`, err)
                    )
                  }
                } else {
                  // Update existing artist with missing IDs
                  if ((ticketmasterId && !existingArtist.ticketmasterId) || 
                      (setlistfmMbid && !existingArtist.setlistfmMbid)) {
                    const updatedArtist = await prisma.artist.update({
                      where: { id: existingArtist.id },
                      data: {
                        ...(ticketmasterId && !existingArtist.ticketmasterId ? { ticketmasterId } : {}),
                        ...(setlistfmMbid && !existingArtist.setlistfmMbid ? { setlistfmMbid } : {}),
                      }
                    })
                    artists.push(updatedArtist)
                    console.log(`✅ Updated artist with new IDs: ${spotifyArtist.name}`)
                    
                    // Trigger sync if we just added Ticketmaster ID
                    if (ticketmasterId && !existingArtist.ticketmasterId) {
                      syncArtistShows(updatedArtist.id, { prisma, ticketmaster }).catch(err => 
                        console.error(`Failed to sync shows for ${updatedArtist.name}:`, err)
                      )
                    }
                  } else {
                    artists.push(existingArtist)
                    
                    // Check if we need to import songs
                    const songCount = await prisma.song.count({
                      where: { artistId: existingArtist.id }
                    })
                    
                    if (songCount === 0) {
                      console.log(`🎵 No songs found, importing catalog for ${existingArtist.name}...`)
                      try {
                        const albums = await spotify.getArtistAlbums(spotifyArtist.id, {
                          include_groups: 'album,single',
                          limit: 20
                        })
                        
                        let importedCount = 0
                        for (const album of albums.slice(0, 5)) {
                          try {
                            const tracks = await spotify.getAlbumTracks(album.id, { limit: 50 })
                            
                            for (const track of tracks) {
                              try {
                                await prisma.song.create({
                                  data: {
                                    artistId: existingArtist.id,
                                    spotifyId: track.id,
                                    title: track.name,
                                    album: album.name,
                                    albumImageUrl: album.images?.[0]?.url || null,
                                    durationMs: track.duration_ms,
                                    popularity: 0,
                                    previewUrl: track.preview_url,
                                    spotifyUrl: track.external_urls?.spotify,
                                  }
                                })
                                importedCount++
                              } catch (songError: any) {
                                if (!songError.message.includes('Unique constraint')) {
                                  console.error(`Error importing song:`, songError.message)
                                }
                              }
                            }
                          } catch (albumError) {
                            console.error(`Error importing album:`, albumError)
                          }
                        }
                        console.log(`✅ Imported ${importedCount} songs for ${existingArtist.name}`)
                      } catch (error) {
                        console.error(`Error importing song catalog:`, error)
                      }
                    }
                    
                    // Check if we need to sync shows
                    if (existingArtist.ticketmasterId) {
                      const showCount = await prisma.show.count({
                        where: { artistId: existingArtist.id }
                      })
                      
                      if (showCount === 0) {
                        console.log(`🎫 No shows found, syncing from Ticketmaster...`)
                        syncArtistShows(existingArtist.id, { prisma, ticketmaster }).catch(err => 
                          console.error(`Failed to sync shows:`, err)
                        )
                      }
                    }
                  }
                }
              } catch (error) {
                console.error(`❌ Error importing artist ${spotifyArtist.name}:`, error)
              }
            }
          } catch (error) {
            console.error('❌ Multi-source search error:', error)
          }
        }

        results.artists = artists
      }

      // Search shows
      if (types.includes('SHOW')) {
        results.shows = await prisma.show.findMany({
          where: {
            OR: [
              { title: { contains: searchQuery, mode: 'insensitive' } },
              { tourName: { contains: searchQuery, mode: 'insensitive' } },
              { artist: { name: { contains: searchQuery, mode: 'insensitive' } } },
              { venue: { name: { contains: searchQuery, mode: 'insensitive' } } },
            ],
          },
          take: limit,
          orderBy: { date: 'asc' },
        })
      }

      // Search songs
      if (types.includes('SONG')) {
        results.songs = await prisma.song.findMany({
          where: {
            OR: [
              { title: { contains: searchQuery, mode: 'insensitive' } },
              { album: { contains: searchQuery, mode: 'insensitive' } },
            ],
          },
          take: limit,
          orderBy: { popularity: 'desc' },
        })
      }

      // Search venues
      if (types.includes('VENUE')) {
        results.venues = await prisma.venue.findMany({
          where: {
            OR: [
              { name: { contains: searchQuery, mode: 'insensitive' } },
              { city: { contains: searchQuery, mode: 'insensitive' } },
              { state: { contains: searchQuery, mode: 'insensitive' } },
            ],
          },
          take: limit,
        })
      }

      results.totalResults = 
        results.artists.length + 
        results.shows.length + 
        results.songs.length + 
        results.venues.length

      return results
    },

    analytics: async (_parent, { startDate, endDate }, { prisma, user }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      // TODO: Add admin role check
      // if (!user.isAdmin) {
      //   throw new GraphQLError('Admin access required', {
      //     extensions: { code: 'FORBIDDEN' },
      //   })
      // }

      const dateFilter: any = {}
      if (startDate) dateFilter.gte = new Date(startDate)
      if (endDate) dateFilter.lte = new Date(endDate)

      const [
        totalUsers,
        totalVotes,
        totalShows,
        totalArtists,
        activeUsers,
        popularShows,
        topVoters,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.vote.count({
          where: dateFilter.gte || dateFilter.lte ? { createdAt: dateFilter } : undefined,
        }),
        prisma.show.count(),
        prisma.artist.count(),
        prisma.user.count({
          where: {
            votes: {
              some: {
                createdAt: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
                },
              },
            },
          },
        }),
        prisma.show.findMany({
          where: {
            status: 'upcoming',
            date: { gte: new Date() },
          },
          orderBy: { viewCount: 'desc' }, // Use viewCount instead of non-existent total_votes
          take: 10,
        }),
        prisma.$queryRaw`
          SELECT u.*, COUNT(v.id) as vote_count
          FROM users u
          JOIN votes v ON v."userId" = u.id
          ${dateFilter.gte ? `WHERE v."createdAt" >= ${dateFilter.gte}` : ''}
          ${dateFilter.lte ? `${dateFilter.gte ? 'AND' : 'WHERE'} v."createdAt" <= ${dateFilter.lte}` : ''}
          GROUP BY u.id
          ORDER BY vote_count DESC
          LIMIT 10
        `,
      ])

      return {
        totalUsers,
        totalVotes,
        totalShows,
        totalArtists,
        activeUsers,
        popularShows,
        topVoters,
      }
    },

    health: async (_parent, _args, { prisma, redis }) => {
      const startTime = Date.now()
      const services = []

      // Check database
      try {
        await prisma.$queryRaw`SELECT 1`
        services.push({
          name: 'Database',
          status: 'HEALTHY',
          responseTime: Date.now() - startTime,
          message: 'Connected',
        })
      } catch (error: any) {
        services.push({
          name: 'Database',
          status: 'UNHEALTHY',
          responseTime: Date.now() - startTime,
          message: error.message,
        })
      }

      // Check Redis
      if (redis) {
        const redisStart = Date.now()
        try {
          await redis.ping()
          services.push({
            name: 'Redis',
            status: 'HEALTHY',
            responseTime: Date.now() - redisStart,
            message: 'Connected',
          })
        } catch (error: any) {
          services.push({
            name: 'Redis',
            status: 'UNHEALTHY',
            responseTime: Date.now() - redisStart,
            message: error.message,
          })
        }
      }

      // Check external services
      const externalServices = ['Spotify', 'Ticketmaster', 'Setlist.fm']
      for (const service of externalServices) {
        services.push({
          name: service,
          status: 'HEALTHY', // TODO: Implement actual health checks
          responseTime: null,
          message: 'Not implemented',
        })
      }

      const overallStatus = services.some(s => s.status === 'UNHEALTHY') 
        ? 'UNHEALTHY' 
        : services.some(s => s.status === 'DEGRADED')
        ? 'DEGRADED'
        : 'HEALTHY'

      return {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.APP_VERSION || '1.0.0',
        services,
      }
    },
  },

  PageInfo: {
    totalPages: (parent: any) => {
      if (!parent.totalCount || !parent.pageSize) return 1
      return Math.ceil(parent.totalCount / parent.pageSize)
    },
    currentPage: (parent: any) => {
      if (!parent.offset || !parent.pageSize) return 1
      return Math.floor(parent.offset / parent.pageSize) + 1
    },
  },
}