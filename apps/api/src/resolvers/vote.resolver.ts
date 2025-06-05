import { IResolvers } from '@graphql-tools/utils'
import { GraphQLError } from 'graphql'
import { VotingService } from '../services/voting.service'

export const voteResolvers: IResolvers = {
  Query: {
    voteLimits: async (_parent, { showId }, { prisma, user }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      const [dailyVotes, showVotes] = await Promise.all([
        prisma.vote.count({
          where: {
            userId: user.id,
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
        prisma.vote.count({
          where: {
            userId: user.id,
            showId: showId,
          },
        }),
      ])

      return {
        dailyLimit: 50,
        dailyUsed: dailyVotes,
        dailyRemaining: Math.max(0, 50 - dailyVotes),
        showLimit: 10,
        showUsed: showVotes,
        showRemaining: Math.max(0, 10 - showVotes),
      }
    },

    myVotes: async (_parent, { showId, limit = 50, offset = 0 }, { prisma, user }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      const where = {
        userId: user.id,
        ...(showId && { showId: showId }),
      }

      return prisma.vote.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      })
    },

    myVoteStats: async (_parent, _args, { prisma, user }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      const [totalVotes, todayVotes, favoriteArtists, recentVotes] = await Promise.all([
        prisma.vote.count({ where: { userId: user.id } }),
        prisma.vote.count({
          where: {
            userId: user.id,
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
        prisma.$queryRaw`
          SELECT a.*, COUNT(v.id) as "voteCount", MAX(v."createdAt") as "lastVotedAt"
          FROM votes v
          JOIN "setlistSongs" ss ON v."setlistSongId" = ss.id
          JOIN setlists sl ON ss."setlistId" = sl.id
          JOIN shows s ON sl."showId" = s.id
          JOIN artists a ON s."artistId" = a.id
          WHERE v."userId" = ${user.id}
          GROUP BY a.id
          ORDER BY "voteCount" DESC
          LIMIT 5
        `,
        prisma.vote.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ])

      // Calculate voting streak
      const streakQuery = await prisma.$queryRaw`
        SELECT COUNT(DISTINCT DATE("createdAt")) as streak
        FROM votes
        WHERE "userId" = ${user.id}
        AND "createdAt" >= CURRENT_DATE - INTERVAL '30 days'
      `
      const votingStreak = streakQuery[0]?.streak || 0

      return {
        totalVotes,
        todayVotes,
        favoriteArtists: favoriteArtists.map((artist: any) => ({
          artist,
          voteCount: artist.voteCount,
          lastVotedAt: artist.lastVotedAt,
        })),
        recentVotes,
        votingStreak,
        achievements: [], // TODO: Implement achievements system
      }
    },

    hasVoted: async (_parent, { setlistSongIds }, { prisma, user }) => {
      if (!user) {
        return setlistSongIds.map(() => false)
      }

      const votes = await prisma.vote.findMany({
        where: {
          userId: user.id,
          setlistSongId: { in: setlistSongIds },
        },
        select: { setlistSongId: true },
      })

      const votedIds = new Set(votes.map((v) => v.setlistSongId))
      return setlistSongIds.map((id) => votedIds.has(id))
    },

    userVotes: async (_parent, { showId }, { prisma, user }) => {
      if (!user) {
        return []
      }

      const votes = await prisma.vote.findMany({
        where: {
          userId: user.id,
          showId: showId,
        },
        select: { setlistSongId: true },
      })

      return votes.map(vote => ({ setlistSongId: vote.setlistSongId }))
    },
  },

  Mutation: {
    vote: async (_parent, { input }, { prisma, redis, supabase, user }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      const votingService = new VotingService(prisma, redis, supabase)
      
      try {
        const result = await votingService.castVote({
          userId: user.id,
          showId: input.showId,
          songId: input.songId,
          setlistSongId: input.setlistSongId,
        })
        
        return result
      } catch (error: any) {
        if (error.code === 'TOO_MANY_REQUESTS') {
          throw new GraphQLError(error.message, {
            extensions: { code: 'TOO_MANY_REQUESTS' },
          })
        }
        if (error.code === 'FORBIDDEN') {
          throw new GraphQLError(error.message, {
            extensions: { code: 'FORBIDDEN' },
          })
        }
        if (error.code === 'CONFLICT') {
          throw new GraphQLError(error.message, {
            extensions: { code: 'CONFLICT' },
          })
        }
        throw error
      }
    },

    castVote: async (_parent, { showId, setlistSongId }, { prisma, redis, supabase, user }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      const votingService = new VotingService(prisma, redis, supabase)
      
      try {
        const result = await votingService.castVote({
          userId: user.id,
          showId: showId,
          songId: '', // We don't have songId in this simplified interface
          setlistSongId: setlistSongId,
        })
        
        return result
      } catch (error: any) {
        if (error.code === 'TOO_MANY_REQUESTS') {
          throw new GraphQLError(error.message, {
            extensions: { code: 'TOO_MANY_REQUESTS' },
          })
        }
        if (error.code === 'FORBIDDEN') {
          throw new GraphQLError(error.message, {
            extensions: { code: 'FORBIDDEN' },
          })
        }
        if (error.code === 'CONFLICT') {
          throw new GraphQLError(error.message, {
            extensions: { code: 'CONFLICT' },
          })
        }
        throw error
      }
    },

    unvote: async (_parent, { voteId }, { prisma, redis, user }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      const vote = await prisma.vote.findUnique({
        where: { id: voteId },
        include: {
          setlistSong: true,
        },
      })

      if (!vote) {
        throw new GraphQLError('Vote not found', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      if (vote.userId !== user.id) {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      // Check if vote is within 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      if (vote.createdAt < fiveMinutesAgo) {
        throw new GraphQLError('Cannot unvote after 5 minutes', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      // Delete vote and update count in transaction
      const result = await prisma.$transaction(async (tx) => {
        await tx.vote.delete({ where: { id: voteId } })
        
        const updatedSetlistSong = await tx.setlistSong.update({
          where: { id: vote.setlistSongId },
          data: {
            voteCount: {
              decrement: 1,
            },
          },
        })

        return updatedSetlistSong
      })

      // Clear cache
      await redis.del(`show:${vote.showId}:songs`)

      return {
        success: true,
        voteId: null,
        newVoteCount: result.voteCount,
        dailyVotesRemaining: 0, // TODO: Calculate actual remaining
        showVotesRemaining: 0, // TODO: Calculate actual remaining
        message: 'Vote removed successfully',
      }
    },

    batchVote: async (_parent, { votes }, { prisma, redis, supabase, user }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      const votingService = new VotingService(prisma, redis, supabase)
      
      const results = await Promise.allSettled(
        votes.map((voteInput) =>
          votingService.castVote({
            userId: user.id,
            showId: voteInput.showId,
            songId: voteInput.songId,
            setlistSongId: voteInput.setlistSongId,
          })
        )
      )

      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value
        } else {
          return {
            success: false,
            voteId: null,
            newVoteCount: 0,
            dailyVotesRemaining: 0,
            showVotesRemaining: 0,
            message: result.reason?.message || 'Vote failed',
          }
        }
      })
    },
  },

  Vote: {
    user: async (parent, _args, { prisma }) => {
      return prisma.user.findUnique({
        where: { id: parent.userId },
      })
    },

    setlistSong: async (parent, _args, { prisma }) => {
      return prisma.setlistSong.findUnique({
        where: { id: parent.setlistSongId },
      })
    },

    show: async (parent, _args, { prisma }) => {
      return prisma.show.findUnique({
        where: { id: parent.showId },
      })
    },
  },

  VoteAnalytics: {
    user: async (parent, _args, { prisma }) => {
      return prisma.user.findUnique({
        where: { id: parent.userId },
      })
    },

    show: async (parent, _args, { prisma }) => {
      return prisma.show.findUnique({
        where: { id: parent.showId },
      })
    },
  },
}