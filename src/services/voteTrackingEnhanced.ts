
import { supabase } from '@/integrations/supabase/client';

export const VOTE_LIMITS = {
  MAX_VOTES_PER_SHOW: 10,
  MAX_VOTES_PER_DAY: 50,
  GUEST_MAX_VOTES: 3
};

export interface VoteValidationResult {
  canVote: boolean;
  reason?: string;
  votesRemaining?: number;
  dailyVotesUsed?: number;
  showVotesUsed?: number;
}

export interface UserVoteStats {
  votes_today: number;
  votes_this_show: number;
  total_votes: number;
  last_vote_at?: string;
}

export async function getUserVoteStats(userId: string): Promise<UserVoteStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    // Get today's votes
    const { count: todayVotes } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', today.toISOString());

    // Get total votes
    const { count: totalVotes } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get last vote time
    const { data: lastVote } = await supabase
      .from('votes')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return {
      votes_today: todayVotes || 0,
      votes_this_show: 0, // Will be set by show-specific function
      total_votes: totalVotes || 0,
      last_vote_at: lastVote?.created_at
    };
  } catch (error) {
    console.error('Error getting user vote stats:', error);
    return {
      votes_today: 0,
      votes_this_show: 0,
      total_votes: 0
    };
  }
}

export async function getUserVoteStatsForShow(
  userId: string, 
  showId: string
): Promise<UserVoteStats> {
  const stats = await getUserVoteStats(userId);

  try {
    // Get votes for this specific show
    const { count: showVotes } = await supabase
      .from('votes')
      .select(`
        *,
        setlist_songs!votes_setlist_song_id_fkey(
          setlists!setlist_songs_setlist_id_fkey(show_id)
        )
      `, { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('setlist_songs.setlists.show_id', showId);

    return {
      ...stats,
      votes_this_show: showVotes || 0
    };
  } catch (error) {
    console.error('Error getting show vote stats:', error);
    return {
      ...stats,
      votes_this_show: 0
    };
  }
}

export async function canUserVote(
  userId: string,
  setlistSongId: string,
  showId?: string
): Promise<VoteValidationResult> {
  try {
    // Check if user has already voted for this song
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('user_id', userId)
      .eq('setlist_song_id', setlistSongId)
      .single();

    if (existingVote) {
      return {
        canVote: false,
        reason: 'You have already voted for this song'
      };
    }

    // Get user's vote statistics
    const stats = showId 
      ? await getUserVoteStatsForShow(userId, showId)
      : await getUserVoteStats(userId);

    // Check daily limit
    if (stats.votes_today >= VOTE_LIMITS.MAX_VOTES_PER_DAY) {
      return {
        canVote: false,
        reason: 'Daily vote limit reached',
        dailyVotesUsed: stats.votes_today
      };
    }

    // Check show limit if we have show context
    if (showId && stats.votes_this_show >= VOTE_LIMITS.MAX_VOTES_PER_SHOW) {
      return {
        canVote: false,
        reason: 'Vote limit for this show reached',
        showVotesUsed: stats.votes_this_show
      };
    }

    return {
      canVote: true,
      votesRemaining: VOTE_LIMITS.MAX_VOTES_PER_SHOW - stats.votes_this_show,
      dailyVotesUsed: stats.votes_today,
      showVotesUsed: stats.votes_this_show
    };

  } catch (error) {
    console.error('Error checking vote eligibility:', error);
    return {
      canVote: false,
      reason: 'Unable to verify vote eligibility'
    };
  }
}

export async function recordVote(
  userId: string,
  setlistSongId: string
): Promise<{ success: boolean; message?: string; votes?: number }> {
  try {
    // Verify user can vote
    const validation = await canUserVote(userId, setlistSongId);
    
    if (!validation.canVote) {
      return {
        success: false,
        message: validation.reason
      };
    }

    // Use the existing vote_for_song RPC function
    const { data, error } = await supabase.rpc('vote_for_song', {
      setlist_song_id: setlistSongId
    });

    if (error) {
      return {
        success: false,
        message: error.message
      };
    }

    // Handle the RPC response properly - it returns Json type
    if (typeof data === 'object' && data !== null && 'success' in data) {
      return data as { success: boolean; message?: string; votes?: number };
    }

    // If data is not in expected format, assume success
    return {
      success: true,
      message: 'Vote recorded successfully'
    };
  } catch (error) {
    console.error('Error recording vote:', error);
    return {
      success: false,
      message: 'Failed to record vote'
    };
  }
}
