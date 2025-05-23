
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export interface SetlistSong {
  id: string;
  song_id: string;
  song_name: string;
  votes: number;
  position: number;
  album?: string;
  duration_ms?: number;
}

export function useSetlistVoting(setlistId: string) {
  const [songs, setSongs] = useState<SetlistSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [userVotes, setUserVotes] = useState<Record<string, boolean>>({});
  const { user } = useAuth();

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

        const formattedData: SetlistSong[] = data.map(item => ({
          id: item.id,
          song_id: item.song_id,
          song_name: item.song.name,
          votes: item.votes,
          position: item.position,
          album: item.song.album,
          duration_ms: item.song.duration_ms
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
        toast.error('Failed to load setlist');
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
      toast.error('Please sign in to vote');
      return false;
    }

    // Check if user already voted for this song
    if (userVotes[setlistSongId]) {
      toast.error('You already voted for this song');
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

        toast.error('Failed to vote: ' + insertError.message);
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

      toast.success('Your vote has been counted!');
      return true;
    } catch (error) {
      console.error('Error voting for song:', error);
      toast.error('Something went wrong while voting');
      return false;
    }
  }, [user, userVotes, setlistId, songs]);

  // Add a song to the setlist (for future implementation)
  const addSong = useCallback(async (songId: string) => {
    // Implementation for adding songs will go here
    toast.info('This feature is coming soon!');
    return false;
  }, []);

  return {
    songs,
    loading,
    userVotes,
    vote,
    addSong
  };
}
