
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface VoteStatus {
  authenticated: boolean;
  daily_votes_used: number;
  daily_votes_remaining: number;
  show_votes_used: number;
  show_votes_remaining: number;
  voted_song_ids: string[];
}

interface VoteResult {
  success: boolean;
  error?: string;
  daily_votes_used?: number;
  daily_votes_remaining?: number;
  show_votes_used?: number;
  show_votes_remaining?: number;
}

export function useVoteTracking(showId: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [voteStatus, setVoteStatus] = useState<VoteStatus>({
    authenticated: false,
    daily_votes_used: 0,
    daily_votes_remaining: 50,
    show_votes_used: 0,
    show_votes_remaining: 10,
    voted_song_ids: []
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user's vote status for this show
  const fetchVoteStatus = async () => {
    if (!user || !showId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc('get_user_votes_for_show', { p_show_id: showId });

      if (error) throw error;

      if (data) {
        setVoteStatus(data as unknown as VoteStatus);
      }
    } catch (error) {
      console.error('Error fetching vote status:', error);
      toast({
        title: "Error",
        description: "Failed to load vote status",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Vote for a song
  const voteForSong = async (setlistSongId: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to vote",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { data, error } = await supabase
        .rpc('vote_for_song', { setlist_song_id: setlistSongId });

      if (error) throw error;

      const result = data as unknown as VoteResult;

      if (!result.success) {
        toast({
          title: "Vote Failed",
          description: result.error || "Unable to cast vote",
          variant: "destructive"
        });
        return false;
      }

      // Update local state with new vote counts
      setVoteStatus(prev => ({
        ...prev,
        daily_votes_used: result.daily_votes_used || prev.daily_votes_used,
        daily_votes_remaining: result.daily_votes_remaining || prev.daily_votes_remaining,
        show_votes_used: result.show_votes_used || prev.show_votes_used,
        show_votes_remaining: result.show_votes_remaining || prev.show_votes_remaining
      }));

      toast({
        title: "Vote Cast!",
        description: `${result.show_votes_remaining} votes remaining for this show`,
      });

      // Refresh vote status to get updated voted_song_ids
      await fetchVoteStatus();
      
      return true;
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: "Error",
        description: "Failed to cast vote",
        variant: "destructive"
      });
      return false;
    }
  };

  // Check if user has voted for a specific song
  const hasVotedForSong = (songId: string): boolean => {
    return voteStatus.voted_song_ids.includes(songId);
  };

  // Check if user can vote
  const canVote = (): boolean => {
    return user !== null && 
           voteStatus.show_votes_remaining > 0 && 
           voteStatus.daily_votes_remaining > 0;
  };

  useEffect(() => {
    fetchVoteStatus();
  }, [user, showId]);

  return {
    voteStatus,
    isLoading,
    voteForSong,
    hasVotedForSong,
    canVote,
    refreshVoteStatus: fetchVoteStatus
  };
}
