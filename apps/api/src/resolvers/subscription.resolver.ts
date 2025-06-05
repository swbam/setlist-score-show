import { IResolvers } from '@graphql-tools/utils'
import { GraphQLError } from 'graphql'
import { withFilter } from 'graphql-subscriptions'

export const subscriptionResolvers: IResolvers = {
  Subscription: {
    voteUpdates: {
      subscribe: withFilter(
        (_parent, _args, { pubsub }) => pubsub.asyncIterator(['VOTE_UPDATE']),
        (payload, variables) => {
          // Only send updates for the requested show
          return payload.voteUpdate.showId === variables.showId
        }
      ),
      resolve: (payload) => payload.voteUpdate,
    },

    votingActivity: {
      subscribe: withFilter(
        (_parent, _args, { pubsub }) => pubsub.asyncIterator(['VOTING_ACTIVITY']),
        (payload, variables) => {
          // Only send activity for the requested show
          return payload.votingActivity.showId === variables.showId
        }
      ),
      resolve: async (payload, _args, { prisma }) => {
        const showId = payload.votingActivity.showId
        
        // Get active users in the last 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
        const activeUsersResult = await prisma.vote.groupBy({
          by: ['userId'],
          where: {
            showId: showId,
            createdAt: { gte: fiveMinutesAgo },
          },
        })

        // Get recent votes
        const recentVotes = await prisma.vote.findMany({
          where: {
            showId: showId,
            createdAt: { gte: fiveMinutesAgo },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            setlistSong: {
              include: { song: true },
            },
          },
        })

        // Get top movers (songs with most votes in last hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
        const topMovers = await prisma.$queryRaw`
          SELECT ss.*, s.title as song_title,
                 COUNT(v.id) as recent_votes
          FROM setlist_songs ss
          JOIN songs s ON ss."songId" = s.id
          JOIN setlists sl ON ss."setlistId" = sl.id
          LEFT JOIN votes v ON v."setlistSongId" = ss.id 
            AND v."createdAt" >= ${oneHourAgo}
          WHERE sl."showId" = ${showId}
          GROUP BY ss.id, s.title
          ORDER BY recent_votes DESC
          LIMIT 5
        `

        return {
          activeUsers: activeUsersResult.length,
          recentVotes: recentVotes.map(vote => ({
            setlistSongId: vote.setlistSongId,
            songId: vote.setlistSong.songId,
            newVoteCount: vote.setlistSong.voteCount,
            songTitle: vote.setlistSong.song.title,
            voterId: vote.userId,
            timestamp: vote.createdAt,
          })),
          topMovers,
        }
      },
    },
  },
}