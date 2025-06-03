import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export interface VoteInput {
  userId: string;
  showId: string;
  songId: string;
  setlistSongId: string;
}

export interface VoteResult {
  success: boolean;
  voteId?: string;
  dailyVotesRemaining?: number;
  showVotesRemaining?: number;
  newVoteCount?: number;
  message?: string;
}

export interface VoteLimits {
  dailyVotes: number;
  showVotes: number;
}

const VOTE_LIMITS: VoteLimits = {
  dailyVotes: 50,
  showVotes: 10
};

// Rate limiting in memory for client-side protection
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export class VotingService {
  // Check rate limits (5 requests per minute)
  private checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userLimit = rateLimitMap.get(userId);
    
    if (!userLimit || now > userLimit.resetTime) {
      rateLimitMap.set(userId, { count: 1, resetTime: now + 60000 }); // 1 minute
      return true;
    }
    
    if (userLimit.count >= 5) {
      return false;
    }
    
    userLimit.count++;
    return true;
  }

  // Get current vote counts for user
  async getVoteCounts(userId: string, showId: string): Promise<{ dailyVotes: number; showVotes: number }> {
    try {
      // Get daily votes
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const [dailyResponse, showResponse] = await Promise.all([
        // Daily votes
        supabase
          .from('votes')
          .select('id', { count: 'exact' })
          .eq('user_id', userId)
          .gte('created_at', today.toISOString()),
        
        // Show votes
        supabase
          .from('votes')
          .select('id', { count: 'exact' })
          .eq('user_id', userId)
          .eq('show_id', showId)
      ]);

      return {
        dailyVotes: dailyResponse.count || 0,
        showVotes: showResponse.count || 0
      };
    } catch (error) {
      console.error('[VotingService] Error getting vote counts:', error);
      return { dailyVotes: 0, showVotes: 0 };
    }
  }

  // Cast a vote
  async castVote(input: VoteInput): Promise<VoteResult> {
    const { userId, showId, songId, setlistSongId } = input;

    // Check rate limit
    if (!this.checkRateLimit(userId)) {
      toast.error('Rate limit exceeded. Please wait a minute before voting again.');
      return {
        success: false,
        message: 'Rate limit exceeded. Try again in a minute.'
      };
    }

    try {
      // Check vote limits
      const { dailyVotes, showVotes } = await this.getVoteCounts(userId, showId);

      if (dailyVotes >= VOTE_LIMITS.dailyVotes) {
        toast.error('Daily vote limit reached (50 votes)');
        return {
          success: false,
          message: 'Daily vote limit reached (50 votes)',
          dailyVotesRemaining: 0,
          showVotesRemaining: Math.max(0, VOTE_LIMITS.showVotes - showVotes)
        };
      }

      if (showVotes >= VOTE_LIMITS.showVotes) {
        toast.error('Show vote limit reached (10 votes per show)');
        return {
          success: false,
          message: 'Show vote limit reached (10 votes per show)',
          dailyVotesRemaining: Math.max(0, VOTE_LIMITS.dailyVotes - dailyVotes),
          showVotesRemaining: 0
        };
      }

      // Check if already voted for this song
      const { data: existingVote } = await supabase
        .from('votes')
        .select('id')
        .eq('user_id', userId)
        .eq('setlist_song_id', setlistSongId)
        .single();

      if (existingVote) {
        toast.error('You have already voted for this song');
        return {
          success: false,
          message: 'Already voted for this song',
          dailyVotesRemaining: Math.max(0, VOTE_LIMITS.dailyVotes - dailyVotes),
          showVotesRemaining: Math.max(0, VOTE_LIMITS.showVotes - showVotes)
        };
      }

      // Use the RPC function for atomic vote operation
      const { data: voteResult, error: voteError } = await supabase.rpc('vote_for_song', {
        p_user_id: userId,
        p_setlist_song_id: setlistSongId
      });

      if (voteError) {
        console.error('[VotingService] Vote error:', voteError);
        
        // Handle specific error cases
        if (voteError.message.includes('already voted')) {
          toast.error('You have already voted for this song');
          return {
            success: false,
            message: 'Already voted for this song'
          };
        } else if (voteError.message.includes('show vote limit')) {
          toast.error('Show vote limit reached');
          return {
            success: false,
            message: 'Show vote limit reached'
          };
        } else if (voteError.message.includes('daily vote limit')) {
          toast.error('Daily vote limit reached');
          return {
            success: false,
            message: 'Daily vote limit reached'
          };
        }
        
        throw voteError;
      }

      // Update vote analytics
      await this.updateVoteAnalytics(userId, showId);

      // Get updated vote count
      const { data: updatedSong } = await supabase
        .from('setlist_songs')
        .select('votes')
        .eq('id', setlistSongId)
        .single();

      const newDailyVotes = dailyVotes + 1;
      const newShowVotes = showVotes + 1;

      toast.success('Vote counted! 🎉');
      
      return {
        success: true,
        dailyVotesRemaining: Math.max(0, VOTE_LIMITS.dailyVotes - newDailyVotes),
        showVotesRemaining: Math.max(0, VOTE_LIMITS.showVotes - newShowVotes),
        newVoteCount: updatedSong?.votes || 0
      };

    } catch (error) {
      console.error('[VotingService] Error casting vote:', error);
      toast.error('Failed to vote. Please try again.');
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to vote'
      };
    }
  }

  // Update vote analytics
  private async updateVoteAnalytics(userId: string, showId: string): Promise<void> {
    try {
      const { dailyVotes, showVotes } = await this.getVoteCounts(userId, showId);

      await supabase
        .from('vote_analytics')
        .upsert({
          user_id: userId,
          show_id: showId,
          daily_votes: dailyVotes,
          show_votes: showVotes,
          last_vote_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,show_id'
        });
    } catch (error) {
      console.error('[VotingService] Error updating analytics:', error);
    }
  }

  // Get user votes for a show
  async getUserVotesForShow(userId: string, showId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('setlist_song_id')
        .eq('user_id', userId)
        .eq('show_id', showId);

      if (error) throw error;

      return data?.map(v => v.setlist_song_id) || [];
    } catch (error) {
      console.error('[VotingService] Error getting user votes:', error);
      return [];
    }
  }
}

// Export singleton instance
export const votingService = new VotingService();

// Legacy function for backwards compatibility
export async function voteForSong(setlistSongId: string): Promise<VoteResult> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        success: false,
        message: 'You must be logged in to vote'
      };
    }

    // Get show ID and song ID for vote validation
    const { data: setlistSong, error: songError } = await supabase
      .from('setlist_songs')
      .select(`
        id,
        song_id,
        setlist:setlists!setlist_id(
          show_id
        )
      `)
      .eq('id', setlistSongId)
      .single();

    if (songError || !setlistSong) {
      return {
        success: false,
        message: 'Song not found'
      };
    }

    // Use the new voting service
    return await votingService.castVote({
      userId: user.id,
      showId: setlistSong.setlist.show_id,
      songId: setlistSong.song_id,
      setlistSongId: setlistSongId
    });

  } catch (error: any) {
    console.error('Error voting for song:', error);
    return {
      success: false,
      message: error.message || 'Failed to record vote'
    };
  }
}
