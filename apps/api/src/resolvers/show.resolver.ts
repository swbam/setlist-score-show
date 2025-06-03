import { IResolvers } from '@graphql-tools/utils'
import { GraphQLError } from 'graphql'
import type { Prisma } from '@prisma/client'

export const showResolvers: IResolvers = {
  Query: {
    show: async (_parent, { id }, { prisma }) => {
      const show = await prisma.show.findUnique({
        where: { id },
      })

      if (!show) {
        throw new GraphQLError('Show not found', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      // Increment view count
      await prisma.show.update({
        where: { id },
        data: { view_count: { increment: 1 } },
      })

      return show
    },

    shows: async (_parent, { filter, orderBy, limit = 20, offset = 0 }, { prisma }) => {
      const where: Prisma.ShowWhereInput = {}

      if (filter) {
        if (filter.artistId) {
          where.artist_id = filter.artistId
        }

        if (filter.artistSlug) {
          where.artist = { slug: filter.artistSlug }
        }

        if (filter.venueId) {
          where.venue_id = filter.venueId
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
            { tour_name: { contains: filter.search, mode: 'insensitive' } },
            { artist: { name: { contains: filter.search, mode: 'insensitive' } } },
            { venue: { name: { contains: filter.search, mode: 'insensitive' } } },
          ]
        }
      }

      const orderByMap: Record<string, Prisma.ShowOrderByWithRelationInput> = {
        DATE_ASC: { date: 'asc' },
        DATE_DESC: { date: 'desc' },
        TRENDING_SCORE_DESC: { trending_score: 'desc' },
        TOTAL_VOTES_DESC: { total_votes: 'desc' },
        VIEW_COUNT_DESC: { view_count: 'desc' },
      }

      const [shows, totalCount] = await Promise.all([
        prisma.show.findMany({
          where,
          orderBy: orderByMap[orderBy || 'DATE_ASC'],
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

    trendingShows: async (_parent, { limit = 10, timeframe = 'WEEK' }, { prisma }) => {
      const timeframeMap = {
        DAY: 1,
        WEEK: 7,
        MONTH: 30,
        ALL_TIME: 365 * 10, // Effectively all time
      }

      const daysAgo = timeframeMap[timeframe]
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysAgo)

      return prisma.show.findMany({
        where: {
          date: { gte: startDate },
          status: { in: ['UPCOMING', 'ONGOING'] },
        },
        orderBy: [
          { trending_score: 'desc' },
          { total_votes: 'desc' },
          { view_count: 'desc' },
        ],
        take: limit,
      })
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
        JOIN venues v ON s.venue_id = v.id
        WHERE v.latitude IS NOT NULL 
          AND v.longitude IS NOT NULL
          AND s.status = 'UPCOMING'
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
          view_count: { increment: 1 },
          last_viewed_at: new Date(),
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
          artist_id: show.artist_id,
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
          show_id: showId,
          name,
          order_index: orderIndex,
          is_encore: name.toLowerCase().includes('encore'),
          setlist_songs: {
            create: songIds.map((songId, index) => ({
              song_id: songId,
              position: index + 1,
              vote_count: 0,
            })),
          },
        },
        include: {
          setlist_songs: {
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
              setlist_id: setlistId,
              song_id: songId,
            },
            data: { position },
          })
        )
      )

      return prisma.setlist.findUnique({
        where: { id: setlistId },
        include: {
          setlist_songs: {
            include: { song: true },
            orderBy: { position: 'asc' },
          },
        },
      })
    },
  },

  Show: {
    artist: async (parent, _args, { loaders }) => {
      return loaders.artist.load(parent.artist_id)
    },

    venue: async (parent, _args, { loaders }) => {
      return loaders.venue.load(parent.venue_id)
    },

    setlists: async (parent, _args, { prisma }) => {
      return prisma.setlist.findMany({
        where: { show_id: parent.id },
        orderBy: { order_index: 'asc' },
      })
    },

    totalVotes: async (parent, _args, { prisma }) => {
      const result = await prisma.setlistSong.aggregate({
        where: {
          setlist: { show_id: parent.id },
        },
        _sum: { vote_count: true },
      })
      return result._sum.vote_count || 0
    },

    uniqueVoters: async (parent, _args, { prisma }) => {
      const result = await prisma.vote.groupBy({
        by: ['user_id'],
        where: { show_id: parent.id },
      })
      return result.length
    },

    avgVotesPerSong: async (parent, _args, { prisma }) => {
      const result = await prisma.setlistSong.aggregate({
        where: {
          setlist: { show_id: parent.id },
        },
        _avg: { vote_count: true },
      })
      return result._avg.vote_count || 0
    },

    trendingScore: (parent) => {
      return parent.trending_score || 0
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
        venue_id: parent.id,
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
    show: async (parent, _args, { loaders }) => {
      return loaders.show.load(parent.show_id)
    },

    songs: async (parent, _args, { prisma }) => {
      return prisma.setlistSong.findMany({
        where: { setlist_id: parent.id },
        orderBy: { position: 'asc' },
      })
    },
  },

  SetlistSong: {
    setlist: async (parent, _args, { loaders }) => {
      return loaders.setlist.load(parent.setlist_id)
    },

    song: async (parent, _args, { loaders }) => {
      return loaders.song.load(parent.song_id)
    },

    hasVoted: async (parent, _args, { prisma, user }) => {
      if (!user) return false

      const vote = await prisma.vote.findFirst({
        where: {
          user_id: user.id,
          setlist_song_id: parent.id,
        },
      })

      return !!vote
    },

    votePercentage: async (parent, _args, { prisma }) => {
      const totalVotes = await prisma.setlistSong.aggregate({
        where: {
          setlist_id: parent.setlist_id,
        },
        _sum: { vote_count: true },
      })

      const total = totalVotes._sum.vote_count || 0
      if (total === 0) return 0

      return (parent.vote_count / total) * 100
    },
  },
}