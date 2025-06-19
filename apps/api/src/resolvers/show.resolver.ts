import { IResolvers } from '@graphql-tools/utils'
import { GraphQLError } from 'graphql'
import type { Prisma } from '@prisma/client'

export const showResolvers: IResolvers = {
  Query: {
    show: async (_parent, { id }, { prisma }) => {
      const show = await prisma.show.findUnique({
        where: { id },
        include: {
          artist: true,
          venue: true,
          setlists: {
            include: {
              setlistSongs: {
                include: {
                  song: true,
                },
                orderBy: { position: 'asc' },
              },
            },
            orderBy: { orderIndex: 'asc' },
          },
        },
      })

      if (!show) {
        // If show doesn't exist, try to create a sample show for demo purposes
        // This should be removed in production
        console.log(`🔍 Show "${id}" not found, might need to create demo data`)
        throw new GraphQLError('Show not found', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      // Increment view count
      await prisma.show.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      })

      return show
    },

    shows: async (_parent, { filter, orderBy, limit = 20, offset = 0, status }, { prisma }) => {
      const where: Prisma.ShowWhereInput = {}

      if (filter) {
        if (filter.artistId) {
          where.artistId = filter.artistId
        }

        if (filter.artistSlug) {
          where.artist = { slug: filter.artistSlug }
        }

        if (filter.venueId) {
          where.venueId = filter.venueId
        }

        if (filter.status) {
          where.status = filter.status
        }

        if (filter.startDate || filter.endDate) {
          where.date = {}
          if (filter.startDate) where.date.gte = new Date(filter.startDate)
          if (filter.endDate) where.date.lte = new Date(filter.endDate)
        }

        if (filter.city || filter.state || filter.country) {
          where.venue = {}
          if (filter.city) where.venue.city = { contains: filter.city, mode: 'insensitive' }
          if (filter.state) where.venue.state = { contains: filter.state, mode: 'insensitive' }
          if (filter.country) where.venue.country = { contains: filter.country, mode: 'insensitive' }
        }

        if (filter.search) {
          where.OR = [
            { title: { contains: filter.search, mode: 'insensitive' } },
            { tourName: { contains: filter.search, mode: 'insensitive' } },
            { artist: { name: { contains: filter.search, mode: 'insensitive' } } },
            { venue: { name: { contains: filter.search, mode: 'insensitive' } } },
          ]
        }
      }

      const orderByMap: Record<string, Prisma.ShowOrderByWithRelationInput> = {
        DATE_ASC: { date: 'asc' },
        DATE_DESC: { date: 'desc' },
        VIEW_COUNT_DESC: { viewCount: 'desc' },
      }

      // Add status filter directly if provided
      if (status) {
        where.status = status
      }

      const shows = await prisma.show.findMany({
        where,
        orderBy: orderByMap[orderBy || 'DATE_ASC'],
        take: limit,
        skip: offset,
        include: {
          artist: true,
          venue: true,
        },
      })

      return shows
    },

    trendingShows: async (_parent, { limit = 24, timeframe = 'WEEK' }, { prisma }) => {
      // Get trending shows with all needed data in a single query
      const trendingData = await prisma.$queryRaw`
        SELECT 
          tsd.id,
          tsd.date,
          tsd.title,
          tsd.view_count,
          tsd.total_votes,
          tsd.unique_voters,
          tsd.trending_score,
          a.id   AS artist_id,
          a.name AS artist_name,
          a.slug AS artist_slug,
          a.image_url AS artist_image_url,
          v.id   AS venue_id,
          v.name AS venue_name,
          v.city AS venue_city,
          v.state AS venue_state,
          v.country AS venue_country
        FROM trending_shows_distinct tsd
        JOIN artists a ON a.id = tsd.artist_id
        JOIN venues  v ON v.id = tsd.venue_id
        WHERE tsd.date >= CURRENT_DATE
        ORDER BY tsd.trending_score DESC
        LIMIT ${limit}
      `

      return (trendingData as any[]).map((row: any) => ({
        id: row.id,
        date: row.date,
        title: row.title,
        status: 'upcoming',
        ticketmasterUrl: null,
        viewCount: parseInt(row.view_count || '0', 10),
        totalVotes: parseInt(row.total_votes || '0', 10),
        uniqueVoters: parseInt(row.unique_voters || '0', 10),
        trendingScore: parseFloat(row.trending_score || '0'),
        // Include IDs for field resolvers
        artistId: row.artist_id,
        venueId: row.venue_id,
        // Also include the nested objects for performance
        artist: {
          id: row.artist_id,
          name: row.artist_name,
          slug: row.artist_slug,
          imageUrl: row.artist_image_url,
        },
        venue: {
          id: row.venue_id,
          name: row.venue_name,
          city: row.venue_city,
          state: row.venue_state,
          country: row.venue_country,
        },
      }))
    },

    showsNearLocation: async (_parent, { latitude, longitude, radiusMiles = 50, limit = 20 }, { prisma }) => {
      // Using Haversine formula for distance calculation
      // This is a simplified version - in production, you'd use PostGIS or similar
      const radiusKm = radiusMiles * 1.60934
      
      const shows = await prisma.$queryRaw`
        SELECT s.*, v.*,
          (
            6371 * acos(
              cos(radians(${latitude})) * cos(radians(v.latitude)) *
              cos(radians(v.longitude) - radians(${longitude})) +
              sin(radians(${latitude})) * sin(radians(v.latitude))
            )
          ) AS distance_km
        FROM shows s
        JOIN venues v ON s."venueId" = v.id
        WHERE v.latitude IS NOT NULL 
          AND v.longitude IS NOT NULL
          AND s.status = 'upcoming'
          AND s.date >= CURRENT_DATE
        HAVING distance_km <= ${radiusKm}
        ORDER BY distance_km ASC
        LIMIT ${limit}
      `

      return shows
    },
  },

  Mutation: {
    viewShow: async (_parent, { showId }, { prisma }) => {
      return prisma.show.update({
        where: { id: showId },
        data: { 
          viewCount: { increment: 1 },
          lastViewedAt: new Date(),
        },
      })
    },

    createSetlist: async (_parent, { showId, name, songIds }, { prisma, user }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      const show = await prisma.show.findUnique({
        where: { id: showId },
        include: { setlists: true },
      })

      if (!show) {
        throw new GraphQLError('Show not found', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      // Verify all songs exist and belong to the artist
      const songs = await prisma.song.findMany({
        where: {
          id: { in: songIds },
          artistId: show.artistId,
        },
      })

      if (songs.length !== songIds.length) {
        throw new GraphQLError('Invalid song IDs provided', {
          extensions: { code: 'BAD_REQUEST' },
        })
      }

      // Create setlist with songs
      const orderIndex = show.setlists.length
      
      return prisma.setlist.create({
        data: {
          showId: showId,
          name,
          orderIndex: orderIndex,
          isEncore: name.toLowerCase().includes('encore'),
          setlistSongs: {
            create: songIds.map((songId, index) => ({
              songId: songId,
              position: index + 1,
              voteCount: 0,
            })),
          },
        },
        include: {
          setlistSongs: {
            include: { song: true },
          },
        },
      })
    },

    updateSetlistOrder: async (_parent, { setlistId, songPositions }, { prisma, user }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      const setlist = await prisma.setlist.findUnique({
        where: { id: setlistId },
      })

      if (!setlist) {
        throw new GraphQLError('Setlist not found', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      // Update positions in a transaction
      await prisma.$transaction(
        songPositions.map(({ songId, position }) =>
          prisma.setlistSong.updateMany({
            where: {
              setlistId: setlistId,
              songId: songId,
            },
            data: { position },
          })
        )
      )

      return prisma.setlist.findUnique({
        where: { id: setlistId },
        include: {
          setlistSongs: {
            include: { song: true },
            orderBy: { position: 'asc' },
          },
        },
      })
    },

    addSongToSetlist: async (_parent, { setlistId, songId }, { prisma, user }) => {
      // Remove authentication requirement - allow anyone to add songs

      const setlist = await prisma.setlist.findUnique({
        where: { id: setlistId },
        include: {
          show: true,
          setlistSongs: true,
        },
      })

      if (!setlist) {
        throw new GraphQLError('Setlist not found', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      // Verify song belongs to the same artist
      const song = await prisma.song.findUnique({
        where: { id: songId },
      })

      if (!song || song.artistId !== setlist.show.artistId) {
        throw new GraphQLError('Song not found or does not belong to this artist', {
          extensions: { code: 'BAD_REQUEST' },
        })
      }

      // Check if song is already in setlist
      const existingSong = await prisma.setlistSong.findFirst({
        where: {
          setlistId: setlistId,
          songId: songId,
        },
      })

      if (existingSong) {
        throw new GraphQLError('Song already exists in setlist', {
          extensions: { code: 'CONFLICT' },
        })
      }

      // Add song to end of setlist
      const nextPosition = setlist.setlistSongs.length + 1

      const setlistSong = await prisma.setlistSong.create({
        data: {
          setlistId: setlistId,
          songId: songId,
          position: nextPosition,
          voteCount: 0,
        },
        include: {
          song: true,
        },
      })

      return setlistSong
    },
  },

  Show: {
    artist: async (parent, _args, { prisma, loaders }) => {
      // If artist data is already loaded (e.g., from trending shows), return it
      if (parent.artist && typeof parent.artist === 'object') {
        return parent.artist
      }
      
      if (loaders?.artist) {
        return loaders.artist.load(parent.artistId)
      }
      return prisma.artist.findUnique({
        where: { id: parent.artistId }
      })
    },

    venue: async (parent, _args, { prisma, loaders }) => {
      // If venue data is already loaded (e.g., from trending shows), return it
      if (parent.venue && typeof parent.venue === 'object') {
        return parent.venue
      }
      
      if (loaders?.venue) {
        return loaders.venue.load(parent.venueId)
      }
      return prisma.venue.findUnique({
        where: { id: parent.venueId }
      })
    },

    setlists: async (parent, _args, { prisma }) => {
      return prisma.setlist.findMany({
        where: { showId: parent.id },
        orderBy: { orderIndex: 'asc' },
      })
    },

    totalVotes: async (parent, _args, { prisma }) => {
      const result = await prisma.setlistSong.aggregate({
        where: {
          setlist: { showId: parent.id },
        },
        _sum: { voteCount: true },
      })
      return result._sum.voteCount || 0
    },

    uniqueVoters: async (parent, _args, { prisma }) => {
      const result = await prisma.vote.groupBy({
        by: ['userId'],
        where: { showId: parent.id },
      })
      return result.length
    },

    avgVotesPerSong: async (parent, _args, { prisma }) => {
      const result = await prisma.setlistSong.aggregate({
        where: {
          setlist: { showId: parent.id },
        },
        _avg: { voteCount: true },
      })
      return result._avg.voteCount || 0
    },

    trendingScore: (parent) => {
      return parent.trendingScore || 0
    },

    isToday: (parent) => {
      const today = new Date()
      const showDate = new Date(parent.date)
      return (
        showDate.getDate() === today.getDate() &&
        showDate.getMonth() === today.getMonth() &&
        showDate.getFullYear() === today.getFullYear()
      )
    },

    daysUntil: (parent) => {
      const today = new Date()
      const showDate = new Date(parent.date)
      const diffTime = showDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays > 0 ? diffDays : null
    },
  },

  Venue: {
    shows: async (parent, { status, limit = 20, offset = 0 }, { prisma }) => {
      const where: Prisma.ShowWhereInput = {
        venueId: parent.id,
      }

      if (status) {
        where.status = status
      }

      const [shows, totalCount] = await Promise.all([
        prisma.show.findMany({
          where,
          orderBy: { date: 'desc' },
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
  },

  Setlist: {
    show: async (parent, _args, { prisma, loaders }) => {
      if (loaders?.show) {
        return loaders.show.load(parent.showId)
      }
      return prisma.show.findUnique({
        where: { id: parent.showId }
      })
    },

    songs: async (parent, _args, { prisma }) => {
      return prisma.setlistSong.findMany({
        where: { setlistId: parent.id },
        orderBy: { position: 'asc' },
        include: {
          song: true
        }
      })
    },
  },

  SetlistSong: {
    setlist: async (parent, _args, { prisma, loaders }) => {
      if (loaders?.setlist) {
        return loaders.setlist.load(parent.setlistId)
      }
      return prisma.setlist.findUnique({
        where: { id: parent.setlistId }
      })
    },

    song: async (parent, _args, { prisma, loaders }) => {
      if (loaders?.song) {
        return loaders.song.load(parent.songId)
      }
      return prisma.song.findUnique({
        where: { id: parent.songId }
      })
    },

    hasVoted: async (parent, _args, { prisma, user }) => {
      if (!user) return false

      const vote = await prisma.vote.findFirst({
        where: {
          userId: user.id,
          setlistSongId: parent.id,
        },
      })

      return !!vote
    },

    votePercentage: async (parent, _args, { prisma }) => {
      const totalVotes = await prisma.setlistSong.aggregate({
        where: {
          setlistId: parent.setlistId,
        },
        _sum: { voteCount: true },
      })

      const total = totalVotes._sum.voteCount || 0
      if (total === 0) return 0

      return (parent.voteCount / total) * 100
    },
  },
}