import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface VoteLimits {
  dailyVotesUsed: number;
  dailyVotesRemaining: number;
  showVotesUsed: number;
  showVotesRemaining: number;
  canVote: boolean;
  reason?: string;
}

export function useVoteLimits(showId?: string) {
  const { user } = useAuth();
  const [limits, setLimits] = useState<VoteLimits>({
    dailyVotesUsed: 0,
    dailyVotesRemaining: 50,
    showVotesUsed: 0,
    showVotesRemaining: 10,
    canVote: true
  });

  const refreshLimits = useCallback(async () => {
    if (!user || !showId) {
      setLimits({
        dailyVotesUsed: 0,
        dailyVotesRemaining: 50,
        showVotesUsed: 0,
        showVotesRemaining: 10,
        canVote: false,
        reason: 'Please log in to vote'
      });
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_user_vote_stats', {
        show_id_param: showId
      });

      if (error) {
        console.error('Error fetching vote limits:', error);
        return;
      }

      const stats = data as any;
      const canVote = stats.authenticated && 
                     stats.daily_votes_remaining > 0 && 
                     stats.show_votes_remaining > 0;
      
      let reason: string | undefined;
      if (!stats.authenticated) {
        reason = 'Please log in to vote';
      } else if (stats.daily_votes_remaining <= 0) {
        reason = 'Daily vote limit reached (50/50)';
      } else if (stats.show_votes_remaining <= 0) {
        reason = 'Show vote limit reached (10/10)';
      }

      setLimits({
        dailyVotesUsed: stats.daily_votes_used || 0,
        dailyVotesRemaining: stats.daily_votes_remaining || 0,
        showVotesUsed: stats.show_votes_used || 0,
        showVotesRemaining: stats.show_votes_remaining || 0,
        canVote,
        reason
      });
    } catch (error) {
      console.error('Error in refreshLimits:', error);
    }
  }, [user, showId]);

  useEffect(() => {
    refreshLimits();
  }, [refreshLimits]);

  return {
    ...limits,
    refreshLimits
  };
}
