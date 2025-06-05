import { describe, it, expect, beforeEach, vi } from 'vitest';
import { voteForSong } from '@/services/voting';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis()
    })),
    auth: {
      getUser: vi.fn()
    }
  }
}));

describe('Voting Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('voteForSong', () => {
    it('should successfully register a vote when within limits', async () => {
      // Mock successful RPC call
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: {
          success: true,
          show_votes_used: 1,
          show_votes_remaining: 9,
          daily_votes_used: 1,
          daily_votes_remaining: 49
        },
        error: null
      });

      const result = await voteForSong('song-123');
      
      expect(result.success).toBe(true);
      expect(result.remainingVotes).toEqual({
        daily: 49,
        perShow: 9
      });
      expect(supabase.rpc).toHaveBeenCalledWith('vote_for_song', {
        p_user_id: expect.any(String),
        p_setlist_song_id: 'song-123'
      });
    });

    it('should handle already voted error', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: {
          success: false,
          error: 'Already voted for this song'
        },
        error: null
      });

      const result = await voteForSong('song-123');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Already voted for this song');
    });

    it('should handle daily vote limit', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: {
          success: false,
          error: 'Daily vote limit reached (50 votes per day)'
        },
        error: null
      });

      const result = await voteForSong('song-123');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Daily vote limit reached (50 votes per day)');
    });

    it('should handle show vote limit', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: {
          success: false,
          error: 'Show vote limit reached (10 votes per show)'
        },
        error: null
      });

      const result = await voteForSong('song-123');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Show vote limit reached (10 votes per show)');
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'Database connection error' }
      });

      const result = await voteForSong('song-123');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection error');
    });

    it('should handle missing user authentication', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null
      });

      const result = await voteForSong('song-123');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('User not authenticated');
    });
  });

  describe('removeVote', () => {
    it('should successfully remove a vote', async () => {
      // Mock successful vote removal
      const fromMock = vi.fn(() => ({
        delete: vi.fn().mockReturnThis(),
        match: vi.fn().mockResolvedValue({ error: null })
      }));
      
      vi.mocked(supabase.from).mockImplementation(fromMock);

      const result = await removeVote('song-123');
      
      expect(result.success).toBe(true);
      expect(fromMock).toHaveBeenCalledWith('votes');
    });
  });
});

describe('Vote Limits', () => {
  it('should track votes across multiple songs in same show', async () => {
    let votesUsed = 0;
    
    // Simulate voting for multiple songs
    for (let i = 0; i < 10; i++) {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: {
          success: true,
          show_votes_used: ++votesUsed,
          show_votes_remaining: 10 - votesUsed,
          daily_votes_used: votesUsed,
          daily_votes_remaining: 50 - votesUsed
        },
        error: null
      });

      const result = await voteForSong(`song-${i}`);
      expect(result.success).toBe(true);
      expect(result.remainingVotes.perShow).toBe(10 - votesUsed);
    }

    // 11th vote should fail
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: {
        success: false,
        error: 'Show vote limit reached (10 votes per show)'
      },
      error: null
    });

    const result = await voteForSong('song-11');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Show vote limit reached');
  });
});

describe('Real-time Vote Updates', () => {
  it('should handle concurrent votes correctly', async () => {
    const votes = [];
    
    // Simulate 5 concurrent votes
    const votePromises = Array.from({ length: 5 }, (_, i) => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: {
          success: true,
          show_votes_used: i + 1,
          show_votes_remaining: 10 - (i + 1),
          daily_votes_used: i + 1,
          daily_votes_remaining: 50 - (i + 1)
        },
        error: null
      });
      
      return voteForSong(`song-${i}`);
    });

    const results = await Promise.all(votePromises);
    
    // All votes should succeed
    results.forEach(result => {
      expect(result.success).toBe(true);
    });
    
    // Vote counts should be sequential
    expect(results[4].remainingVotes.perShow).toBe(5);
  });
});