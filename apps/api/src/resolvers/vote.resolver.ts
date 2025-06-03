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
            user_id: user.id,
            created_at: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
        prisma.vote.count({
          where: {
            user_id: user.id,
            show_id: showId,
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
        user_id: user.id,
        ...(showId && { show_id: showId }),
      }

      return prisma.vote.findMany({
        where,
        orderBy: { created_at: 'desc' },
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
        prisma.vote.count({ where: { user_id: user.id } }),
        prisma.vote.count({
          where: {
            user_id: user.id,
            created_at: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
        prisma.$queryRaw`
          SELECT a.*, COUNT(v.id) as vote_count, MAX(v.created_at) as last_voted_at
          FROM votes v
          JOIN setlist_songs ss ON v.setlist_song_id = ss.id
          JOIN setlists sl ON ss.setlist_id = sl.id
          JOIN shows s ON sl.show_id = s.id
          JOIN artists a ON s.artist_id = a.id
          WHERE v.user_id = ${user.id}
          GROUP BY a.id
          ORDER BY vote_count DESC
          LIMIT 5
        `,
        prisma.vote.findMany({
          where: { user_id: user.id },
          orderBy: { created_at: 'desc' },
          take: 10,
        }),
      ])

      // Calculate voting streak
      const streakQuery = await prisma.$queryRaw`
        SELECT COUNT(DISTINCT DATE(created_at)) as streak
        FROM votes
        WHERE user_id = ${user.id}
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
      `
      const votingStreak = streakQuery[0]?.streak || 0

      return {
        totalVotes,
        todayVotes,
        favoriteArtists: favoriteArtists.map((artist: any) => ({
          artist,
          voteCount: artist.vote_count,
          lastVotedAt: artist.last_voted_at,
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
          user_id: user.id,
          setlist_song_id: { in: setlistSongIds },
        },
        select: { setlist_song_id: true },
      })

      const votedIds = new Set(votes.map((v) => v.setlist_song_id))
      return setlistSongIds.map((id) => votedIds.has(id))
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

    unvote: async (_parent, { voteId }, { prisma, redis, user }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      const vote = await prisma.vote.findUnique({
        where: { id: voteId },
        include: {
          setlist_song: true,
        },
      })

      if (!vote) {
        throw new GraphQLError('Vote not found', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      if (vote.user_id !== user.id) {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      // Check if vote is within 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      if (vote.created_at < fiveMinutesAgo) {
        throw new GraphQLError('Cannot unvote after 5 minutes', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      // Delete vote and update count in transaction
      const result = await prisma.$transaction(async (tx) => {
        await tx.vote.delete({ where: { id: voteId } })
        
        const updatedSetlistSong = await tx.setlistSong.update({
          where: { id: vote.setlist_song_id },
          data: {
            vote_count: {
              decrement: 1,
            },
          },
        })

        return updatedSetlistSong
      })

      // Clear cache
      await redis.del(`show:${vote.show_id}:songs`)

      return {
        success: true,
        voteId: null,
        newVoteCount: result.vote_count,
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
        where: { id: parent.user_id },
      })
    },

    setlistSong: async (parent, _args, { prisma }) => {
      return prisma.setlistSong.findUnique({
        where: { id: parent.setlist_song_id },
      })
    },

    show: async (parent, _args, { prisma }) => {
      return prisma.show.findUnique({
        where: { id: parent.show_id },
      })
    },
  },

  VoteAnalytics: {
    user: async (parent, _args, { prisma }) => {
      return prisma.user.findUnique({
        where: { id: parent.user_id },
      })
    },

    show: async (parent, _args, { prisma }) => {
      return prisma.show.findUnique({
        where: { id: parent.show_id },
      })
    },
  },
}