
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface VotingState {
  userVotes: Set<string>;
  voteCounts: Map<string, number>;
  submitting: Set<string>;
  canVote: (setlistSongId: string) => boolean;
  vote: (setlistSongId: string) => Promise<boolean>;
  refreshVotes: () => void;
}

export function useEnhancedVoting(showId: string): VotingState {
  const { user } = useAuth();
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const [voteCounts, setVoteCounts] = useState<Map<string, number>>(new Map());
  const [submitting, setSubmitting] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user || !showId) return;

    fetchUserVotes();
    setupRealtimeSubscription();
  }, [user, showId]);

  const fetchUserVotes = async () => {
    if (!user) return;

    try {
      const { data: votes } = await supabase
        .from('votes')
        .select(`
          setlist_song_id,
          setlist_songs!inner(
            setlists!inner(show_id)
          )
        `)
        .eq('user_id', user.id)
        .eq('setlist_songs.setlists.show_id', showId);

      if (votes) {
        const voteSet = new Set(votes.map(v => v.setlist_song_id));
        setUserVotes(voteSet);
      }
    } catch (error) {
      console.error('Error fetching user votes:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`voting-${showId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'setlist_songs'
        },
        (payload) => {
          const { id, votes } = payload.new;
          setVoteCounts(prev => new Map(prev.set(id, votes)));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'votes'
        },
        (payload) => {
          if (payload.new.user_id === user?.id) {
            setUserVotes(prev => new Set([...prev, payload.new.setlist_song_id]));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const canVote = (setlistSongId: string): boolean => {
    if (!user) return false;
    if (userVotes.has(setlistSongId)) return false;
    if (submitting.has(setlistSongId)) return false;
    return true;
  };

  const vote = async (setlistSongId: string): Promise<boolean> => {
    if (!user) {
      toast.error('Please log in to vote');
      return false;
    }

    if (!canVote(setlistSongId)) {
      toast.info('You have already voted for this song');
      return false;
    }

    // Add to submitting set
    setSubmitting(prev => new Set([...prev, setlistSongId]));

    try {
      // Optimistic update
      setUserVotes(prev => new Set([...prev, setlistSongId]));
      setVoteCounts(prev => {
        const current = prev.get(setlistSongId) || 0;
        return new Map(prev.set(setlistSongId, current + 1));
      });

      const { data, error } = await supabase.rpc('vote_for_song', {
        setlist_song_id: setlistSongId
      });

      if (error) {
        // Revert optimistic update
        setUserVotes(prev => {
          const newSet = new Set(prev);
          newSet.delete(setlistSongId);
          return newSet;
        });
        setVoteCounts(prev => {
          const current = prev.get(setlistSongId) || 1;
          return new Map(prev.set(setlistSongId, Math.max(0, current - 1)));
        });

        if (error.message.includes('Already voted')) {
          toast.info('You already voted for this song');
        } else if (error.message.includes('limit')) {
          toast.error(error.message);
        } else {
          toast.error('Failed to vote. Please try again.');
        }
        return false;
      }

      const result = data as { success: boolean; message?: string; votes?: number };
      
      if (result.success) {
        if (result.votes) {
          setVoteCounts(prev => new Map(prev.set(setlistSongId, result.votes)));
        }
        toast.success('Vote recorded!');
        return true;
      } else {
        // Revert optimistic update
        setUserVotes(prev => {
          const newSet = new Set(prev);
          newSet.delete(setlistSongId);
          return newSet;
        });
        toast.error(result.message || 'Failed to vote');
        return false;
      }
    } catch (error) {
      // Revert optimistic update
      setUserVotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(setlistSongId);
        return newSet;
      });
      setVoteCounts(prev => {
        const current = prev.get(setlistSongId) || 1;
        return new Map(prev.set(setlistSongId, Math.max(0, current - 1)));
      });
      
      console.error('Error voting:', error);
      toast.error('An unexpected error occurred. Please try again.');
      return false;
    } finally {
      // Remove from submitting set
      setSubmitting(prev => {
        const newSet = new Set(prev);
        newSet.delete(setlistSongId);
        return newSet;
      });
    }
  };

  const refreshVotes = () => {
    fetchUserVotes();
  };

  return {
    userVotes,
    voteCounts,
    submitting,
    canVote,
    vote,
    refreshVotes
  };
}
