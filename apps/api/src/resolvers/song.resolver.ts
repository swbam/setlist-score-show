import { IResolvers } from '@graphql-tools/utils'
import { GraphQLError } from 'graphql'
import type { Prisma } from '@prisma/client'

export const songResolvers: IResolvers = {
  Query: {
    song: async (_parent, { id }, { prisma }) => {
      const song = await prisma.song.findUnique({
        where: { id },
      })

      if (!song) {
        throw new GraphQLError('Song not found', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      return song
    },

    songs: async (_parent, { filter, orderBy, limit = 50, offset = 0 }, { prisma }) => {
      const where: Prisma.SongWhereInput = {}

      if (filter) {
        if (filter.artistId) {
          where.artist_id = filter.artistId
        }

        if (filter.search) {
          where.OR = [
            { title: { contains: filter.search, mode: 'insensitive' } },
            { album: { contains: filter.search, mode: 'insensitive' } },
          ]
        }

        if (filter.album) {
          where.album = { contains: filter.album, mode: 'insensitive' }
        }

        if (filter.minPopularity !== undefined) {
          where.popularity = { gte: filter.minPopularity }
        }

        if (filter.maxDurationMs !== undefined) {
          where.duration_ms = { lte: filter.maxDurationMs }
        }

        if (filter.hasPreview === true) {
          where.preview_url = { not: null }
        } else if (filter.hasPreview === false) {
          where.preview_url = null
        }
      }

      const orderByMap: Record<string, Prisma.SongOrderByWithRelationInput> = {
        TITLE_ASC: { title: 'asc' },
        TITLE_DESC: { title: 'desc' },
        POPULARITY_ASC: { popularity: 'asc' },
        POPULARITY_DESC: { popularity: 'desc' },
        ALBUM_ASC: { album: 'asc' },
        ALBUM_DESC: { album: 'desc' },
        DURATION_ASC: { duration_ms: 'asc' },
        DURATION_DESC: { duration_ms: 'desc' },
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

    searchSongs: async (_parent, { query, artistId, limit = 20 }, { prisma }) => {
      const where: Prisma.SongWhereInput = {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { album: { contains: query, mode: 'insensitive' } },
          { artist: { name: { contains: query, mode: 'insensitive' } } },
        ],
      }

      if (artistId) {
        where.artist_id = artistId
      }

      return prisma.song.findMany({
        where,
        orderBy: [
          { popularity: 'desc' },
          { title: 'asc' },
        ],
        take: limit,
      })
    },

    topVotedSongs: async (_parent, { showId, limit = 20 }, { prisma }) => {
      return prisma.setlistSong.findMany({
        where: {
          setlist: { show_id: showId },
          vote_count: { gt: 0 },
        },
        orderBy: { vote_count: 'desc' },
        take: limit,
        include: { song: true },
      })
    },

    songsByIds: async (_parent, { ids }, { prisma }) => {
      return prisma.song.findMany({
        where: { id: { in: ids } },
      })
    },
  },

  Mutation: {
    importArtistCatalog: async (_parent, { artistId, includeAlbums = true, includeSingles = true }, { prisma, services, user }) => {
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

      if (!artist.spotify_id) {
        throw new GraphQLError('Artist has no Spotify ID', {
          extensions: { code: 'BAD_REQUEST' },
        })
      }

      if (!services?.spotify) {
        throw new GraphQLError('Spotify service not available', {
          extensions: { code: 'SERVICE_UNAVAILABLE' },
        })
      }

      try {
        const result = await services.spotify.importArtistCatalog(
          artist.spotify_id,
          { includeAlbums, includeSingles }
        )

        // Store imported songs in database
        let itemsImported = 0
        let itemsFailed = 0
        const errors: string[] = []

        for (const track of result.tracks) {
          try {
            await prisma.song.upsert({
              where: { spotify_id: track.id },
              update: {
                title: track.name,
                album: track.album?.name,
                album_image_url: track.album?.images?.[0]?.url,
                duration_ms: track.duration_ms,
                popularity: track.popularity,
                preview_url: track.preview_url,
                spotify_url: track.external_urls?.spotify,
              },
              create: {
                artist_id: artistId,
                spotify_id: track.id,
                title: track.name,
                album: track.album?.name,
                album_image_url: track.album?.images?.[0]?.url,
                duration_ms: track.duration_ms,
                popularity: track.popularity,
                preview_url: track.preview_url,
                spotify_url: track.external_urls?.spotify,
              },
            })
            itemsImported++
          } catch (error: any) {
            itemsFailed++
            errors.push(`Failed to import ${track.name}: ${error.message}`)
          }
        }

        return {
          success: itemsFailed === 0,
          itemsImported,
          itemsFailed,
          errors,
        }
      } catch (error: any) {
        throw new GraphQLError('Failed to import artist catalog', {
          extensions: { 
            code: 'EXTERNAL_SERVICE_ERROR',
            details: error.message,
          },
        })
      }
    },

    updateSong: async (_parent, { id, audioFeatures }, { prisma, user }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      const song = await prisma.song.findUnique({
        where: { id },
      })

      if (!song) {
        throw new GraphQLError('Song not found', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      return prisma.song.update({
        where: { id },
        data: {
          audio_features: audioFeatures ? JSON.stringify(audioFeatures) : undefined,
        },
      })
    },

    createCustomSong: async (_parent, { artistId, title, album, durationMs }, { prisma, user }) => {
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

      return prisma.song.create({
        data: {
          artist_id: artistId,
          title,
          album,
          duration_ms: durationMs,
          popularity: 0,
        },
      })
    },
  },

  Song: {
    artist: async (parent, _args, { loaders }) => {
      return loaders.artist.load(parent.artist_id)
    },

    audioFeatures: (parent) => {
      if (!parent.audio_features) return null
      
      const features = typeof parent.audio_features === 'string'
        ? JSON.parse(parent.audio_features)
        : parent.audio_features

      return {
        acousticness: features.acousticness,
        danceability: features.danceability,
        energy: features.energy,
        instrumentalness: features.instrumentalness,
        key: features.key,
        liveness: features.liveness,
        loudness: features.loudness,
        mode: features.mode,
        speechiness: features.speechiness,
        tempo: features.tempo,
        timeSignature: features.time_signature || features.timeSignature,
        valence: features.valence,
      }
    },

    currentVoteCount: async (parent, { showId }, { prisma }) => {
      const result = await prisma.setlistSong.aggregate({
        where: {
          song_id: parent.id,
          setlist: { show_id: showId },
        },
        _sum: { vote_count: true },
      })

      return result._sum.vote_count || 0
    },

    voteRank: async (parent, { showId }, { prisma }) => {
      const allVotes = await prisma.setlistSong.findMany({
        where: {
          setlist: { show_id: showId },
        },
        orderBy: { vote_count: 'desc' },
        select: { song_id: true },
      })

      const rank = allVotes.findIndex(v => v.song_id === parent.id) + 1
      return rank || null
    },

    hasVoted: async (parent, { showId }, { prisma, user }) => {
      if (!user) return false

      const vote = await prisma.vote.findFirst({
        where: {
          user_id: user.id,
          show_id: showId,
          setlist_song: {
            song_id: parent.id,
          },
        },
      })

      return !!vote
    },
  },
}