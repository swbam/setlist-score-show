
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface VoteCounts {
  [setlistSongId: string]: number;
}

export function useRealtimeVotingFixed(setlistId: string | null) {
  const [voteCounts, setVoteCounts] = useState<VoteCounts>({});
  const [isConnected, setIsConnected] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Initialize vote counts from database
  const initializeVoteCounts = useCallback(async () => {
    if (!setlistId) return;

    try {
      const { data: setlistSongs, error } = await supabase
        .from('setlist_songs')
        .select('id, votes')
        .eq('setlist_id', setlistId);

      if (error) {
        console.error('Error fetching initial vote counts:', error);
        return;
      }

      const initialCounts: VoteCounts = {};
      setlistSongs?.forEach(song => {
        initialCounts[song.id] = song.votes;
      });
      
      setVoteCounts(initialCounts);
      console.log('✅ Initialized vote counts:', initialCounts);
    } catch (error) {
      console.error('Error initializing vote counts:', error);
    }
  }, [setlistId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!setlistId) return;

    console.log('🔄 Setting up real-time subscription for setlist:', setlistId);

    // Create channel for this specific setlist
    const realtimeChannel = supabase
      .channel(`setlist_votes_${setlistId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'setlist_songs',
          filter: `setlist_id=eq.${setlistId}`
        },
        (payload) => {
          console.log('📡 Real-time vote update:', payload);
          const updatedSong = payload.new as any;
          
          setVoteCounts(prev => ({
            ...prev,
            [updatedSong.id]: updatedSong.votes
          }));
        }
      )
      .on('subscribe', (status) => {
        console.log('📡 Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          console.log('✅ Real-time connection established');
        }
      })
      .on('error', (error) => {
        console.error('❌ Real-time subscription error:', error);
        setIsConnected(false);
      });

    // Subscribe to the channel
    realtimeChannel.subscribe();
    setChannel(realtimeChannel);

    // Initialize vote counts
    initializeVoteCounts();

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up real-time subscription');
      realtimeChannel.unsubscribe();
      setIsConnected(false);
      setChannel(null);
    };
  }, [setlistId, initializeVoteCounts]);

  // Optimistic update function
  const optimisticVoteUpdate = useCallback((setlistSongId: string) => {
    setVoteCounts(prev => ({
      ...prev,
      [setlistSongId]: (prev[setlistSongId] || 0) + 1
    }));
  }, []);

  // Revert optimistic update
  const revertVoteUpdate = useCallback((setlistSongId: string) => {
    setVoteCounts(prev => ({
      ...prev,
      [setlistSongId]: Math.max(0, (prev[setlistSongId] || 0) - 1)
    }));
  }, []);

  // Get current vote count for a song
  const getVoteCount = useCallback((setlistSongId: string): number => {
    return voteCounts[setlistSongId] || 0;
  }, [voteCounts]);

  return {
    voteCounts,
    isConnected,
    optimisticVoteUpdate,
    revertVoteUpdate,
    getVoteCount,
    channel
  };
}
