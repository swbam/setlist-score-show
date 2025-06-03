
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DatabaseManager } from '@/services/databaseManager';
import { supabase } from '@/integrations/supabase/client';

export interface VoteStatus {
  daily_votes_used: number;
  daily_votes_remaining: number;
  show_votes_used: number;
  show_votes_remaining: number;
  user_voted_songs: string[];
  authenticated: boolean;
}

export interface VoteResult {
  success: boolean;
  error?: string;
  votes?: number;
  daily_votes_used?: number;
  show_votes_used?: number;
}

export function useVoteTrackingFixed(showId: string) {
  const { user } = useAuth();
  const [voteStatus, setVoteStatus] = useState<VoteStatus>({
    daily_votes_used: 0,
    daily_votes_remaining: 50,
    show_votes_used: 0,
    show_votes_remaining: 10,
    user_voted_songs: [],
    authenticated: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load vote status
  const loadVoteStatus = useCallback(async () => {
    if (!showId) {
      setIsLoading(false);
      return;
    }

    try {
      console.log(`[Vote Tracking] Loading vote status for show: ${showId}`);
      setIsLoading(true);
      setError(null);

      const stats = await DatabaseManager.getUserVoteStats(showId, user?.id || '');
      
      if (stats) {
        const status: VoteStatus = {
          daily_votes_used: stats.daily_votes_used || 0,
          daily_votes_remaining: Math.max(0, 50 - (stats.daily_votes_used || 0)),
          show_votes_used: stats.show_votes_used || 0,
          show_votes_remaining: Math.max(0, 10 - (stats.show_votes_used || 0)),
          user_voted_songs: stats.user_voted_songs || [],
          authenticated: !!user
        };
        
        console.log(`[Vote Tracking] Loaded status:`, status);
        setVoteStatus(status);
      } else {
        console.log(`[Vote Tracking] No stats returned, using defaults`);
        setVoteStatus(prev => ({ ...prev, authenticated: !!user }));
      }
    } catch (error) {
      console.error(`[Vote Tracking] Error loading vote status:`, error);
      setError(error instanceof Error ? error.message : 'Failed to load vote status');
    } finally {
      setIsLoading(false);
    }
  }, [showId, user?.id]);

  // Load status on mount and when dependencies change
  useEffect(() => {
    loadVoteStatus();
  }, [loadVoteStatus]);

  // Vote for a song
  const voteForSong = useCallback(async (setlistSongId: string): Promise<boolean> => {
    if (!user) {
      console.warn(`[Vote Tracking] User not authenticated`);
      setError('You must be logged in to vote');
      return false;
    }

    if (voteStatus.show_votes_remaining <= 0) {
      console.warn(`[Vote Tracking] Show vote limit reached`);
      setError('You have reached the vote limit for this show');
      return false;
    }

    if (voteStatus.daily_votes_remaining <= 0) {
      console.warn(`[Vote Tracking] Daily vote limit reached`);
      setError('You have reached your daily vote limit');
      return false;
    }

    try {
      console.log(`[Vote Tracking] Voting for setlist song: ${setlistSongId}`);

      const result = await DatabaseManager.voteForSong(setlistSongId, user.id);
      
      if (result && result.success) {
        console.log(`[Vote Tracking] Vote successful:`, result);
        
        // Update local state
        setVoteStatus(prev => ({
          ...prev,
          daily_votes_used: result.daily_votes_used || prev.daily_votes_used + 1,
          daily_votes_remaining: Math.max(0, prev.daily_votes_remaining - 1),
          show_votes_used: result.show_votes_used || prev.show_votes_used + 1,
          show_votes_remaining: Math.max(0, prev.show_votes_remaining - 1)
        }));

        setError(null);
        return true;
      } else {
        const errorMsg = result?.error || 'Vote failed';
        console.error(`[Vote Tracking] Vote failed:`, errorMsg);
        setError(errorMsg);
        return false;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Vote failed';
      console.error(`[Vote Tracking] Vote error:`, error);
      setError(errorMsg);
      return false;
    }
  }, [user, voteStatus.show_votes_remaining, voteStatus.daily_votes_remaining]);

  // Check if user has voted for a specific song
  const hasVotedForSong = useCallback((songId: string): boolean => {
    return voteStatus.user_voted_songs.includes(songId);
  }, [voteStatus.user_voted_songs]);

  // Check if user can vote
  const canVote = useCallback((): boolean => {
    return !!(
      user && 
      voteStatus.authenticated && 
      voteStatus.daily_votes_remaining > 0 && 
      voteStatus.show_votes_remaining > 0
    );
  }, [user, voteStatus.authenticated, voteStatus.daily_votes_remaining, voteStatus.show_votes_remaining]);

  // Get vote limits info
  const getVoteLimitsInfo = useCallback(() => {
    return {
      dailyUsed: voteStatus.daily_votes_used,
      dailyRemaining: voteStatus.daily_votes_remaining,
      dailyLimit: 50,
      showUsed: voteStatus.show_votes_used,
      showRemaining: voteStatus.show_votes_remaining,
      showLimit: 10
    };
  }, [voteStatus]);

  return {
    voteStatus,
    isLoading,
    error,
    voteForSong,
    hasVotedForSong,
    canVote,
    getVoteLimitsInfo,
    refreshVoteStatus: loadVoteStatus
  };
}
