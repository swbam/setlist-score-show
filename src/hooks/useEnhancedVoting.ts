import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeVotingEnhanced } from './useRealtimeVotingEnhanced';
import { toast } from '@/components/ui/sonner';

interface VoteResult {
  success: boolean;
  error?: string;
  votes?: number;
  daily_votes_used?: number;
  daily_votes_remaining?: number;
  show_votes_used?: number;
  show_votes_remaining?: number;
}

interface UserVoteStats {
  dailyVotesUsed: number;
  dailyVotesRemaining: number;
  showVotesUsed: number;
  showVotesRemaining: number;
}

export function useEnhancedVoting(setlistId: string | null, showId: string | null, userId: string | null) {
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const [voteStats, setVoteStats] = useState<UserVoteStats>({
    dailyVotesUsed: 0,
    dailyVotesRemaining: 50,
    showVotesUsed: 0,
    showVotesRemaining: 10
  });
  const [submittingVotes, setSubmittingVotes] = useState<Set<string>>(new Set());
  
  const {
    voteCounts,
    isConnected,
    recentActivity,
    getVoteCount,
    optimisticVoteUpdate,
    revertVoteUpdate,
    reconnect
  } = useRealtimeVotingEnhanced(setlistId);

  // Load user's existing votes and stats
  // Load user's existing votes and stats using the new RPC function
  const loadUserVoteData = useCallback(async () => {
    if (!userId || !showId) return;

    try {
      // Use the new get_user_vote_stats RPC function
      const { data, error } = await supabase.rpc('get_user_vote_stats', {
        show_id_param: showId
      });

      if (error) {
        console.error('Error getting user vote stats:', error);
        return;
      }

      const voteData = data as any;
      if (voteData && voteData.authenticated) {
        // Set user vote stats
        setVoteStats({
          dailyVotesUsed: voteData.daily_votes_used || 0,
          dailyVotesRemaining: voteData.daily_votes_remaining || 50,
          showVotesUsed: voteData.show_votes_used || 0,
          showVotesRemaining: voteData.show_votes_remaining || 10
        });

        // Set voted songs
        const votedSongs = voteData.voted_songs || [];
        setUserVotes(new Set(votedSongs));
      } else {
        // User not authenticated or no data
        setVoteStats({
          dailyVotesUsed: 0,
          dailyVotesRemaining: 50,
          showVotesUsed: 0,
          showVotesRemaining: 10
        });
        setUserVotes(new Set());
      }
    } catch (error) {
      console.error('Error loading user vote data:', error);
    }
  }, [userId, showId]);
  useEffect(() => {
    loadUserVoteData();
  }, [loadUserVoteData]);

  // Enhanced vote function with proper error handling and optimistic updates
  const vote = useCallback(async (setlistSongId: string): Promise<VoteResult> => {
    if (!userId) {
      toast.error("Please log in to vote");
      return { success: false, error: "Authentication required" };
    }

    if (userVotes.has(setlistSongId)) {
      toast.info("You've already voted for this song");
      return { success: false, error: "Already voted" };
    }

    if (voteStats.showVotesRemaining <= 0) {
      toast.error("You've reached your vote limit for this show (10 votes)");
      return { success: false, error: "Show vote limit reached" };
    }

    if (voteStats.dailyVotesRemaining <= 0) {
      toast.error("You've reached your daily vote limit (50 votes)");
      return { success: false, error: "Daily vote limit reached" };
    }

    // Add to submitting set
    setSubmittingVotes(prev => new Set([...prev, setlistSongId]));

    try {
      // Optimistic updates
      optimisticVoteUpdate(setlistSongId);
      setUserVotes(prev => new Set([...prev, setlistSongId]));
      setVoteStats(prev => ({
        ...prev,
        dailyVotesUsed: prev.dailyVotesUsed + 1,
        dailyVotesRemaining: prev.dailyVotesRemaining - 1,
        showVotesUsed: prev.showVotesUsed + 1,
        showVotesRemaining: prev.showVotesRemaining - 1
      }));

      // Call database function
      const { data, error } = await supabase.rpc('vote_for_song', {
        setlist_song_id: setlistSongId
      });

      if (error) {
        throw error;
      }

      const result = data as unknown as VoteResult;
      
      if (!result.success) {
        throw new Error(result.error || 'Vote failed');
      }

      // Update stats with server response
      if (result.daily_votes_used !== undefined) {
        setVoteStats(prev => ({
          ...prev,
          dailyVotesUsed: result.daily_votes_used!,
          dailyVotesRemaining: result.daily_votes_remaining!,
          showVotesUsed: result.show_votes_used!,
          showVotesRemaining: result.show_votes_remaining!
        }));
      }

      toast.success("Vote recorded!");
      return result;

    } catch (error: any) {
      console.error('Vote error:', error);
      
      // Revert optimistic updates
      revertVoteUpdate(setlistSongId);
      setUserVotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(setlistSongId);
        return newSet;
      });
      setVoteStats(prev => ({
        ...prev,
        dailyVotesUsed: Math.max(0, prev.dailyVotesUsed - 1),
        dailyVotesRemaining: Math.min(50, prev.dailyVotesRemaining + 1),
        showVotesUsed: Math.max(0, prev.showVotesUsed - 1),
        showVotesRemaining: Math.min(10, prev.showVotesRemaining + 1)
      }));

      const errorMessage = error.message || 'Failed to vote';
      toast.error(errorMessage);
      
      return { success: false, error: errorMessage };
    } finally {
      // Remove from submitting set
      setSubmittingVotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(setlistSongId);
        return newSet;
      });
    }
  }, [userId, userVotes, voteStats, optimisticVoteUpdate, revertVoteUpdate]);

  // Check if user has voted for a specific song
  const hasUserVoted = useCallback((setlistSongId: string): boolean => {
    return userVotes.has(setlistSongId);
  }, [userVotes]);

  // Check if vote is currently submitting
  const isVoteSubmitting = useCallback((setlistSongId: string): boolean => {
    return submittingVotes.has(setlistSongId);
  }, [submittingVotes]);

  return {
    // Vote counts and real-time data
    voteCounts,
    getVoteCount,
    isConnected,
    recentActivity,
    
    // User-specific data
    userVotes,
    voteStats,
    hasUserVoted,
    isVoteSubmitting,
    
    // Actions
    vote,
    reconnect,
    refreshUserData: loadUserVoteData
  };
}
