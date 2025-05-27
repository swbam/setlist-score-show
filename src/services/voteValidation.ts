import { supabase } from '@/integrations/supabase/client';

export interface VoteValidationResult {
  canVote: boolean;
  reason?: string;
  dailyVotesUsed: number;
  dailyVotesRemaining: number;
  showVotesUsed: number;
  showVotesRemaining: number;
}

export interface VoteLimits {
  dailyLimit: number;
  showLimit: number;
}

const DEFAULT_LIMITS: VoteLimits = {
  dailyLimit: 50,
  showLimit: 10
};

// Check if user can vote for a specific song
export async function validateVote(
  userId: string,
  setlistSongId: string,
  showId: string
): Promise<VoteValidationResult> {
  try {
    // Check if user already voted for this song
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('user_id', userId)
      .eq('setlist_song_id', setlistSongId)
      .single();

    if (existingVote) {
      return {
        canVote: false,
        reason: 'Already voted for this song',
        dailyVotesUsed: 0,
        dailyVotesRemaining: 0,
        showVotesUsed: 0,
        showVotesRemaining: 0
      };
    }

    // Get today's date for daily vote counting
    const today = new Date().toISOString().split('T')[0];

    // Count daily votes
    const { data: dailyVotes, error: dailyError } = await supabase
      .from('votes')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', today);

    if (dailyError) {
      console.error('Error counting daily votes:', dailyError);
      throw dailyError;
    }

    const dailyVotesUsed = dailyVotes?.length || 0;
    const dailyVotesRemaining = Math.max(0, DEFAULT_LIMITS.dailyLimit - dailyVotesUsed);

    // Count show votes
    const { data: showVotes, error: showError } = await supabase
      .from('votes')
      .select('votes.id')
      .eq('user_id', userId)
      .in('setlist_song_id', 
        await supabase
          .from('setlist_songs')
          .select('id')
          .in('setlist_id',
            await supabase
              .from('setlists')
              .select('id')
              .eq('show_id', showId)
              .then(res => res.data?.map(s => s.id) || [])
          )
          .then(res => res.data?.map(s => s.id) || [])
      );

    if (showError) {
      console.error('Error counting show votes:', showError);
      throw showError;
    }

    const showVotesUsed = showVotes?.length || 0;
    const showVotesRemaining = Math.max(0, DEFAULT_LIMITS.showLimit - showVotesUsed);

    // Check limits
    if (dailyVotesUsed >= DEFAULT_LIMITS.dailyLimit) {
      return {
        canVote: false,
        reason: `Daily vote limit reached (${DEFAULT_LIMITS.dailyLimit} votes)`,
        dailyVotesUsed,
        dailyVotesRemaining,
        showVotesUsed,
        showVotesRemaining
      };
    }

    if (showVotesUsed >= DEFAULT_LIMITS.showLimit) {
      return {
        canVote: false,
        reason: `Show vote limit reached (${DEFAULT_LIMITS.showLimit} votes)`,
        dailyVotesUsed,
        dailyVotesRemaining,
        showVotesUsed,
        showVotesRemaining
      };
    }

    return {
      canVote: true,
      dailyVotesUsed,
      dailyVotesRemaining,
      showVotesUsed,
      showVotesRemaining
    };

  } catch (error) {
    console.error('Error validating vote:', error);
    return {
      canVote: false,
      reason: 'Validation error',
      dailyVotesUsed: 0,
      dailyVotesRemaining: 0,
      showVotesUsed: 0,
      showVotesRemaining: 0
    };
  }
}

// Get user's vote statistics
export async function getUserVoteStats(userId: string, showId?: string): Promise<VoteValidationResult> {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Count daily votes
    const { data: dailyVotes } = await supabase
      .from('votes')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', today);

    const dailyVotesUsed = dailyVotes?.length || 0;
    const dailyVotesRemaining = Math.max(0, DEFAULT_LIMITS.dailyLimit - dailyVotesUsed);

    let showVotesUsed = 0;
    let showVotesRemaining = DEFAULT_LIMITS.showLimit;

    if (showId) {
      // Count show votes
      const { data: showVotes } = await supabase
        .from('votes')
        .select('votes.id')
        .eq('user_id', userId)
        .in('setlist_song_id', 
          await supabase
            .from('setlist_songs')
            .select('id')
            .in('setlist_id',
              await supabase
                .from('setlists')
                .select('id')
                .eq('show_id', showId)
                .then(res => res.data?.map(s => s.id) || [])
            )
            .then(res => res.data?.map(s => s.id) || [])
        );

      showVotesUsed = showVotes?.length || 0;
      showVotesRemaining = Math.max(0, DEFAULT_LIMITS.showLimit - showVotesUsed);
    }

    return {
      canVote: dailyVotesRemaining > 0 && showVotesRemaining > 0,
      dailyVotesUsed,
      dailyVotesRemaining,
      showVotesUsed,
      showVotesRemaining
    };

  } catch (error) {
    console.error('Error getting user vote stats:', error);
    return {
      canVote: false,
      reason: 'Error fetching stats',
      dailyVotesUsed: 0,
      dailyVotesRemaining: 0,
      showVotesUsed: 0,
      showVotesRemaining: 0
    };
  }
}

// Batch validate multiple songs for voting
export async function batchValidateVotes(
  userId: string,
  setlistSongIds: string[],
  showId: string
): Promise<Record<string, VoteValidationResult>> {
  const results: Record<string, VoteValidationResult> = {};

  // Get base stats first
  const baseStats = await getUserVoteStats(userId, showId);

  // Get existing votes for these songs
  const { data: existingVotes } = await supabase
    .from('votes')
    .select('setlist_song_id')
    .eq('user_id', userId)
    .in('setlist_song_id', setlistSongIds);

  const votedSongIds = new Set(existingVotes?.map(v => v.setlist_song_id) || []);

  // Validate each song
  for (const songId of setlistSongIds) {
    if (votedSongIds.has(songId)) {
      results[songId] = {
        canVote: false,
        reason: 'Already voted for this song',
        ...baseStats
      };
    } else {
      results[songId] = {
        canVote: baseStats.canVote,
        reason: baseStats.reason,
        ...baseStats
      };
    }
  }

  return results;
}