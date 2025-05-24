
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as setlistService from "@/services/setlist";

// Define simple types that avoid the recursive type issue
interface SimpleSong {
  id: string;
  name: string;
  album?: string;
  duration_ms?: number;
}

interface SimpleSetlistSong {
  id: string;
  song_id: string;
  votes: number;
  position: number;
  song: SimpleSong;
}

export function useSetlistVoting(setlistId: string) {
  const [songs, setSongs] = useState<SimpleSetlistSong[]>([]);
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
        const { data, error } = await supabase
          .from('setlist_songs')
          .select(`
            id,
            song_id,
            votes,
            position,
            song:songs (
              id,
              name,
              album,
              duration_ms
            )
          `)
          .eq('setlist_id', setlistId)
          .order('votes', { ascending: false });

        if (error) {
          throw error;
        }

        // Map to our simplified type structure to avoid recursive type issue
        const formattedData = data.map(item => ({
          id: item.id,
          song_id: item.song_id,
          votes: item.votes,
          position: item.position,
          song: item.song as SimpleSong
        }));

        setSongs(formattedData);

        // If user is logged in, fetch their votes
        if (user) {
          const { data: userVotesData, error: votesError } = await supabase
            .from('votes')
            .select('setlist_song_id')
            .eq('user_id', user.id)
            .eq('setlist_id', setlistId);

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
          // Update the songs state with the new vote count
          setSongs(currentSongs => currentSongs.map(song => 
            song.id === payload.new.id 
              ? { ...song, votes: payload.new.votes } 
              : song
          ).sort((a, b) => b.votes - a.votes));
        }
      )
      .subscribe();

    // Clean up subscription
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

    // Check if user already voted for this song
    if (userVotes[setlistSongId]) {
      toast("You already voted for this song");
      return false;
    }

    try {
      // Optimistically update the UI
      setSongs(currentSongs => 
        currentSongs.map(song => 
          song.id === setlistSongId 
            ? { ...song, votes: song.votes + 1 } 
            : song
        ).sort((a, b) => b.votes - a.votes)
      );
      
      setUserVotes(current => ({
        ...current,
        [setlistSongId]: true
      }));

      // Insert the vote record directly with both setlist_id and setlist_song_id
      const { error: insertError } = await supabase
        .from('votes')
        .insert({
          user_id: user.id,
          setlist_song_id: setlistSongId,
          setlist_id: setlistId
        });

      if (insertError) {
        console.error('Error inserting vote:', insertError);
        
        // Revert the optimistic update if there was an error
        setSongs(currentSongs => 
          currentSongs.map(song => 
            song.id === setlistSongId 
              ? { ...song, votes: song.votes - 1 } 
              : song
          ).sort((a, b) => b.votes - a.votes)
        );
        
        setUserVotes(current => {
          const updated = { ...current };
          delete updated[setlistSongId];
          return updated;
        });

        toast("Failed to vote");
        return false;
      }
      
      // Update the song's vote count
      const { error: updateError } = await supabase
        .from('setlist_songs')
        .update({ votes: songs.find(s => s.id === setlistSongId)?.votes + 1 })
        .eq('id', setlistSongId);
        
      if (updateError) {
        console.error('Error updating vote count:', updateError);
        // We don't revert UI changes since the vote record was created
      }

      toast("Your vote has been counted!");
      return true;
    } catch (error) {
      console.error('Error voting for song:', error);
      toast("Something went wrong while voting");
      return false;
    }
  }, [user, userVotes, setlistId, songs]);

  // Add a song to the setlist
  const addSong = useCallback(async (songId: string) => {
    if (!setlistId) return false;
    try {
      const success = await setlistService.addSongToSetlist(setlistId, songId);
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
