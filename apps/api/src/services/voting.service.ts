// src/services/voting.service.ts
import { PrismaClient } from '@setlist/database'
import Redis from 'ioredis'
import { SupabaseClient } from '@supabase/supabase-js'
import { GraphQLError } from 'graphql'

interface VoteInput {
  userId: string
  showId: string
  songId: string
  setlistSongId: string
}

export class VotingService {
  constructor(
    private prisma: PrismaClient,
    private redis: Redis,
    private supabase: SupabaseClient
  ) {}

  async castVote(input: VoteInput) {
    const { userId, showId, songId, setlistSongId } = input

    // Rate limiting check
    const rateLimitKey = `ratelimit:vote:${userId}`
    const attempts = await this.redis.incr(rateLimitKey)
    
    if (attempts === 1) {
      await this.redis.expire(rateLimitKey, 60) // 1 minute window
    }
    
    if (attempts > 5) {
      throw new GraphQLError('Rate limit exceeded. Try again in a minute.', {
        extensions: { code: 'TOO_MANY_REQUESTS' }
      })
    }

    // Check vote limits
    const [dailyVotes, showVotes] = await Promise.all([
      this.prisma.vote.count({
        where: {
          userId: userId,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      this.prisma.vote.count({
        where: {
          userId: userId,
          showId: showId
        }
      })
    ])

    if (dailyVotes >= 50) {
      throw new GraphQLError('Daily vote limit reached (50 votes)', {
        extensions: { code: 'FORBIDDEN' }
      })
    }

    if (showVotes >= 10) {
      throw new GraphQLError('Show vote limit reached (10 votes per show)', {
        extensions: { code: 'FORBIDDEN' }
      })
    }

    // Transaction for vote
    const result = await this.prisma.$transaction(async (tx) => {
      // Check if already voted
      const existingVote = await tx.vote.findUnique({
        where: {
          unique_user_song_vote: {
            userId: userId,
            setlistSongId: setlistSongId
          }
        }
      })

      if (existingVote) {
        throw new GraphQLError('Already voted for this song', {
          extensions: { code: 'CONFLICT' }
        })
      }

      // Create vote
      const vote = await tx.vote.create({
        data: {
          userId: userId,
          setlistSongId: setlistSongId,
          showId: showId,
          voteType: 'up'
        }
      })

      // Update vote count
      const updatedSetlistSong = await tx.setlistSong.update({
        where: { id: setlistSongId },
        data: {
          voteCount: {
            increment: 1
          }
        },
        include: {
          song: true
        }
      })

      // Update analytics
      await tx.voteAnalytics.upsert({
        where: {
          unique_user_show_analytics: {
            userId: userId,
            showId: showId
          }
        },
        create: {
          userId: userId,
          showId: showId,
          dailyVotes: 1,
          showVotes: 1,
          lastVoteAt: new Date()
        },
        update: {
          dailyVotes: {
            increment: 1
          },
          showVotes: {
            increment: 1
          },
          lastVoteAt: new Date()
        }
      })

      return { vote, updatedSetlistSong }
    })

    // Invalidate cache
    await this.redis.del(`show:${showId}:songs`)
    
    // Broadcast update via Supabase Realtime
    // Note: Since we're using database changes, Supabase automatically
    // broadcasts the change to all subscribers. But we can also send
    // custom messages for additional context:
    await this.supabase.channel(`show:${showId}`)
      .send({
        type: 'broadcast',
        event: 'vote_update',
        payload: {
          setlistSongId,
          songId,
          newVoteCount: result.updatedSetlistSong.voteCount,
          songTitle: result.updatedSetlistSong.song.title,
          voterId: userId
        }
      })

    return {
      success: true,
      voteId: result.vote.id,
      dailyVotesRemaining: 50 - dailyVotes - 1,
      showVotesRemaining: 10 - showVotes - 1,
      newVoteCount: result.updatedSetlistSong.voteCount
    }
  }
}