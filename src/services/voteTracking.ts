
import { supabase } from "@/integrations/supabase/client";

export interface UserVoteStats {
  user_id: string;
  total_votes: number;
  votes_today: number;
  votes_this_show: number;
  max_votes_per_show: number;
  max_votes_per_day: number;
}

export interface VoteValidationResult {
  canVote: boolean;
  reason?: string;
  votesRemaining?: number;
}

// Constants for vote limits (matching documentation requirements)
export const VOTE_LIMITS = {
  MAX_VOTES_PER_SHOW: 10,
  MAX_VOTES_PER_DAY: 50,
  FREE_TIER_DAILY_LIMIT: 25
};

// Check if user can vote for a specific song
export async function canUserVote(userId: string, setlistSongId: string, showId: string): Promise<VoteValidationResult> {
  try {
    // Check if user already voted for this specific song
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

    // Get user's vote stats for this show
    const showStats = await getUserVoteStatsForShow(userId, showId);
    
    if (showStats.votes_this_show >= VOTE_LIMITS.MAX_VOTES_PER_SHOW) {
      return {
        canVote: false,
        reason: `You've reached the maximum votes per show (${VOTE_LIMITS.MAX_VOTES_PER_SHOW})`
      };
    }

    // Get user's daily vote stats
    const dailyStats = await getUserDailyVoteStats(userId);
    
    if (dailyStats.votes_today >= VOTE_LIMITS.MAX_VOTES_PER_DAY) {
      return {
        canVote: false,
        reason: `You've reached your daily vote limit (${VOTE_LIMITS.MAX_VOTES_PER_DAY})`
      };
    }

    const votesRemainingShow = VOTE_LIMITS.MAX_VOTES_PER_SHOW - showStats.votes_this_show;
    const votesRemainingDaily = VOTE_LIMITS.MAX_VOTES_PER_DAY - dailyStats.votes_today;

    return {
      canVote: true,
      votesRemaining: Math.min(votesRemainingShow, votesRemainingDaily)
    };

  } catch (error) {
    console.error('Error checking vote eligibility:', error);
    return {
      canVote: false,
      reason: 'Unable to verify vote eligibility'
    };
  }
}

// Get user's vote statistics for a specific show
export async function getUserVoteStatsForShow(userId: string, showId: string): Promise<{ votes_this_show: number }> {
  try {
    const { data, error } = await supabase
      .from('votes')
      .select(`
        id,
        setlist_songs!votes_setlist_song_id_fkey (
          setlist_id,
          setlists!setlist_songs_setlist_id_fkey (
            show_id
          )
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user show votes:', error);
      return { votes_this_show: 0 };
    }

    // Count votes for this specific show
    const showVotes = data?.filter(vote => {
      const setlistSong = vote.setlist_songs as {
        setlist_id: string;
        setlists: { show_id: string } | null;
      } | null;
      return setlistSong?.setlists?.show_id === showId;
    }).length || 0;

    return { votes_this_show: showVotes };
  } catch (error) {
    console.error('Error calculating show vote stats:', error);
    return { votes_this_show: 0 };
  }
}

// Get user's daily vote statistics
export async function getUserDailyVoteStats(userId: string): Promise<{ votes_today: number }> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count, error } = await supabase
      .from('votes')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .gte('created_at', today.toISOString());

    if (error) {
      console.error('Error fetching daily vote stats:', error);
      return { votes_today: 0 };
    }

    return { votes_today: count || 0 };
  } catch (error) {
    console.error('Error calculating daily vote stats:', error);
    return { votes_today: 0 };
  }
}

// Get comprehensive user vote statistics
export async function getUserVoteStats(userId: string): Promise<UserVoteStats> {
  try {
    const [totalVotes, dailyStats] = await Promise.all([
      getUserTotalVotes(userId),
      getUserDailyVoteStats(userId)
    ]);

    return {
      user_id: userId,
      total_votes: totalVotes,
      votes_today: dailyStats.votes_today,
      votes_this_show: 0, // This needs to be calculated per show
      max_votes_per_show: VOTE_LIMITS.MAX_VOTES_PER_SHOW,
      max_votes_per_day: VOTE_LIMITS.MAX_VOTES_PER_DAY
    };
  } catch (error) {
    console.error('Error getting user vote stats:', error);
    return {
      user_id: userId,
      total_votes: 0,
      votes_today: 0,
      votes_this_show: 0,
      max_votes_per_show: VOTE_LIMITS.MAX_VOTES_PER_SHOW,
      max_votes_per_day: VOTE_LIMITS.MAX_VOTES_PER_DAY
    };
  }
}

// Get user's total vote count
async function getUserTotalVotes(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('votes')
      .select('id', { count: 'exact' })
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching total votes:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error calculating total votes:', error);
    return 0;
  }
}
