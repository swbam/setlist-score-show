import { supabase } from "@/integrations/supabase/client";

export interface VoteLimit {
  userId: string;
  showId: string;
  dailyVotes: number;
  showVotes: number;
  lastDailyReset: string;
}

export interface VoteValidationResult {
  canVote: boolean;
  reason?: string;
  remainingDailyVotes?: number;
  remainingShowVotes?: number;
}

export interface UserVoteStatus {
  hasVoted: boolean;
  voteId?: string;
  votedAt?: string;
}

const DAILY_VOTE_LIMIT = 50;
const SHOW_VOTE_LIMIT = 10;

// Check if user can vote
export async function canUserVote(
  userId: string,
  showId: string,
  setlistSongId: string
): Promise<VoteValidationResult> {
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
        reason: 'Already voted for this song'
      };
    }

    // Get user's vote limits for this show
    const voteLimits = await getUserVoteLimits(userId, showId);
    
    // Check daily limit
    if (voteLimits.dailyVotes >= DAILY_VOTE_LIMIT) {
      return {
        canVote: false,
        reason: 'Daily vote limit reached',
        remainingDailyVotes: 0
      };
    }

    // Check show limit
    if (voteLimits.showVotes >= SHOW_VOTE_LIMIT) {
      return {
        canVote: false,
        reason: 'Show vote limit reached',
        remainingShowVotes: 0
      };
    }

    return {
      canVote: true,
      remainingDailyVotes: DAILY_VOTE_LIMIT - voteLimits.dailyVotes,
      remainingShowVotes: SHOW_VOTE_LIMIT - voteLimits.showVotes
    };

  } catch (error) {
    console.error('Error checking vote eligibility:', error);
    return {
      canVote: false,
      reason: 'Error checking vote eligibility'
    };
  }
}

// Get user's current vote limits for a specific show
export async function getUserVoteLimits(userId: string, showId: string): Promise<VoteLimit> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get or create vote limits record for this user/show combination
    let { data: voteLimits, error } = await supabase
      .from('vote_limits')
      .select('*')
      .eq('user_id', userId)
      .eq('show_id', showId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Record doesn't exist, create it
      const { data: newLimits, error: insertError } = await supabase
        .from('vote_limits')
        .insert({
          user_id: userId,
          show_id: showId,
          daily_votes: 0,
          show_votes: 0,
          last_daily_reset: today
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }
      voteLimits = newLimits;
    } else if (error) {
      throw error;
    }

    // Reset daily votes if it's a new day
    if (voteLimits!.last_daily_reset !== today) {
      const { data: resetLimits, error: resetError } = await supabase
        .from('vote_limits')
        .update({
          daily_votes: 0,
          last_daily_reset: today
        })
        .eq('user_id', userId)
        .eq('show_id', showId)
        .select()
        .single();

      if (resetError) {
        throw resetError;
      }
      voteLimits = resetLimits;
    }

    return {
      userId,
      showId,
      dailyVotes: voteLimits!.daily_votes || 0,
      showVotes: voteLimits!.show_votes || 0,
      lastDailyReset: voteLimits!.last_daily_reset || today
    };

  } catch (error) {
    console.error('Error getting vote limits:', error);
    return {
      userId,
      showId,
      dailyVotes: 0,
      showVotes: 0,
      lastDailyReset: new Date().toISOString().split('T')[0]
    };
  }
}

// Cast a vote with validation
export async function castVoteWithValidation(
  userId: string,
  setlistSongId: string,
  showId: string
): Promise<{ success: boolean; error?: string; voteId?: string }> {
  try {
    // Validate vote eligibility
    const validation = await canUserVote(userId, showId, setlistSongId);
    if (!validation.canVote) {
      return {
        success: false,
        error: validation.reason
      };
    }

    // Cast the vote using the database function
    const { data, error } = await supabase.rpc('vote_for_song', {
      setlist_song_id: setlistSongId
    });

    if (error) {
      throw error;
    }

    // Update vote limits
    await updateVoteLimits(userId, showId);

    return {
      success: true,
      voteId: String(data)
    };

  } catch (error) {
    console.error('Error casting vote:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Update vote limits after successful vote
async function updateVoteLimits(userId: string, showId: string): Promise<void> {
  try {
    // Get current vote counts first
    const { data: currentLimits } = await supabase
      .from('vote_limits')
      .select('daily_votes, show_votes')
      .eq('user_id', userId)
      .eq('show_id', showId)
      .single();

    if (currentLimits) {
      // Increment both daily and show vote counts
      const { error } = await supabase
        .from('vote_limits')
        .update({
          daily_votes: currentLimits.daily_votes + 1,
          show_votes: currentLimits.show_votes + 1
        })
        .eq('user_id', userId)
        .eq('show_id', showId);

      if (error) {
        console.error('Error updating vote limits:', error);
      }
    }
  } catch (error) {
    console.error('Error updating vote limits:', error);
  }
}

// Get user's vote status for a specific song
export async function getUserVoteStatus(
  userId: string,
  setlistSongId: string
): Promise<UserVoteStatus> {
  try {
    const { data, error } = await supabase
      .from('votes')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('setlist_song_id', setlistSongId)
      .single();

    if (error && error.code === 'PGRST116') {
      return { hasVoted: false };
    }

    if (error) {
      throw error;
    }

    return {
      hasVoted: true,
      voteId: data.id,
      votedAt: data.created_at
    };

  } catch (error) {
    console.error('Error getting vote status:', error);
    return { hasVoted: false };
  }
}

// Get user's votes for a show
export async function getUserShowVotes(
  userId: string,
  showId: string
): Promise<Array<{
  setlistSongId: string;
  songName: string;
  voteId: string;
  votedAt: string;
}>> {
  try {
    const { data, error } = await supabase
      .from('votes')
      .select(`
        id,
        created_at,
        setlist_song_id,
        setlist_songs!votes_setlist_song_id_fkey(
          songs!setlist_songs_song_id_fkey(name),
          setlists!setlist_songs_setlist_id_fkey(show_id)
        )
      `)
      .eq('user_id', userId)
      .eq('setlist_songs.setlists.show_id', showId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []).map(vote => ({
      setlistSongId: vote.setlist_song_id,
      songName: vote.setlist_songs?.songs?.name || 'Unknown Song',
      voteId: vote.id,
      votedAt: vote.created_at
    }));

  } catch (error) {
    console.error('Error getting user show votes:', error);
    return [];
  }
}

// Remove a vote
export async function removeVote(
  userId: string,
  voteId: string,
  showId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify the vote belongs to the user
    const { data: vote, error: fetchError } = await supabase
      .from('votes')
      .select('setlist_song_id')
      .eq('id', voteId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Delete the vote
    const { error: deleteError } = await supabase
      .from('votes')
      .delete()
      .eq('id', voteId)
      .eq('user_id', userId);

    if (deleteError) {
      throw deleteError;
    }

    // Get current vote count and decrement
    const { data: songData } = await supabase
      .from('setlist_songs')
      .select('votes')
      .eq('id', vote.setlist_song_id)
      .single();

    if (songData) {
      const { error: updateError } = await supabase
        .from('setlist_songs')
        .update({
          votes: Math.max((songData.votes || 0) - 1, 0)
        })
        .eq('id', vote.setlist_song_id);

      if (updateError) {
        console.error('Error updating vote count:', updateError);
      }
    }

    // Get current limits and decrement
    const { data: limitsData } = await supabase
      .from('vote_limits')
      .select('daily_votes, show_votes')
      .eq('user_id', userId)
      .eq('show_id', showId)
      .single();

    if (limitsData) {
      const { error: limitError } = await supabase
        .from('vote_limits')
        .update({
          daily_votes: Math.max((limitsData.daily_votes || 0) - 1, 0),
          show_votes: Math.max((limitsData.show_votes || 0) - 1, 0)
        })
        .eq('user_id', userId)
        .eq('show_id', showId);

      if (limitError) {
        console.error('Error updating vote limits:', limitError);
      }
    }

    return { success: true };

  } catch (error) {
    console.error('Error removing vote:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Get vote statistics for a user
export async function getUserVoteStats(userId: string): Promise<{
  totalVotes: number;
  dailyVotes: number;
  showsVotedOn: number;
  averageVotesPerShow: number;
}> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get total votes
    const { count: totalVotes } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get daily votes
    const { count: dailyVotes } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', today);

    // Get unique shows voted on
    const { data: showVotes } = await supabase
      .from('votes')
      .select(`
        setlist_songs!votes_setlist_song_id_fkey(
          setlists!setlist_songs_setlist_id_fkey(show_id)
        )
      `)
      .eq('user_id', userId);

    const uniqueShows = new Set(
      showVotes?.map(vote => vote.setlist_songs?.setlists?.show_id).filter(Boolean)
    );

    const showsVotedOn = uniqueShows.size;
    const averageVotesPerShow = showsVotedOn > 0 ? (totalVotes || 0) / showsVotedOn : 0;

    return {
      totalVotes: totalVotes || 0,
      dailyVotes: dailyVotes || 0,
      showsVotedOn,
      averageVotesPerShow: Math.round(averageVotesPerShow * 100) / 100
    };

  } catch (error) {
    console.error('Error getting vote stats:', error);
    return {
      totalVotes: 0,
      dailyVotes: 0,
      showsVotedOn: 0,
      averageVotesPerShow: 0
    };
  }
}

// Get all vote limits for a user (across all shows)
export async function getAllUserVoteLimits(userId: string): Promise<VoteLimit[]> {
  try {
    const { data, error } = await supabase
      .from('vote_limits')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []).map(limit => ({
      userId: limit.user_id,
      showId: limit.show_id,
      dailyVotes: limit.daily_votes || 0,
      showVotes: limit.show_votes || 0,
      lastDailyReset: limit.last_daily_reset || new Date().toISOString().split('T')[0]
    }));

  } catch (error) {
    console.error('Error getting all vote limits:', error);
    return [];
  }
}

// Reset daily votes for all users (called by cron job)
export async function resetDailyVotes(): Promise<{ success: boolean; error?: string }> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { error } = await supabase
      .from('vote_limits')
      .update({
        daily_votes: 0,
        last_daily_reset: today
      })
      .neq('last_daily_reset', today);

    if (error) {
      throw error;
    }

    return { success: true };

  } catch (error) {
    console.error('Error resetting daily votes:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
