
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface VoteUpdate {
  setlistSongId: string;
  songId: string;
  newVoteCount: number;
  songTitle: string;
  voterId: string;
}

interface PresenceState {
  [key: string]: {
    online_at: string;
    user_id?: string;
  }[];
}

export function useRealtimeVotes(showId: string) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [latestUpdate, setLatestUpdate] = useState<VoteUpdate | null>(null);
  const [activeUsers, setActiveUsers] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [voteUpdates, setVoteUpdates] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    if (!showId) return;

    // Create a channel for this specific show
    const showChannel = supabase.channel(`show:${showId}`, {
      config: {
        presence: {
          key: 'user_id'
        }
      }
    });
    
    // Listen to database changes on setlist_songs table
    showChannel
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'setlist_songs',
          filter: `setlist_id=in.(SELECT id FROM setlists WHERE show_id=eq.${showId})`
        },
        async (payload) => {
          // When someone votes, the vote_count updates and we receive it here
          console.log('[Realtime] Vote update received:', payload);
          
          // Update local vote counts
          setVoteUpdates(prev => ({
            ...prev,
            [payload.new.id]: payload.new.votes || payload.new.vote_count || 0
          }));
          
          // Get additional song info if needed
          const { data: songInfo } = await supabase
            .from('songs')
            .select('name')
            .eq('id', payload.new.song_id)
            .single();
          
          setLatestUpdate({
            setlistSongId: payload.new.id,
            songId: payload.new.song_id,
            newVoteCount: payload.new.votes || payload.new.vote_count || 0,
            songTitle: songInfo?.name || '',
            voterId: '' // Anonymous for privacy
          });
        }
      )
      // Also listen to custom broadcasts for richer updates
      .on('broadcast', { event: 'vote_update' }, (payload) => {
        console.log('[Realtime] Custom vote update:', payload);
        setLatestUpdate(payload.payload as VoteUpdate);
      })
      // Track presence for active users
      .on('presence', { event: 'sync' }, () => {
        const state = showChannel.presenceState() as PresenceState;
        const uniqueUsers = new Set();
        
        Object.values(state).forEach(presences => {
          presences.forEach(presence => {
            if (presence.user_id) {
              uniqueUsers.add(presence.user_id);
            }
          });
        });
        
        setActiveUsers(uniqueUsers.size);
      })
      .subscribe(async (status) => {
        console.log(`[Realtime] Subscription status: ${status}`);
        setIsConnected(status === 'SUBSCRIBED');
        
        if (status === 'SUBSCRIBED') {
          // Track this user's presence
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await showChannel.track({
              online_at: new Date().toISOString(),
              user_id: user.id
            });
          }
        }
      });
    
    setChannel(showChannel);
    
    // Cleanup function
    return () => {
      console.log('[Realtime] Cleaning up channel');
      if (showChannel) {
        showChannel.untrack();
        supabase.removeChannel(showChannel);
      }
    };
  }, [showId]);

  // Function to broadcast custom vote updates
  const broadcastVoteUpdate = async (update: Partial<VoteUpdate>) => {
    if (!channel) return;
    
    await channel.send({
      type: 'broadcast',
      event: 'vote_update',
      payload: update
    });
  };

  return { 
    latestUpdate, 
    channel,
    activeUsers,
    isConnected,
    broadcastVoteUpdate,
    voteUpdates
  };
}

// Legacy export for backward compatibility
export const useRealtimeVotes = useRealtimeVotes;
