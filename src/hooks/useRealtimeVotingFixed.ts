
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VoteUpdate {
  setlist_song_id: string;
  votes: number;
  user_id: string;
}

interface SetlistSongVotes {
  [setlistSongId: string]: number;
}

export function useRealtimeVotingFixed(setlistId: string | null) {
  const [voteCounts, setVoteCounts] = useState<SetlistSongVotes>({});
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<any>(null);
  const componentMountedRef = useRef(true);
  const { toast } = useToast();

  // Initialize vote counts from database
  const initializeVoteCounts = useCallback(async () => {
    if (!setlistId) return;

    try {
      console.log(`[Realtime Voting] Initializing vote counts for setlist: ${setlistId}`);
      
      const { data, error } = await supabase
        .from('setlist_songs')
        .select('id, votes')
        .eq('setlist_id', setlistId);

      if (error) {
        console.error(`[Realtime Voting] Error fetching vote counts:`, error);
        return;
      }

      const counts: SetlistSongVotes = {};
      data?.forEach(song => {
        counts[song.id] = song.votes || 0;
      });
      
      console.log(`[Realtime Voting] Initialized ${Object.keys(counts).length} vote counts`);
      setVoteCounts(counts);
    } catch (error) {
      console.error(`[Realtime Voting] Error initializing vote counts:`, error);
    }
  }, [setlistId]);

  // Handle incoming vote updates
  const handleVoteUpdate = useCallback(async (payload: any) => {
    if (!componentMountedRef.current) return;
    
    console.log(`[Realtime Voting] Received vote update:`, payload);
    
    const update = payload.new;
    
    // Update local vote count
    setVoteCounts(prev => {
      if (!componentMountedRef.current) return prev;
      return {
        ...prev,
        [update.id]: update.votes || 0
      };
    });

    // Show toast for other users' votes (optional)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (componentMountedRef.current && payload.eventType === 'UPDATE') {
        // Only show toast for actual vote increases, not initial loads
        toast({
          title: "Setlist Updated!",
          description: "Vote counts have been updated",
          duration: 2000,
        });
      }
    } catch (error) {
      console.error(`[Realtime Voting] Error in vote update handler:`, error);
    }
  }, [toast]);

  // Set up realtime subscription
  useEffect(() => {
    componentMountedRef.current = true;
    
    if (!setlistId) {
      console.log(`[Realtime Voting] No setlist ID, cleaning up subscription`);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
      setVoteCounts({});
      return;
    }

    console.log(`[Realtime Voting] Setting up subscription for setlist: ${setlistId}`);

    // Initialize counts first
    initializeVoteCounts();

    // Create realtime subscription
    const channelName = `setlist-votes-${setlistId}`;
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
        
        console.log(`[Realtime Voting] Subscription status: ${status}`, error);
        
        if (error) {
          console.error(`[Realtime Voting] Subscription error:`, error);
          setIsConnected(false);
          return;
        }
        
        setIsConnected(status === 'SUBSCRIBED');
        
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime Voting] Connected to realtime updates`);
        } else if (status === 'CLOSED') {
          console.log(`[Realtime Voting] Disconnected from realtime updates`);
        }
      });

    channelRef.current = channel;

    // Cleanup function
    return () => {
      console.log(`[Realtime Voting] Cleaning up subscription`);
      componentMountedRef.current = false;
      
      if (channelRef.current) {
        try {
          channelRef.current.unsubscribe();
          supabase.removeChannel(channelRef.current);
        } catch (error) {
          console.error(`[Realtime Voting] Error during cleanup:`, error);
        }
        channelRef.current = null;
      }
      
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

  // Optimistic vote update
  const optimisticVoteUpdate = useCallback((setlistSongId: string, increment: number = 1) => {
    console.log(`[Realtime Voting] Optimistic update: ${setlistSongId} +${increment}`);
    setVoteCounts(prev => ({
      ...prev,
      [setlistSongId]: (prev[setlistSongId] || 0) + increment
    }));
  }, []);

  // Revert optimistic update
  const revertVoteUpdate = useCallback((setlistSongId: string, decrement: number = 1) => {
    console.log(`[Realtime Voting] Reverting update: ${setlistSongId} -${decrement}`);
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
