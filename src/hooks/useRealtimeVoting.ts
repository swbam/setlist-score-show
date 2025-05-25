
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SetlistSong } from '@/pages/ShowVoting/types';

interface UseRealtimeVotingProps {
  setlistId: string | null;
  initialSongs: SetlistSong[];
}

export function useRealtimeVoting({ setlistId, initialSongs }: UseRealtimeVotingProps) {
  const [songs, setSongs] = useState<SetlistSong[]>(initialSongs);

  useEffect(() => {
    setSongs(initialSongs);
  }, [initialSongs]);

  useEffect(() => {
    if (!setlistId) return;

    console.log('Setting up real-time subscription for setlist:', setlistId);

    // Subscribe to changes in setlist_songs table
    const channel = supabase
      .channel(`setlist-${setlistId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'setlist_songs',
          filter: `setlist_id=eq.${setlistId}`
        },
        (payload) => {
          console.log('Real-time vote update received:', payload);
          
          setSongs(currentSongs => {
            const updatedSongs = currentSongs.map(song => 
              song.id === payload.new.id 
                ? { ...song, votes: payload.new.votes, position: payload.new.position }
                : song
            );
            
            // Sort by votes (descending) then by position
            return updatedSongs.sort((a, b) => b.votes - a.votes || a.position - b.position);
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'setlist_songs',
          filter: `setlist_id=eq.${setlistId}`
        },
        (payload) => {
          console.log('New song added to setlist:', payload);
          // Refresh the entire setlist when new songs are added
          window.location.reload();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [setlistId]);

  return { songs, setSongs };
}
