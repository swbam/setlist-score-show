import { supabase } from "@/integrations/supabase/client";

// Types for voting
export interface VoteRecord {
  id: string;
  user_id: string;
  setlist_song_id: string;
  created_at: string;
}

export interface VoteLimits {
  maxVotesPerShow: number;
  maxVotesPerSong: number;
  isUnlimited: boolean;
}

export interface VoteStatus {
  hasVoted: boolean;
  totalVotesUsed: number;
  votesRemaining: number | "unlimited";
  canVote: boolean;
}

// Constants
const DEFAULT_MAX_VOTES_PER_SHOW = 10;
const DEFAULT_MAX_VOTES_PER_SONG = 1;

// Get vote limits for a user
export async function getUserVoteLimits(userId: string | null): Promise<VoteLimits> {
  if (!userId) {
    // Non-authenticated users get limited votes
    return {
      maxVotesPerShow: 3,
      maxVotesPerSong: 1,
      isUnlimited: false
    };
  }
  
  // Authenticated users get more votes (can be expanded with premium tiers later)
  return {
    maxVotesPerShow: DEFAULT_MAX_VOTES_PER_SHOW,
    maxVotesPerSong: DEFAULT_MAX_VOTES_PER_SONG,
    isUnlimited: false
  };
}

// Get user's votes for a specific setlist
export async function getUserVotesForSetlist(
  userId: string, 
  setlistId: string
): Promise<Record<string, boolean>> {
  try {
    // Get all setlist songs for this setlist
    const { data: setlistSongs, error: songsError } = await supabase
      .from('setlist_songs')
      .select('id')
      .eq('setlist_id', setlistId);
      
    if (songsError) {
      console.error("Error fetching setlist songs:", songsError);
      return {};
    }
    
    if (!setlistSongs || setlistSongs.length === 0) {
      return {};
    }
    
    // Get user's votes for these songs
    const songIds = setlistSongs.map(s => s.id);
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('setlist_song_id')
      .eq('user_id', userId)
      .in('setlist_song_id', songIds);
      
    if (votesError) {
      console.error("Error fetching user votes:", votesError);
      return {};
    }
    
    // Convert to a map for easy lookup
    const votesMap: Record<string, boolean> = {};
    votes?.forEach(vote => {
      votesMap[vote.setlist_song_id] = true;
    });
    
    return votesMap;
  } catch (error) {
    console.error("Error in getUserVotesForSetlist:", error);
    return {};
  }
}

// Check if user can vote for a song
export async function checkVoteStatus(
  userId: string | null,
  setlistId: string,
  setlistSongId: string
): Promise<VoteStatus> {
  const limits = await getUserVoteLimits(userId);
  
  if (!userId) {
    // For non-authenticated users, we need to track votes differently (e.g., localStorage)
    // For now, we'll just return that they can vote with limits
    return {
      hasVoted: false,
      totalVotesUsed: 0,
      votesRemaining: limits.maxVotesPerShow,
      canVote: true
    };
  }
  
  try {
    // Check if user already voted for this specific song
    const { data: existingVote, error: voteCheckError } = await supabase
      .from('votes')
      .select('id')
      .eq('user_id', userId)
      .eq('setlist_song_id', setlistSongId)
      .maybeSingle();
      
    if (voteCheckError) {
      console.error("Error checking existing vote:", voteCheckError);
      return {
        hasVoted: false,
        totalVotesUsed: 0,
        votesRemaining: 0,
        canVote: false
      };
    }
    
    const hasVoted = !!existingVote;
    
    // Get total votes used for this setlist
    const userVotes = await getUserVotesForSetlist(userId, setlistId);
    const totalVotesUsed = Object.keys(userVotes).length;
    
    const votesRemaining = limits.isUnlimited 
      ? "unlimited" 
      : Math.max(0, limits.maxVotesPerShow - totalVotesUsed);
      
    const canVote = !hasVoted && (limits.isUnlimited || totalVotesUsed < limits.maxVotesPerShow);
    
    return {
      hasVoted,
      totalVotesUsed,
      votesRemaining,
      canVote
    };
  } catch (error) {
    console.error("Error in checkVoteStatus:", error);
    return {
      hasVoted: false,
      totalVotesUsed: 0,
      votesRemaining: 0,
      canVote: false
    };
  }
}

// Submit a vote for a song
export async function submitVote(
  userId: string,
  setlistSongId: string,
  setlistId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user can vote
    const voteStatus = await checkVoteStatus(userId, setlistId, setlistSongId);
    
    if (!voteStatus.canVote) {
      if (voteStatus.hasVoted) {
        return { success: false, error: "You've already voted for this song" };
      }
      return { success: false, error: "You've reached your vote limit for this show" };
    }
    
    // Start a transaction-like operation
    // First, insert the vote
    const { error: voteError } = await supabase
      .from('votes')
      .insert({
        user_id: userId,
        setlist_song_id: setlistSongId
      });
      
    if (voteError) {
      console.error("Error inserting vote:", voteError);
      return { success: false, error: "Failed to submit vote" };
    }
    
    // Then, increment the vote count on the setlist song
    const { data: currentSong, error: fetchError } = await supabase
      .from('setlist_songs')
      .select('votes')
      .eq('id', setlistSongId)
      .single();
      
    if (fetchError) {
      console.error("Error fetching current votes:", fetchError);
      // Vote was recorded but count update failed - not critical
      return { success: true };
    }
    
    const newVoteCount = (currentSong.votes || 0) + 1;
    
    const { error: updateError } = await supabase
      .from('setlist_songs')
      .update({ votes: newVoteCount })
      .eq('id', setlistSongId);
      
    if (updateError) {
      console.error("Error updating vote count:", updateError);
      // Vote was recorded but count update failed - not critical
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error in submitVote:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// Remove a vote (for future undo functionality)
export async function removeVote(
  userId: string,
  setlistSongId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Delete the vote
    const { error: deleteError } = await supabase
      .from('votes')
      .delete()
      .eq('user_id', userId)
      .eq('setlist_song_id', setlistSongId);
      
    if (deleteError) {
      console.error("Error removing vote:", deleteError);
      return { success: false, error: "Failed to remove vote" };
    }
    
    // Decrement the vote count
    const { data: currentSong, error: fetchError } = await supabase
      .from('setlist_songs')
      .select('votes')
      .eq('id', setlistSongId)
      .single();
      
    if (!fetchError && currentSong) {
      const newVoteCount = Math.max(0, (currentSong.votes || 0) - 1);
      
      await supabase
        .from('setlist_songs')
        .update({ votes: newVoteCount })
        .eq('id', setlistSongId);
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error in removeVote:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// Get vote statistics for a setlist
export async function getSetlistVoteStats(setlistId: string): Promise<{
  totalVotes: number;
  uniqueVoters: number;
  topSongs: Array<{ songId: string; votes: number }>;
}> {
  try {
    // Get all songs in the setlist with their vote counts
    const { data: songs, error: songsError } = await supabase
      .from('setlist_songs')
      .select('song_id, votes')
      .eq('setlist_id', setlistId)
      .order('votes', { ascending: false });
      
    if (songsError) {
      console.error("Error fetching setlist songs:", songsError);
      return { totalVotes: 0, uniqueVoters: 0, topSongs: [] };
    }
    
    const totalVotes = songs?.reduce((sum, song) => sum + (song.votes || 0), 0) || 0;
    const topSongs = songs?.slice(0, 5).map(s => ({ songId: s.song_id, votes: s.votes })) || [];
    
    // Get unique voters count
    const songIds = songs?.map(s => s.song_id) || [];
    const { data: voters, error: votersError } = await supabase
      .from('votes')
      .select('user_id')
      .in('setlist_song_id', songIds);
      
    if (votersError) {
      console.error("Error fetching voters:", votersError);
    }
    
    const uniqueVoters = new Set(voters?.map(v => v.user_id) || []).size;
    
    return {
      totalVotes,
      uniqueVoters,
      topSongs
    };
  } catch (error) {
    console.error("Error in getSetlistVoteStats:", error);
    return { totalVotes: 0, uniqueVoters: 0, topSongs: [] };
  }
} 