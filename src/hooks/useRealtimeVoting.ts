
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
  const isSubscribedRef = useRef(false);
  const componentMountedRef = useRef(true);
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

  // Handle incoming vote updates with memory leak prevention
  const handleVoteUpdate = useCallback(async (payload: any) => {
    // Early exit if component is unmounted
    if (!componentMountedRef.current) return;
    
    const update = payload.new as VoteUpdate;
    
    // Update local vote count only if component is still mounted
    setVoteCounts(prev => {
      if (!componentMountedRef.current) return prev;
      return {
        ...prev,
        [update.setlist_song_id]: update.votes
      };
    });

    // Show toast for other users' votes
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (componentMountedRef.current && update.user_id !== user?.id) {
        toast({
          title: "New Vote!",
          description: "Someone just voted for a song",
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Error checking user in vote update:', error);
    }
  }, [toast]);

  // Set up realtime subscription with enhanced cleanup
  useEffect(() => {
    componentMountedRef.current = true;
    
    if (!setlistId) {
      // Clean up if no setlistId
      if (channelRef.current && isSubscribedRef.current) {
        try {
          supabase.removeChannel(channelRef.current);
        } catch (error) {
          console.error('Error removing channel:', error);
        }
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
      setIsConnected(false);
      setVoteCounts({});
      return;
    }

    // Initialize counts
    initializeVoteCounts();

    // Create channel for this setlist with unique identifier
    const channelName = `setlist-votes-${setlistId}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
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
      .subscribe((status, error) => {
        if (!componentMountedRef.current) return;
        
        if (error) {
          console.error('Realtime subscription error:', error);
          setIsConnected(false);
          return;
        }
        
        setIsConnected(status === 'SUBSCRIBED');
        isSubscribedRef.current = status === 'SUBSCRIBED';
        
        if (status === 'SUBSCRIBED') {
          console.log('Connected to realtime voting updates');
        } else if (status === 'CLOSED') {
          console.log('Disconnected from realtime voting updates');
          isSubscribedRef.current = false;
        }
      });

    channelRef.current = channel;

    // Enhanced cleanup function
    return () => {
      componentMountedRef.current = false;
      
      if (channelRef.current) {
        try {
          // Unsubscribe from all events first
          channelRef.current.unsubscribe();
          
          // Remove the channel
          supabase.removeChannel(channelRef.current);
          
          console.log('Successfully cleaned up realtime channel');
        } catch (error) {
          console.error('Error during channel cleanup:', error);
        }
        
        channelRef.current = null;
        isSubscribedRef.current = false;
      }
      
      // Reset state
      setIsConnected(false);
      setVoteCounts({});
    };
  }, [setlistId, initializeVoteCounts, handleVoteUpdate]);

  // Component unmount cleanup
  useEffect(() => {
    return () => {
      componentMountedRef.current = false;
    };
  }, []);

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
