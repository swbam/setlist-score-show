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
      // Enhanced trending algorithm that includes shows without votes but with other trending indicators
      const trendingData = await prisma.$queryRaw`
        WITH enhanced_trending AS (
          SELECT 
            s.id,
            s.date,
            s.title,
            s.status,
            s.view_count,
            s.artist_id,
            s.venue_id,
            s.created_at,
            a.name as artist_name,
            a.slug as artist_slug,
            a.image_url as artist_image_url,
            a.popularity as artist_popularity,
            a.followers as artist_followers,
            v.name as venue_name,
            v.city as venue_city,
            v.state as venue_state,
            v.country as venue_country,
            COALESCE(vote_stats.total_votes, 0) as total_votes,
            COALESCE(vote_stats.unique_voters, 0) as unique_voters,
            EXTRACT(DAY FROM (s.date::timestamp - CURRENT_DATE::timestamp)) as days_until_show,
            -- Enhanced trending score calculation
            (
              -- Vote activity (40% weight)
              (COALESCE(vote_stats.total_votes, 0) * 2.0 + COALESCE(vote_stats.unique_voters, 0) * 3.0) * 0.4 +
              -- View activity (20% weight) 
              (s.view_count * 0.5) * 0.2 +
              -- Artist popularity (25% weight)
              (a.popularity * 0.1 + a.followers * 0.01) * 0.25 +
              -- Recency boost (15% weight) - newer shows get a boost
              (CASE 
                WHEN s.created_at > CURRENT_DATE - INTERVAL '7 days' THEN 100
                WHEN s.created_at > CURRENT_DATE - INTERVAL '30 days' THEN 50
                ELSE 10
              END) * 0.15
            ) * 
            -- Time urgency multiplier
            (CASE 
              WHEN EXTRACT(DAY FROM (s.date::timestamp - CURRENT_DATE::timestamp)) <= 7 THEN 2.0
              WHEN EXTRACT(DAY FROM (s.date::timestamp - CURRENT_DATE::timestamp)) <= 30 THEN 1.5
              ELSE 1.0
            END) as enhanced_trending_score
          FROM shows s
          JOIN artists a ON s.artist_id = a.id
          JOIN venues v ON s.venue_id = v.id
          LEFT JOIN (
            SELECT 
              s.id as show_id,
              COUNT(DISTINCT v.id) as total_votes,
              COUNT(DISTINCT v.user_id) as unique_voters
            FROM shows s
            LEFT JOIN setlists sl ON sl.show_id = s.id
            LEFT JOIN setlist_songs ss ON ss.setlist_id = sl.id
            LEFT JOIN votes v ON v.setlist_song_id = ss.id
            GROUP BY s.id
          ) vote_stats ON vote_stats.show_id = s.id
          WHERE s.status IN ('upcoming', 'ongoing')
            AND s.date >= CURRENT_DATE
            AND s.date <= CURRENT_DATE + INTERVAL '180 days'
        ),
        ranked_shows AS (
          SELECT 
            *,
            ROW_NUMBER() OVER (PARTITION BY artist_id ORDER BY enhanced_trending_score DESC) as rn
          FROM enhanced_trending
        )
        SELECT *
        FROM ranked_shows
        WHERE rn = 1  -- Only 1 show per artist to ensure diversity
        ORDER BY enhanced_trending_score DESC
        LIMIT ${limit}
      `

      // Transform raw data to match GraphQL schema
      return (trendingData as any[]).map((row: any) => ({
        id: row.id,
        date: row.date,
        title: row.title,
        status: row.status,
        ticketmasterUrl: null, // Not available in the view
        viewCount: parseInt(row.view_count || '0'),
        totalVotes: parseInt(row.total_votes || '0'),
        uniqueVoters: parseInt(row.unique_voters || '0'),
        trendingScore: parseFloat(row.enhanced_trending_score || '0'),
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
      if (loaders?.artist) {
        return loaders.artist.load(parent.artistId)
      }
      return prisma.artist.findUnique({
        where: { id: parent.artistId }
      })
    },

    venue: async (parent, _args, { prisma, loaders }) => {
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