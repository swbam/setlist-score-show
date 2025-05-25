
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VoteUpdate {
  id: string;
  votes: number;
}

export const useRealtimeVotes = (setlistId: string) => {
  const [voteUpdates, setVoteUpdates] = useState<VoteUpdate[]>([]);

  useEffect(() => {
    if (!setlistId) return;

    // Subscribe to real-time updates for setlist songs
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
        (payload) => {
          console.log('Real-time vote update:', payload);
          if (payload.new) {
            setVoteUpdates(prev => {
              const existing = prev.find(v => v.id === payload.new.id);
              if (existing) {
                return prev.map(v => 
                  v.id === payload.new.id 
                    ? { id: payload.new.id, votes: payload.new.votes }
                    : v
                );
              } else {
                return [...prev, { id: payload.new.id, votes: payload.new.votes }];
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [setlistId]);

  return voteUpdates;
};
