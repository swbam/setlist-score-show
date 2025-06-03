import { IResolvers } from '@graphql-tools/utils'
import { GraphQLError } from 'graphql'
import { GraphQLScalarType, Kind } from 'graphql'

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
    search: async (_parent, { input }, { prisma }) => {
      const { query, types = ['ARTIST', 'SHOW', 'SONG', 'VENUE'], limit = 10 } = input

      const results = {
        artists: [],
        shows: [],
        songs: [],
        venues: [],
        totalResults: 0,
      }

      // Search artists
      if (types.includes('ARTIST')) {
        results.artists = await prisma.artist.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { genres: { hasSome: [query] } },
            ],
          },
          take: limit,
          orderBy: { popularity: 'desc' },
        })
      }

      // Search shows
      if (types.includes('SHOW')) {
        results.shows = await prisma.show.findMany({
          where: {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { tour_name: { contains: query, mode: 'insensitive' } },
              { artist: { name: { contains: query, mode: 'insensitive' } } },
              { venue: { name: { contains: query, mode: 'insensitive' } } },
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
              { title: { contains: query, mode: 'insensitive' } },
              { album: { contains: query, mode: 'insensitive' } },
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
              { name: { contains: query, mode: 'insensitive' } },
              { city: { contains: query, mode: 'insensitive' } },
              { state: { contains: query, mode: 'insensitive' } },
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
          where: dateFilter.gte || dateFilter.lte ? { created_at: dateFilter } : undefined,
        }),
        prisma.show.count(),
        prisma.artist.count(),
        prisma.user.count({
          where: {
            votes: {
              some: {
                created_at: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
                },
              },
            },
          },
        }),
        prisma.show.findMany({
          where: {
            status: 'UPCOMING',
            date: { gte: new Date() },
          },
          orderBy: { total_votes: 'desc' },
          take: 10,
        }),
        prisma.$queryRaw`
          SELECT u.*, COUNT(v.id) as vote_count
          FROM users u
          JOIN votes v ON v.user_id = u.id
          ${dateFilter.gte ? `WHERE v.created_at >= ${dateFilter.gte}` : ''}
          ${dateFilter.lte ? `${dateFilter.gte ? 'AND' : 'WHERE'} v.created_at <= ${dateFilter.lte}` : ''}
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
        try {
          const redisStart = Date.now()
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