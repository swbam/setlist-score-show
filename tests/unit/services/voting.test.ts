import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VotingService } from '@/services/voting';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { SupabaseClient } from '@supabase/supabase-js';

// Mock dependencies
vi.mock('@prisma/client');
vi.mock('ioredis');
vi.mock('@supabase/supabase-js');

describe('VotingService', () => {
  let votingService: VotingService;
  let mockPrisma: any;
  let mockRedis: any;
  let mockSupabase: any;

  beforeEach(() => {
    // Create mock instances
    mockPrisma = {
      $transaction: vi.fn(),
      vote: {
        count: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn()
      },
      setlistSong: {
        update: vi.fn()
      },
      voteAnalytics: {
        upsert: vi.fn()
      }
    };

    mockRedis = {
      incr: vi.fn(),
      expire: vi.fn(),
      del: vi.fn()
    };

    mockSupabase = {
      channel: vi.fn().mockReturnValue({
        send: vi.fn().mockResolvedValue({ error: null })
      })
    };

    votingService = new VotingService(mockPrisma, mockRedis, mockSupabase);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('castVote', () => {
    const validInput = {
      userId: 'user-123',
      showId: 'show-456',
      songId: 'song-789',
      setlistSongId: 'setlist-song-101'
    };

    it('should successfully cast a vote', async () => {
      // Setup mocks
      mockRedis.incr.mockResolvedValue(1);
      mockPrisma.vote.count.mockResolvedValue(0);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          vote: {
            findUnique: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue({ id: 'vote-123', ...validInput })
          },
          setlistSong: {
            update: vi.fn().mockResolvedValue({
              id: validInput.setlistSongId,
              vote_count: 1,
              song: { title: 'Test Song' }
            })
          },
          voteAnalytics: {
            upsert: vi.fn().mockResolvedValue({})
          }
        };
        return callback(tx);
      });

      const result = await votingService.castVote(validInput);

      expect(result.success).toBe(true);
      expect(result.voteId).toBe('vote-123');
      expect(result.dailyVotesRemaining).toBe(49);
      expect(result.showVotesRemaining).toBe(9);
      expect(result.newVoteCount).toBe(1);
    });

    it('should enforce rate limiting', async () => {
      mockRedis.incr.mockResolvedValue(6); // Over rate limit

      await expect(votingService.castVote(validInput))
        .rejects.toThrow('Rate limit exceeded');
    });

    it('should enforce daily vote limit', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockPrisma.vote.count
        .mockResolvedValueOnce(50) // Daily votes
        .mockResolvedValueOnce(5); // Show votes

      await expect(votingService.castVote(validInput))
        .rejects.toThrow('Daily vote limit reached');
    });

    it('should enforce show vote limit', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockPrisma.vote.count
        .mockResolvedValueOnce(5) // Daily votes
        .mockResolvedValueOnce(10); // Show votes

      await expect(votingService.castVote(validInput))
        .rejects.toThrow('Show vote limit reached');
    });

    it('should prevent duplicate votes', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockPrisma.vote.count.mockResolvedValue(0);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          vote: {
            findUnique: vi.fn().mockResolvedValue({ id: 'existing-vote' })
          }
        };
        return callback(tx);
      });

      await expect(votingService.castVote(validInput))
        .rejects.toThrow('Already voted for this song');
    });

    it('should broadcast vote update via Supabase', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockPrisma.vote.count.mockResolvedValue(0);
      mockPrisma.$transaction.mockResolvedValue({
        vote: { id: 'vote-123' },
        updatedSetlistSong: {
          vote_count: 1,
          song: { title: 'Test Song' }
        }
      });

      await votingService.castVote(validInput);

      expect(mockSupabase.channel).toHaveBeenCalledWith(`show:${validInput.showId}`);
      expect(mockSupabase.channel().send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'vote_update',
        payload: expect.objectContaining({
          setlistSongId: validInput.setlistSongId,
          songId: validInput.songId,
          newVoteCount: 1,
          voterId: validInput.userId
        })
      });
    });

    it('should invalidate cache after voting', async () => {
      mockRedis.incr.mockResolvedValue(1);
      mockPrisma.vote.count.mockResolvedValue(0);
      mockPrisma.$transaction.mockResolvedValue({
        vote: { id: 'vote-123' },
        updatedSetlistSong: {
          vote_count: 1,
          song: { title: 'Test Song' }
        }
      });

      await votingService.castVote(validInput);

      expect(mockRedis.del).toHaveBeenCalledWith(`show:${validInput.showId}:songs`);
    });
  });

  describe('removeVote', () => {
    const voteId = 'vote-123';
    const userId = 'user-123';

    it('should successfully remove a vote', async () => {
      const existingVote = {
        id: voteId,
        user_id: userId,
        setlist_song_id: 'setlist-song-101',
        show_id: 'show-456'
      };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          vote: {
            findUnique: vi.fn().mockResolvedValue(existingVote),
            delete: vi.fn().mockResolvedValue(existingVote)
          },
          setlistSong: {
            update: vi.fn().mockResolvedValue({
              id: existingVote.setlist_song_id,
              vote_count: 0
            })
          },
          voteAnalytics: {
            update: vi.fn().mockResolvedValue({})
          }
        };
        return callback(tx);
      });

      const result = await votingService.removeVote(voteId, userId);

      expect(result.success).toBe(true);
      expect(result.newVoteCount).toBe(0);
    });

    it('should not allow removing another user\'s vote', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          vote: {
            findUnique: vi.fn().mockResolvedValue({
              id: voteId,
              user_id: 'other-user'
            })
          }
        };
        return callback(tx);
      });

      await expect(votingService.removeVote(voteId, userId))
        .rejects.toThrow('Unauthorized');
    });
  });

  describe('getShowVotes', () => {
    const showId = 'show-456';

    it('should return cached votes if available', async () => {
      const cachedData = JSON.stringify([
        { song_id: 'song-1', vote_count: 10 },
        { song_id: 'song-2', vote_count: 5 }
      ]);
      
      mockRedis.get = vi.fn().mockResolvedValue(cachedData);

      const result = await votingService.getShowVotes(showId);

      expect(result).toEqual(JSON.parse(cachedData));
      expect(mockPrisma.setlistSong.findMany).not.toHaveBeenCalled();
    });

    it('should fetch from database if not cached', async () => {
      const dbData = [
        {
          id: 'ss-1',
          song_id: 'song-1',
          vote_count: 10,
          position: 1,
          song: { title: 'Song 1' }
        },
        {
          id: 'ss-2',
          song_id: 'song-2',
          vote_count: 5,
          position: 2,
          song: { title: 'Song 2' }
        }
      ];

      mockRedis.get = vi.fn().mockResolvedValue(null);
      mockRedis.setex = vi.fn().mockResolvedValue('OK');
      mockPrisma.setlistSong.findMany = vi.fn().mockResolvedValue(dbData);

      const result = await votingService.getShowVotes(showId);

      expect(result).toEqual(dbData);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        `show:${showId}:songs`,
        300, // 5 minutes
        JSON.stringify(dbData)
      );
    });
  });

  describe('getUserVoteHistory', () => {
    const userId = 'user-123';

    it('should return user vote history with pagination', async () => {
      const votes = [
        {
          id: 'vote-1',
          created_at: new Date(),
          setlist_song: {
            song: { title: 'Song 1' }
          },
          show: {
            title: 'Show 1',
            date: new Date(),
            artist: { name: 'Artist 1' }
          }
        }
      ];

      mockPrisma.vote.findMany = vi.fn().mockResolvedValue(votes);
      mockPrisma.vote.count = vi.fn().mockResolvedValue(1);

      const result = await votingService.getUserVoteHistory(userId, { page: 1, limit: 10 });

      expect(result.votes).toEqual(votes);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });
  });
});