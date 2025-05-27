
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface VoteLimits {
  votesUsedToday: number;
  votesUsedThisShow: number;
  maxDailyVotes: number;
  maxShowVotes: number;
  canVote: boolean;
  reason?: string;
}

export function useVoteLimits(showId?: string) {
  const { user } = useAuth();
  const [limits, setLimits] = useState<VoteLimits>({
    votesUsedToday: 0,
    votesUsedThisShow: 0,
    maxDailyVotes: 50,
    maxShowVotes: 10,
    canVote: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLimits(prev => ({ ...prev, canVote: false, reason: 'Please log in to vote', loading: false }));
      setLoading(false);
      return;
    }

    fetchVoteLimits();
  }, [user, showId]);

  const fetchVoteLimits = async () => {
    if (!user || !showId) return;

    try {
      setLoading(true);

      // Get today's votes
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count: dailyVotes } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString());

      // Get votes for this specific show
      const { count: showVotes } = await supabase
        .from('votes')
        .select(`
          *,
          setlist_songs!inner(
            setlists!inner(show_id)
          )
        `, { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('setlist_songs.setlists.show_id', showId);

      const votesUsedToday = dailyVotes || 0;
      const votesUsedThisShow = showVotes || 0;
      const maxDailyVotes = 50;
      const maxShowVotes = 10;

      let canVote = true;
      let reason = '';

      if (votesUsedToday >= maxDailyVotes) {
        canVote = false;
        reason = `Daily vote limit reached (${maxDailyVotes})`;
      } else if (votesUsedThisShow >= maxShowVotes) {
        canVote = false;
        reason = `Vote limit for this show reached (${maxShowVotes})`;
      }

      setLimits({
        votesUsedToday,
        votesUsedThisShow,
        maxDailyVotes,
        maxShowVotes,
        canVote,
        reason
      });
    } catch (error) {
      console.error('Error fetching vote limits:', error);
      setLimits(prev => ({ ...prev, canVote: false, reason: 'Unable to verify vote eligibility' }));
    } finally {
      setLoading(false);
    }
  };

  const refreshLimits = () => {
    fetchVoteLimits();
  };

  return { ...limits, loading, refreshLimits };
}
