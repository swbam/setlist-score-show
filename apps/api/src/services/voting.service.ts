// src/services/voting.service.ts
import { PrismaClient } from '@setlist/database'
import Redis from 'ioredis'
import { SupabaseClient } from '@supabase/supabase-js'
import { TRPCError } from '@trpc/server'

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
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: 'Rate limit exceeded. Try again in a minute.'
      })
    }

    // Check vote limits
    const [dailyVotes, showVotes] = await Promise.all([
      this.prisma.vote.count({
        where: {
          user_id: userId,
          created_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      this.prisma.vote.count({
        where: {
          user_id: userId,
          show_id: showId
        }
      })
    ])

    if (dailyVotes >= 50) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Daily vote limit reached (50 votes)'
      })
    }

    if (showVotes >= 10) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Show vote limit reached (10 votes per show)'
      })
    }

    // Transaction for vote
    const result = await this.prisma.$transaction(async (tx) => {
      // Check if already voted
      const existingVote = await tx.vote.findUnique({
        where: {
          unique_user_song_vote: {
            user_id: userId,
            setlist_song_id: setlistSongId
          }
        }
      })

      if (existingVote) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Already voted for this song'
        })
      }

      // Create vote
      const vote = await tx.vote.create({
        data: {
          user_id: userId,
          setlist_song_id: setlistSongId,
          show_id: showId,
          vote_type: 'up'
        }
      })

      // Update vote count
      const updatedSetlistSong = await tx.setlistSong.update({
        where: { id: setlistSongId },
        data: {
          vote_count: {
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
            user_id: userId,
            show_id: showId
          }
        },
        create: {
          user_id: userId,
          show_id: showId,
          daily_votes: 1,
          show_votes: 1,
          last_vote_at: new Date()
        },
        update: {
          daily_votes: {
            increment: 1
          },
          show_votes: {
            increment: 1
          },
          last_vote_at: new Date()
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
          newVoteCount: result.updatedSetlistSong.vote_count,
          songTitle: result.updatedSetlistSong.song.title,
          voterId: userId
        }
      })

    return {
      success: true,
      voteId: result.vote.id,
      dailyVotesRemaining: 50 - dailyVotes - 1,
      showVotesRemaining: 10 - showVotes - 1,
      newVoteCount: result.updatedSetlistSong.vote_count
    }
  }
}