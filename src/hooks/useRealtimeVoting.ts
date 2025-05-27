
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type RealtimeChannel = any; // Type from Supabase client

interface VoteUpdate {
  setlist_song_id: string;
  votes: number;
  user_id: string;
}

interface SetlistSongVotes {
  [setlistSongId: string]: number;
}

export function useRealtimeVoting(setlistId: string | null) {
  const [voteCounts, setVoteCounts] = useState<SetlistSongVotes>({});
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { toast } = useToast();

  // Initialize vote counts from database
  const initializeVoteCounts = useCallback(async () => {
    if (!setlistId) return;

    try {
      const { data, error } = await supabase
        .from('setlist_songs')
        .select('id, votes')
        .eq('setlist_id', setlistId);

      if (error) throw error;

      const counts: SetlistSongVotes = {};
      data?.forEach(song => {
        counts[song.id] = song.votes;
      });
      
      setVoteCounts(counts);
    } catch (error) {
      console.error('Error initializing vote counts:', error);
    }
  }, [setlistId]);

  // Handle incoming vote updates
  const handleVoteUpdate = useCallback(async (payload: any) => {
    const update = payload.new as VoteUpdate;
    
    // Update local vote count
    setVoteCounts(prev => ({
      ...prev,
      [update.setlist_song_id]: update.votes
    }));

    // Show toast for other users' votes
    const { data: { user } } = await supabase.auth.getUser();
    if (update.user_id !== user?.id) {
      toast({
        title: "New Vote!",
        description: "Someone just voted for a song",
        duration: 2000,
      });
    }
  }, [toast]);

  // Set up realtime subscription
  useEffect(() => {
    if (!setlistId) return;

    // Initialize counts
    initializeVoteCounts();

    // Create channel for this setlist
    const channel = supabase
      .channel(`setlist-votes-${setlistId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'setlist_songs',
          filter: `setlist_id=eq.${setlistId}`
        },
        handleVoteUpdate
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
        if (status === 'SUBSCRIBED') {
          console.log('Connected to realtime voting updates');
        } else if (status === 'CLOSED') {
          console.log('Disconnected from realtime voting updates');
        }
      });

    channelRef.current = channel;

    // Cleanup subscription
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [setlistId, initializeVoteCounts, handleVoteUpdate]);

  // Get vote count for a specific setlist song
  const getVoteCount = useCallback((setlistSongId: string): number => {
    return voteCounts[setlistSongId] || 0;
  }, [voteCounts]);

  // Optimistically update vote count (before server confirmation)
  const optimisticVoteUpdate = useCallback((setlistSongId: string, increment: number = 1) => {
    setVoteCounts(prev => ({
      ...prev,
      [setlistSongId]: (prev[setlistSongId] || 0) + increment
    }));
  }, []);

  // Revert optimistic update if vote fails
  const revertVoteUpdate = useCallback((setlistSongId: string, decrement: number = 1) => {
    setVoteCounts(prev => ({
      ...prev,
      [setlistSongId]: Math.max(0, (prev[setlistSongId] || 0) - decrement)
    }));
  }, []);

  return {
    voteCounts,
    isConnected,
    getVoteCount,
    optimisticVoteUpdate,
    revertVoteUpdate,
    refreshVoteCounts: initializeVoteCounts
  };
}
