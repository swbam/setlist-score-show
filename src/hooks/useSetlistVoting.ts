
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as setlistService from "@/services/setlist";

// Simple types to avoid recursion
interface Song {
  id: string;
  name: string;
  album?: string;
  duration_ms?: number;
  artist_id: string;
  spotify_url: string;
}

interface SetlistSong {
  id: string;
  song_id: string;
  votes: number;
  position: number;
  song: Song;
}

export function useSetlistVoting(setlistId: string) {
  const [songs, setSongs] = useState<SetlistSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [userVotes, setUserVotes] = useState<Record<string, boolean>>({});
  const [user, setUser] = useState<any>(null);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };
    
    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Fetch initial data
  useEffect(() => {
    async function fetchSetlistSongs() {
      if (!setlistId) return;
      
      try {
        // Fixed query with proper column hints to avoid ambiguous relationships
        const { data, error } = await supabase
          .from('setlist_songs')
          .select(`
            id,
            song_id,
            votes,
            position,
            songs!setlist_songs_song_id_fkey (
              id,
              name,
              album,
              duration_ms,
              artist_id,
              spotify_url
            )
          `)
          .eq('setlist_id', setlistId)
          .order('votes', { ascending: false });

        if (error) {
          throw error;
        }

        const formattedData: SetlistSong[] = (data || []).map(item => ({
          id: item.id,
          song_id: item.song_id,
          votes: item.votes,
          position: item.position,
          song: {
            id: item.songs?.id || '',
            name: item.songs?.name || '',
            album: item.songs?.album || '',
            duration_ms: item.songs?.duration_ms || 0,
            artist_id: item.songs?.artist_id || '',
            spotify_url: item.songs?.spotify_url || ''
          }
        }));

        setSongs(formattedData);

        // If user is logged in, fetch their votes
        if (user) {
          const { data: userVotesData, error: votesError } = await supabase
            .from('votes')
            .select('setlist_song_id')
            .eq('user_id', user.id);

          if (!votesError && userVotesData) {
            const votesMap: Record<string, boolean> = {};
            userVotesData.forEach(vote => {
              votesMap[vote.setlist_song_id] = true;
            });
            setUserVotes(votesMap);
          }
        }
      } catch (error) {
        console.error('Error fetching setlist songs:', error);
        toast("Failed to load setlist");
      } finally {
        setLoading(false);
      }
    }

    fetchSetlistSongs();
  }, [setlistId, user]);

  // Set up real-time subscription
  useEffect(() => {
    if (!setlistId) return;

    const channel = supabase
      .channel(`setlist:${setlistId}`)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'setlist_songs', filter: `setlist_id=eq.${setlistId}` },
        (payload) => {
          setSongs(currentSongs => currentSongs.map(song => 
            song.id === payload.new.id 
              ? { ...song, votes: payload.new.votes } 
              : song
          ).sort((a, b) => b.votes - a.votes));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [setlistId]);

  // Vote for a song
  const vote = useCallback(async (setlistSongId: string) => {
    if (!user) {
      toast("Please sign in to vote");
      return false;
    }

    if (userVotes[setlistSongId]) {
      toast("You already voted for this song");
      return false;
    }

    try {
      // Use the database function for voting
      const { data, error } = await supabase.rpc('vote_for_song', {
        setlist_song_id: setlistSongId
      });

      if (error) {
        console.error('Error voting:', error);
        if (error.message.includes('Already voted')) {
          toast("You already voted for this song");
        } else {
          toast("Failed to vote");
        }
        return false;
      }

      if (data && data.success) {
        // Optimistically update the UI
        setSongs(currentSongs => 
          currentSongs.map(song => 
            song.id === setlistSongId 
              ? { ...song, votes: data.votes || song.votes + 1 } 
              : song
          ).sort((a, b) => b.votes - a.votes)
        );
        
        setUserVotes(current => ({
          ...current,
          [setlistSongId]: true
        }));

        toast("Your vote has been counted!");
        return true;
      } else {
        toast(data?.message || "Failed to vote");
        return false;
      }
    } catch (error) {
      console.error('Error voting for song:', error);
      toast("Something went wrong while voting");
      return false;
    }
  }, [user, userVotes]);

  // Add a song to the setlist
  const addSong = useCallback(async (songId: string) => {
    if (!setlistId) return false;
    try {
      const success = await setlistService.addSongToSetlist(setlistId, songId);
      if (success) {
        // Refresh the setlist
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
      return success;
    } catch (error) {
      console.error('Error adding song to setlist:', error);
      toast("Failed to add song to setlist");
      return false;
    }
  }, [setlistId]);

  return {
    songs,
    loading,
    userVotes,
    vote,
    addSong
  };
}
