// src/resolvers/setlist.resolver.ts
import { IResolvers } from '@graphql-tools/utils'
import { GraphQLError } from 'graphql'
import type { Prisma } from '@prisma/client'

export const setlistResolvers: IResolvers = {
  Query: {
    setlist: async (_parent, { id }, { prisma }) => {
      const setlist = await prisma.setlist.findUnique({
        where: { id }
      })

      if (!setlist) {
        throw new GraphQLError('Setlist not found', {
          extensions: { code: 'NOT_FOUND' }
        })
      }

      return setlist
    },

    setlists: async (_parent, { showId }, { prisma }) => {
      return prisma.setlist.findMany({
        where: { showId: showId },
        orderBy: { orderIndex: 'asc' }
      })
    },

    setlistsByArtist: async (_parent, { artistId, limit = 20, offset = 0 }, { prisma }) => {
      const [setlists, totalCount] = await Promise.all([
        prisma.setlist.findMany({
          where: {
            show: {
              artistId: artistId,
              status: 'completed'
            }
          },
          orderBy: {
            show: {
              date: 'desc'
            }
          },
          take: limit,
          skip: offset
        }),
        prisma.setlist.count({
          where: {
            show: {
              artistId: artistId,
              status: 'completed'
            }
          }
        })
      ])

      const edges = setlists.map((setlist, index) => ({
        node: setlist,
        cursor: Buffer.from(`${offset + index}`).toString('base64')
      }))

      return {
        edges,
        pageInfo: {
          hasNextPage: offset + setlists.length < totalCount,
          hasPreviousPage: offset > 0,
          startCursor: edges[0]?.cursor || null,
          endCursor: edges[edges.length - 1]?.cursor || null
        },
        totalCount
      }
    }
  },

  Mutation: {
    createSetlist: async (_parent, { input }, { prisma, user }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' }
        })
      }

      const { showId, name, songIds, isEncore } = input

      const show = await prisma.show.findUnique({
        where: { id: showId },
        include: { setlists: true }
      })

      if (!show) {
        throw new GraphQLError('Show not found', {
          extensions: { code: 'NOT_FOUND' }
        })
      }

      // Verify all songs exist and belong to the artist
      const songs = await prisma.song.findMany({
        where: {
          id: { in: songIds },
          artistId: show.artistId
        }
      })

      if (songs.length !== songIds.length) {
        throw new GraphQLError('Invalid song IDs provided', {
          extensions: { code: 'BAD_REQUEST' }
        })
      }

      // Determine the order index
      const orderIndex = show.setlists.length

      return prisma.setlist.create({
        data: {
          showId: showId,
          name: name || (isEncore ? 'Encore' : 'Main Set'),
          orderIndex: orderIndex,
          isEncore: isEncore || false,
          setlistSongs: {
            create: songIds.map((songId, index) => ({
              songId: songId,
              position: index + 1,
              voteCount: 0
            }))
          }
        },
        include: {
          setlistSongs: {
            include: { song: true },
            orderBy: { position: 'asc' }
          }
        }
      })
    },

    updateSetlist: async (_parent, { id, input }, { prisma, user }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' }
        })
      }

      const setlist = await prisma.setlist.findUnique({
        where: { id }
      })

      if (!setlist) {
        throw new GraphQLError('Setlist not found', {
          extensions: { code: 'NOT_FOUND' }
        })
      }

      return prisma.setlist.update({
        where: { id },
        data: {
          name: input.name,
          isEncore: input.isEncore
        }
      })
    },

    deleteSetlist: async (_parent, { id }, { prisma, user }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' }
        })
      }

      const setlist = await prisma.setlist.findUnique({
        where: { id },
        include: { show: true }
      })

      if (!setlist) {
        throw new GraphQLError('Setlist not found', {
          extensions: { code: 'NOT_FOUND' }
        })
      }

      // Delete the setlist (cascade will handle setlistSongs)
      await prisma.setlist.delete({
        where: { id }
      })

      // Reorder remaining setlists
      const remainingSetlists = await prisma.setlist.findMany({
        where: { showId: setlist.showId },
        orderBy: { orderIndex: 'asc' }
      })

      await prisma.$transaction(
        remainingSetlists.map((s, index) =>
          prisma.setlist.update({
            where: { id: s.id },
            data: { orderIndex: index }
          })
        )
      )

      return true
    },

    addSongToSetlist: async (_parent, { setlistId, songId, position }, { prisma, user }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' }
        })
      }

      const setlist = await prisma.setlist.findUnique({
        where: { id: setlistId },
        include: { 
          show: true,
          setlistSongs: true 
        }
      })

      if (!setlist) {
        throw new GraphQLError('Setlist not found', {
          extensions: { code: 'NOT_FOUND' }
        })
      }

      // Verify song belongs to the artist
      const song = await prisma.song.findFirst({
        where: {
          id: songId,
          artistId: setlist.show.artistId
        }
      })

      if (!song) {
        throw new GraphQLError('Song not found or does not belong to artist', {
          extensions: { code: 'BAD_REQUEST' }
        })
      }

      // Check if song already in setlist
      const existingSong = setlist.setlistSongs.find(ss => ss.songId === songId)
      if (existingSong) {
        throw new GraphQLError('Song already in setlist', {
          extensions: { code: 'CONFLICT' }
        })
      }

      // If no position specified, add to end
      const targetPosition = position || setlist.setlistSongs.length + 1

      // Shift positions if inserting in middle
      if (targetPosition <= setlist.setlistSongs.length) {
        await prisma.setlistSong.updateMany({
          where: {
            setlistId: setlistId,
            position: { gte: targetPosition }
          },
          data: {
            position: { increment: 1 }
          }
        })
      }

      return prisma.setlistSong.create({
        data: {
          setlistId: setlistId,
          songId: songId,
          position: targetPosition,
          voteCount: 0
        },
        include: {
          song: true
        }
      })
    },

    removeSongFromSetlist: async (_parent, { setlistId, songId }, { prisma, user }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' }
        })
      }

      const setlistSong = await prisma.setlistSong.findFirst({
        where: {
          setlistId: setlistId,
          songId: songId
        }
      })

      if (!setlistSong) {
        throw new GraphQLError('Song not found in setlist', {
          extensions: { code: 'NOT_FOUND' }
        })
      }

      // Delete the song
      await prisma.setlistSong.delete({
        where: { id: setlistSong.id }
      })

      // Reorder remaining songs
      await prisma.setlistSong.updateMany({
        where: {
          setlistId: setlistId,
          position: { gt: setlistSong.position }
        },
        data: {
          position: { decrement: 1 }
        }
      })

      return true
    },

    reorderSetlistSongs: async (_parent, { setlistId, songPositions }, { prisma, user }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' }
        })
      }

      const setlist = await prisma.setlist.findUnique({
        where: { id: setlistId },
        include: { setlistSongs: true }
      })

      if (!setlist) {
        throw new GraphQLError('Setlist not found', {
          extensions: { code: 'NOT_FOUND' }
        })
      }

      // Verify all songs belong to setlist
      const setlistSongIds = setlist.setlistSongs.map(ss => ss.songId)
      const providedSongIds = songPositions.map(sp => sp.songId)
      
      if (!providedSongIds.every(id => setlistSongIds.includes(id))) {
        throw new GraphQLError('Invalid song IDs provided', {
          extensions: { code: 'BAD_REQUEST' }
        })
      }

      // Update positions in a transaction
      await prisma.$transaction(
        songPositions.map(({ songId, position }) =>
          prisma.setlistSong.updateMany({
            where: {
              setlistId: setlistId,
              songId: songId
            },
            data: { position }
          })
        )
      )

      return prisma.setlist.findUnique({
        where: { id: setlistId },
        include: {
          setlistSongs: {
            include: { song: true },
            orderBy: { position: 'asc' }
          }
        }
      })
    }
  },

  Setlist: {
    show: async (parent, _args, { loaders }) => {
      return loaders.show.load(parent.showId)
    },

    songs: async (parent, _args, { prisma }) => {
      return prisma.setlistSong.findMany({
        where: { setlistId: parent.id },
        orderBy: { position: 'asc' }
      })
    },

    totalSongs: async (parent, _args, { prisma }) => {
      return prisma.setlistSong.count({
        where: { setlistId: parent.id }
      })
    },

    totalVotes: async (parent, _args, { prisma }) => {
      const result = await prisma.setlistSong.aggregate({
        where: { setlistId: parent.id },
        _sum: { voteCount: true }
      })
      return result._sum.voteCount || 0
    },

    topVotedSongs: async (parent, { limit = 5 }, { prisma }) => {
      return prisma.setlistSong.findMany({
        where: { setlistId: parent.id },
        orderBy: { voteCount: 'desc' },
        take: limit,
        include: { song: true }
      })
    }
  },

  SetlistSong: {
    setlist: async (parent, _args, { loaders }) => {
      return loaders.setlist.load(parent.setlistId)
    },

    song: async (parent, _args, { loaders }) => {
      return loaders.song.load(parent.songId)
    },

    hasVoted: async (parent, _args, { prisma, user }) => {
      if (!user) return false

      const vote = await prisma.vote.findFirst({
        where: {
          userId: user.id,
          setlistSongId: parent.id
        }
      })

      return !!vote
    },

    hasUserVoted: async (parent, _args, { prisma, user }) => {
      if (!user) return false

      const vote = await prisma.vote.findFirst({
        where: {
          userId: user.id,
          setlistSongId: parent.id
        }
      })

      return !!vote
    },

    votePercentage: async (parent, _args, { prisma }) => {
      const totalVotes = await prisma.setlistSong.aggregate({
        where: {
          setlistId: parent.setlistId
        },
        _sum: { voteCount: true }
      })

      const total = totalVotes._sum.voteCount || 0
      if (total === 0) return 0

      return (parent.voteCount / total) * 100
    },

    rank: async (parent, _args, { prisma }) => {
      const higherRanked = await prisma.setlistSong.count({
        where: {
          setlistId: parent.setlistId,
          voteCount: { gt: parent.voteCount }
        }
      })

      return higherRanked + 1
    }
  }
}