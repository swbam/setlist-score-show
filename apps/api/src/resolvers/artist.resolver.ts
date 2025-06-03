import { IResolvers } from '@graphql-tools/utils'
import { GraphQLError } from 'graphql'
import type { Prisma } from '@prisma/client'

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

    artists: async (_parent, { filter, orderBy, limit = 20, offset = 0 }, { prisma }) => {
      const where: Prisma.ArtistWhereInput = {}

      if (filter?.search) {
        where.OR = [
          { name: { contains: filter.search, mode: 'insensitive' } },
          { genres: { hasSome: [filter.search] } },
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
        RECENTLY_SYNCED: { last_synced_at: 'desc' },
      }

      const [artists, totalCount] = await Promise.all([
        prisma.artist.findMany({
          where,
          orderBy: orderByMap[orderBy || 'POPULARITY_DESC'],
          take: limit,
          skip: offset,
        }),
        prisma.artist.count({ where }),
      ])

      const edges = artists.map((artist, index) => ({
        node: artist,
        cursor: Buffer.from(`${offset + index}`).toString('base64'),
      }))

      return {
        edges,
        pageInfo: {
          hasNextPage: offset + artists.length < totalCount,
          hasPreviousPage: offset > 0,
          startCursor: edges[0]?.cursor || null,
          endCursor: edges[edges.length - 1]?.cursor || null,
        },
        totalCount,
      }
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
               COALESCE(SUM(ss.vote_count), 0) as total_votes
        FROM artists a
        JOIN shows s ON s.artist_id = a.id
        LEFT JOIN setlists sl ON sl.show_id = s.id
        LEFT JOIN setlist_songs ss ON ss.setlist_id = sl.id
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
        if (artist.spotify_id && services?.spotify) {
          await services.spotify.syncArtist(artist.spotify_id)
        }

        // Sync shows from Ticketmaster
        if (artist.ticketmaster_id && services?.ticketmaster) {
          await services.ticketmaster.syncArtistShows(artist.ticketmaster_id)
        }

        // Update last synced timestamp
        await prisma.artist.update({
          where: { id: artistId },
          data: { last_synced_at: new Date() },
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
            spotifyId ? { spotify_id: spotifyId } : {},
            ticketmasterId ? { ticketmaster_id: ticketmasterId } : {},
            setlistfmMbid ? { setlistfm_mbid: setlistfmMbid } : {},
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
            image_url: spotifyData.images?.[0]?.url,
          }
        }
      }

      // Create the artist
      const slug = artistData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      
      return prisma.artist.create({
        data: {
          spotify_id: spotifyId,
          ticketmaster_id: ticketmasterId,
          setlistfm_mbid: setlistfmMbid,
          name: artistData.name,
          slug,
          genres: artistData.genres,
          popularity: artistData.popularity,
          followers: artistData.followers,
          image_url: artistData.image_url,
          last_synced_at: new Date(),
        },
      })
    },
  },

  Artist: {
    shows: async (parent, { status, startDate, endDate, limit = 20, offset = 0 }, { prisma }) => {
      const where: Prisma.ShowWhereInput = {
        artist_id: parent.id,
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
        NAME_ASC: { name: 'asc' },
        NAME_DESC: { name: 'desc' },
        POPULARITY_ASC: { popularity: 'asc' },
        POPULARITY_DESC: { popularity: 'desc' },
        DURATION_ASC: { duration_ms: 'asc' },
        DURATION_DESC: { duration_ms: 'desc' },
      }

      const where: Prisma.SongWhereInput = {
        artist_id: parent.id,
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
          artist_id: parent.id,
          status: 'UPCOMING',
          date: { gte: new Date() },
        },
      })
    },

    totalSongs: async (parent, _args, { prisma }) => {
      return prisma.song.count({
        where: { artist_id: parent.id },
      })
    },
  },
}