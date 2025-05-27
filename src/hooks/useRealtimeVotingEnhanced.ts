import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

type RealtimeChannel = any;

interface VoteUpdate {
  setlist_song_id: string;
  votes: number;
  user_id: string;
  user_display_name?: string;
  song_name?: string;
}

interface SetlistSongVotes {
  [setlistSongId: string]: number;
}

interface VoteActivity {
  id: string;
  songName: string;
  userDisplayName: string;
  timestamp: Date;
  votes: number;
}

export function useRealtimeVotingEnhanced(setlistId: string | null) {
  const [voteCounts, setVoteCounts] = useState<SetlistSongVotes>({});
  const [isConnected, setIsConnected] = useState(false);
  const [recentActivity, setRecentActivity] = useState<VoteActivity[]>([]);
  const [connectionRetries, setConnectionRetries] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const currentUserId = useRef<string | null>(null);

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      currentUserId.current = user?.id || null;
    };
    getCurrentUser();
  }, []);

  // Initialize vote counts with enhanced error handling
  const initializeVoteCounts = useCallback(async () => {
    if (!setlistId) return;

    try {
      const { data, error } = await supabase
        .from('setlist_songs')
        .select(`
          id, 
          votes,
          song:songs(name)
        `)
        .eq('setlist_id', setlistId);

      if (error) throw error;

      const counts: SetlistSongVotes = {};
      data?.forEach(song => {
        counts[song.id] = song.votes;
      });
      
      setVoteCounts(counts);
      console.log(`Initialized ${Object.keys(counts).length} song vote counts`);
    } catch (error) {
      console.error('Error initializing vote counts:', error);
      toast.error('Failed to load vote counts');
    }
  }, [setlistId]);

  // Enhanced vote update handler with user feedback
  const handleVoteUpdate = useCallback(async (payload: any) => {
    const update = payload.new;
    
    // Update local vote count immediately
    setVoteCounts(prev => ({
      ...prev,
      [update.id]: update.votes
    }));

    // Get additional context for the vote with separate queries to avoid relation conflicts
    try {
      // Get song name
      const { data: songData } = await supabase
        .from('setlist_songs')
        .select('song_id')
        .eq('id', update.id)
        .single();

      if (songData) {
        const { data: song } = await supabase
          .from('songs')
          .select('name')
          .eq('id', songData.song_id)
          .single();

        // Get latest vote for this song
        const { data: latestVote } = await supabase
          .from('votes')
          .select('user_id, created_at')
          .eq('setlist_song_id', update.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (latestVote && latestVote.user_id !== currentUserId.current) {
          // Get user display name
          const { data: user } = await supabase
            .from('users')
            .select('display_name')
            .eq('id', latestVote.user_id)
            .single();

          const activity: VoteActivity = {
            id: `${update.id}-${Date.now()}`,
            songName: song?.name || 'Unknown Song',
            userDisplayName: user?.display_name || 'Someone',
            timestamp: new Date(),
            votes: update.votes
          };

          setRecentActivity(prev => [activity, ...prev.slice(0, 4)]);
          
          toast.success(`${activity.userDisplayName} voted for "${activity.songName}"`, {
            duration: 3000,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching vote context:', error);
    }
  }, []);

  // Enhanced connection management with retry logic
  const setupRealtimeConnection = useCallback(() => {
    if (!setlistId) return;

    // Clean up existing connection
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`enhanced-setlist-votes-${setlistId}`)
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
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'votes'
        },
        async (payload) => {
          // Refresh vote counts when new votes are inserted
          const { data } = await supabase
            .from('setlist_songs')
            .select('id, votes, setlist_id')
            .eq('setlist_id', setlistId);
          
          if (data) {
            const counts: SetlistSongVotes = {};
            data.forEach(song => {
              counts[song.id] = song.votes;
            });
            setVoteCounts(counts);
          }
        }
      )
      .subscribe((status) => {
        console.log(`Realtime connection status: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setConnectionRetries(0);
          toast.success('Connected to live voting updates', { duration: 2000 });
        } else if (status === 'CLOSED') {
          setIsConnected(false);
          toast.error('Lost connection to live updates', { duration: 3000 });
          
          // Retry connection with exponential backoff
          if (connectionRetries < 3) {
            const retryDelay = Math.pow(2, connectionRetries) * 1000;
            setTimeout(() => {
              setConnectionRetries(prev => prev + 1);
              setupRealtimeConnection();
            }, retryDelay);
          }
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          toast.error('Connection error - retrying...', { duration: 2000 });
        }
      });

    channelRef.current = channel;
  }, [setlistId, handleVoteUpdate, connectionRetries]);

  // Initialize connection and vote counts
  useEffect(() => {
    if (!setlistId) return;

    initializeVoteCounts();
    setupRealtimeConnection();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [setlistId, initializeVoteCounts, setupRealtimeConnection]);

  // Get vote count for a specific setlist song
  const getVoteCount = useCallback((setlistSongId: string): number => {
    return voteCounts[setlistSongId] || 0;
  }, [voteCounts]);

  // Optimistic vote update with enhanced feedback
  const optimisticVoteUpdate = useCallback((setlistSongId: string, increment: number = 1) => {
    setVoteCounts(prev => {
      const newCount = (prev[setlistSongId] || 0) + increment;
      return {
        ...prev,
        [setlistSongId]: newCount
      };
    });
  }, []);

  // Revert optimistic update with bounds checking
  const revertVoteUpdate = useCallback((setlistSongId: string, decrement: number = 1) => {
    setVoteCounts(prev => ({
      ...prev,
      [setlistSongId]: Math.max(0, (prev[setlistSongId] || 0) - decrement)
    }));
  }, []);

  // Manual reconnection function
  const reconnect = useCallback(() => {
    setConnectionRetries(0);
    setupRealtimeConnection();
  }, [setupRealtimeConnection]);

  return {
    voteCounts,
    isConnected,
    recentActivity,
    connectionRetries,
    getVoteCount,
    optimisticVoteUpdate,
    revertVoteUpdate,
    refreshVoteCounts: initializeVoteCounts,
    reconnect
  };
}