// src/resolvers/venue.resolver.ts
import { IResolvers } from '@graphql-tools/utils'
import { GraphQLError } from 'graphql'
import type { Prisma } from '@prisma/client'

export const venueResolvers: IResolvers = {
  Query: {
    venue: async (_parent, { id }, { prisma }) => {
      const venue = await prisma.venue.findUnique({
        where: { id }
      })

      if (!venue) {
        throw new GraphQLError('Venue not found', {
          extensions: { code: 'NOT_FOUND' }
        })
      }

      return venue
    },

    venues: async (_parent, { filter, orderBy, limit = 20, offset = 0 }, { prisma }) => {
      const where: Prisma.VenueWhereInput = {}

      if (filter) {
        if (filter.city) {
          where.city = { contains: filter.city, mode: 'insensitive' }
        }

        if (filter.state) {
          where.state = { contains: filter.state, mode: 'insensitive' }
        }

        if (filter.country) {
          where.country = { contains: filter.country, mode: 'insensitive' }
        }

        if (filter.search) {
          where.OR = [
            { name: { contains: filter.search, mode: 'insensitive' } },
            { city: { contains: filter.search, mode: 'insensitive' } },
            { address: { contains: filter.search, mode: 'insensitive' } }
          ]
        }

        if (filter.hasUpcomingShows) {
          where.shows = {
            some: {
              date: { gte: new Date() },
              status: 'upcoming'
            }
          }
        }
      }

      const orderByMap: Record<string, Prisma.VenueOrderByWithRelationInput> = {
        NAME_ASC: { name: 'asc' },
        NAME_DESC: { name: 'desc' },
        CITY_ASC: { city: 'asc' },
        CITY_DESC: { city: 'desc' },
        CAPACITY_DESC: { capacity: 'desc' },
        CAPACITY_ASC: { capacity: 'asc' }
      }

      const [venues, totalCount] = await Promise.all([
        prisma.venue.findMany({
          where,
          orderBy: orderByMap[orderBy || 'NAME_ASC'],
          take: limit,
          skip: offset
        }),
        prisma.venue.count({ where })
      ])

      const edges = venues.map((venue, index) => ({
        node: venue,
        cursor: Buffer.from(`${offset + index}`).toString('base64')
      }))

      return {
        edges,
        pageInfo: {
          hasNextPage: offset + venues.length < totalCount,
          hasPreviousPage: offset > 0,
          startCursor: edges[0]?.cursor || null,
          endCursor: edges[edges.length - 1]?.cursor || null
        },
        totalCount
      }
    },

    venuesNearLocation: async (_parent, { latitude, longitude, radiusMiles = 50, limit = 20 }, { prisma }) => {
      const radiusKm = radiusMiles * 1.60934
      
      const venues = await prisma.$queryRaw`
        SELECT *,
          (
            6371 * acos(
              cos(radians(${latitude})) * cos(radians(latitude)) *
              cos(radians(longitude) - radians(${longitude})) +
              sin(radians(${latitude})) * sin(radians(latitude))
            )
          ) AS distance_km
        FROM venues
        WHERE latitude IS NOT NULL 
          AND longitude IS NOT NULL
        HAVING distance_km <= ${radiusKm}
        ORDER BY distance_km ASC
        LIMIT ${limit}
      `

      return venues
    },

    venuesByArtist: async (_parent, { artistId, limit = 20 }, { prisma }) => {
      const venues = await prisma.$queryRaw`
        SELECT DISTINCT v.*, COUNT(s.id) as show_count
        FROM venues v
        JOIN shows s ON v.id = s."venueId"
        WHERE s."artistId" = ${artistId}
        GROUP BY v.id
        ORDER BY show_count DESC
        LIMIT ${limit}
      `

      return venues
    }
  },

  Mutation: {
    createVenue: async (_parent, { input }, { prisma, user }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' }
        })
      }

      // Check if venue already exists
      if (input.ticketmasterId) {
        const existing = await prisma.venue.findUnique({
          where: { ticketmasterId: input.ticketmasterId }
        })

        if (existing) {
          throw new GraphQLError('Venue with this Ticketmaster ID already exists', {
            extensions: { code: 'CONFLICT' }
          })
        }
      }

      if (input.setlistfmId) {
        const existing = await prisma.venue.findUnique({
          where: { setlistfmId: input.setlistfmId }
        })

        if (existing) {
          throw new GraphQLError('Venue with this Setlist.fm ID already exists', {
            extensions: { code: 'CONFLICT' }
          })
        }
      }

      return prisma.venue.create({
        data: {
          ticketmasterId: input.ticketmasterId,
          setlistfmId: input.setlistfmId,
          name: input.name,
          address: input.address,
          city: input.city,
          state: input.state,
          country: input.country,
          postalCode: input.postalCode,
          latitude: input.latitude,
          longitude: input.longitude,
          timezone: input.timezone,
          capacity: input.capacity
        }
      })
    },

    updateVenue: async (_parent, { id, input }, { prisma, user }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' }
        })
      }

      const venue = await prisma.venue.findUnique({
        where: { id }
      })

      if (!venue) {
        throw new GraphQLError('Venue not found', {
          extensions: { code: 'NOT_FOUND' }
        })
      }

      return prisma.venue.update({
        where: { id },
        data: input
      })
    },

    mergeVenues: async (_parent, { sourceId, targetId }, { prisma, user }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' }
        })
      }

      const [source, target] = await Promise.all([
        prisma.venue.findUnique({ where: { id: sourceId } }),
        prisma.venue.findUnique({ where: { id: targetId } })
      ])

      if (!source || !target) {
        throw new GraphQLError('Source or target venue not found', {
          extensions: { code: 'NOT_FOUND' }
        })
      }

      // Move all shows from source to target
      await prisma.show.updateMany({
        where: { venueId: sourceId },
        data: { venueId: targetId }
      })

      // Merge external IDs
      const updateData: Prisma.VenueUpdateInput = {}
      
      if (source.ticketmasterId && !target.ticketmasterId) {
        updateData.ticketmasterId = source.ticketmasterId
      }
      
      if (source.setlistfmId && !target.setlistfmId) {
        updateData.setlistfmId = source.setlistfmId
      }

      if (source.capacity && !target.capacity) {
        updateData.capacity = source.capacity
      }

      if (source.latitude && !target.latitude) {
        updateData.latitude = source.latitude
        updateData.longitude = source.longitude
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.venue.update({
          where: { id: targetId },
          data: updateData
        })
      }

      // Delete source venue
      await prisma.venue.delete({
        where: { id: sourceId }
      })

      return prisma.venue.findUnique({
        where: { id: targetId }
      })
    }
  },

  Venue: {
    shows: async (parent, { status, limit = 20, offset = 0 }, { prisma }) => {
      const where: Prisma.ShowWhereInput = {
        venueId: parent.id
      }

      if (status) {
        where.status = status
      }

      const [shows, totalCount] = await Promise.all([
        prisma.show.findMany({
          where,
          orderBy: { date: 'desc' },
          take: limit,
          skip: offset
        }),
        prisma.show.count({ where })
      ])

      const edges = shows.map((show, index) => ({
        node: show,
        cursor: Buffer.from(`${offset + index}`).toString('base64')
      }))

      return {
        edges,
        pageInfo: {
          hasNextPage: offset + shows.length < totalCount,
          hasPreviousPage: offset > 0,
          startCursor: edges[0]?.cursor || null,
          endCursor: edges[edges.length - 1]?.cursor || null
        },
        totalCount
      }
    },

    upcomingShows: async (parent, { limit = 10 }, { prisma }) => {
      return prisma.show.findMany({
        where: {
          venueId: parent.id,
          date: { gte: new Date() },
          status: 'upcoming'
        },
        orderBy: { date: 'asc' },
        take: limit
      })
    },

    recentShows: async (parent, { limit = 10 }, { prisma }) => {
      return prisma.show.findMany({
        where: {
          venueId: parent.id,
          date: { lt: new Date() },
          status: 'completed'
        },
        orderBy: { date: 'desc' },
        take: limit
      })
    },

    totalShows: async (parent, _args, { prisma }) => {
      return prisma.show.count({
        where: { venueId: parent.id }
      })
    },

    artists: async (parent, { limit = 20 }, { prisma }) => {
      const artists = await prisma.$queryRaw`
        SELECT DISTINCT a.*, COUNT(s.id) as show_count
        FROM artists a
        JOIN shows s ON a.id = s."artistId"
        WHERE s."venueId" = ${parent.id}
        GROUP BY a.id
        ORDER BY show_count DESC
        LIMIT ${limit}
      `

      return artists
    },

    upcomingShowCount: async (parent, _args, { prisma }) => {
      return prisma.show.count({
        where: {
          venueId: parent.id,
          date: { gte: new Date() },
          status: 'upcoming'
        }
      })
    },

    nextShow: async (parent, _args, { prisma }) => {
      return prisma.show.findFirst({
        where: {
          venueId: parent.id,
          date: { gte: new Date() },
          status: 'upcoming'
        },
        orderBy: { date: 'asc' }
      })
    },

    stats: async (parent, _args, { prisma }) => {
      const [totalShows, totalArtists, totalVotes, popularGenres] = await Promise.all([
        prisma.show.count({
          where: { venueId: parent.id }
        }),
        prisma.show.groupBy({
          by: ['artistId'],
          where: { venueId: parent.id },
          _count: true
        }).then(result => result.length),
        prisma.$queryRaw`
          SELECT COALESCE(SUM(ss."voteCount"), 0) as total_votes
          FROM venues v
          JOIN shows s ON v.id = s."venueId"
          JOIN setlists sl ON s.id = sl."showId"
          JOIN "setlistSongs" ss ON sl.id = ss."setlistId"
          WHERE v.id = ${parent.id}
        `.then((result: any) => result[0]?.total_votes || 0),
        prisma.$queryRaw`
          SELECT a.genres, COUNT(*) as show_count
          FROM venues v
          JOIN shows s ON v.id = s."venueId"
          JOIN artists a ON s."artistId" = a.id
          WHERE v.id = ${parent.id}
          GROUP BY a.genres
          ORDER BY show_count DESC
          LIMIT 10
        `.then((result: any) => {
          const genreCounts: Record<string, number> = {}
          result.forEach((row: any) => {
            if (row.genres && Array.isArray(row.genres)) {
              row.genres.forEach((genre: string) => {
                genreCounts[genre] = (genreCounts[genre] || 0) + Number(row.show_count)
              })
            }
          })
          return Object.entries(genreCounts)
            .map(([genre, count]) => ({ genre, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
        })
      ])

      return {
        totalShows,
        totalArtists,
        totalVotes,
        averageAttendance: null, // Could be calculated if we had attendance data
        popularGenres
      }
    },

    distanceFrom: (parent, { latitude, longitude }) => {
      if (!parent.latitude || !parent.longitude) return null

      // Haversine formula
      const R = 6371 // Earth's radius in km
      const dLat = (latitude - Number(parent.latitude)) * Math.PI / 180
      const dLon = (longitude - Number(parent.longitude)) * Math.PI / 180
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(Number(parent.latitude) * Math.PI / 180) * 
        Math.cos(latitude * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2)
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
      const distance = R * c

      return {
        kilometers: distance,
        miles: distance * 0.621371
      }
    }
  }
}