import { useEffect, useRef, useState, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface VoteUpdate {
  id: string;
  votes: number;
  song_id: string;
}

export function useRealtimeVotingMemoryFixed(setlistId: string | null) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const { toast } = useToast();

  // Cleanup function that safely handles all state
  const cleanup = useCallback(() => {
    if (channelRef.current) {
      const channel = channelRef.current;
      channelRef.current = null;
      
      // Unsubscribe asynchronously without blocking
      channel.unsubscribe().catch((err) => {
        console.error('Error unsubscribing from channel:', err);
      });
    }
    
    // Only update state if component is still mounted
    if (isMountedRef.current) {
      setIsConnected(false);
      setError(null);
    }
  }, []);

  useEffect(() => {
    // Mark component as mounted
    isMountedRef.current = true;

    // Early exit if no setlistId
    if (!setlistId) {
      cleanup();
      return;
    }

    // Initialize connection
    const initializeConnection = async () => {
      try {
        // Clean up any existing connection first
        cleanup();

        // Create new channel with unique identifier
        const channelName = `setlist:${setlistId}:${Date.now()}`;
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
            (payload) => {
              // Check if component is still mounted before updating state
              if (isMountedRef.current && payload.new) {
                const update = payload.new as VoteUpdate;
                setVoteCounts(prev => ({
                  ...prev,
                  [update.id]: update.votes
                }));
              }
            }
          )
          .subscribe((status) => {
            if (isMountedRef.current) {
              setIsConnected(status === 'SUBSCRIBED');
              
              if (status === 'SUBSCRIBED') {
                // Fetch initial vote counts after successful subscription
                fetchInitialVotes();
              } else if (status === 'TIMED_OUT' || status === 'CLOSED') {
                setError('Connection lost. Trying to reconnect...');
                // Attempt to reconnect after a delay
                setTimeout(() => {
                  if (isMountedRef.current) {
                    initializeConnection();
                  }
                }, 5000);
              }
            }
          });

        channelRef.current = channel;
      } catch (err) {
        console.error('Failed to initialize realtime connection:', err);
        if (isMountedRef.current) {
          setError('Failed to connect to live updates');
          toast({
            title: 'Connection Error',
            description: 'Unable to establish real-time connection. Updates may be delayed.',
            variant: 'destructive'
          });
        }
      }
    };

    // Fetch initial vote counts
    const fetchInitialVotes = async () => {
      try {
        const { data, error } = await supabase
          .from('setlist_songs')
          .select('id, votes, song_id')
          .eq('setlist_id', setlistId);

        if (error) throw error;

        if (data && isMountedRef.current) {
          const counts: Record<string, number> = {};
          data.forEach(item => {
            counts[item.id] = item.votes || 0;
          });
          setVoteCounts(counts);
        }
      } catch (err) {
        console.error('Failed to fetch initial votes:', err);
        if (isMountedRef.current) {
          setError('Failed to load current vote counts');
        }
      }
    };

    // Start the connection
    initializeConnection();

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [setlistId, cleanup, toast]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    if (!setlistId) return;

    try {
      const { data, error } = await supabase
        .from('setlist_songs')
        .select('id, votes')
        .eq('setlist_id', setlistId);

      if (error) throw error;

      if (data && isMountedRef.current) {
        const counts: Record<string, number> = {};
        data.forEach(item => {
          counts[item.id] = item.votes || 0;
        });
        setVoteCounts(counts);
      }
    } catch (err) {
      console.error('Failed to refresh votes:', err);
      toast({
        title: 'Refresh Failed',
        description: 'Unable to refresh vote counts. Please try again.',
        variant: 'destructive'
      });
    }
  }, [setlistId, toast]);

  // Get vote count for a specific setlist song
  const getVoteCount = useCallback((setlistSongId: string): number => {
    return voteCounts[setlistSongId] || 0;
  }, [voteCounts]);

  return {
    voteCounts,
    isConnected,
    error,
    refresh,
    getVoteCount
  };
}