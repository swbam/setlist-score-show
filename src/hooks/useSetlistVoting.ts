
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface Song {
  id: string;
  name: string;
  artist_id: string;
  album: string;
  spotify_url: string;
}

interface SetlistSong {
  id: string;
  setlist_id: string;
  song_id: string;
  userVoted?: boolean;
  votes: number;
  position: number;
  song: Song;
}

// Type for the vote function response
interface VoteResponse {
  success: boolean;
  votes?: number;
  message?: string;
}

export function useSetlistVoting(setlistId: string) {
  const [songs, setSongs] = useState<SetlistSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    if (setlistId) {
      fetchSetlistSongs();
    }
  }, [setlistId]);

  const fetchSetlistSongs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('setlist_songs')
        .select(`
          id,
          votes,
          position,
          songs!setlist_songs_song_id_fkey (
            id,
            name,
            album,
            artist_id,
            spotify_url
          )
        `)
        .eq('setlist_id', setlistId)
        .order('votes', { ascending: false });

      if (error) throw error;

      const formattedSongs: SetlistSong[] = (data || []).map(item => ({
        id: item.id,
        setlist_id: setlistId,
        song_id: item.songs?.id || '',
        votes: item.votes,
        position: item.position,
        userVoted: false,
        song: {
          id: item.songs?.id || '',
          name: item.songs?.name || '',
          album: item.songs?.album || '',
          artist_id: item.songs?.artist_id || '',
          spotify_url: item.songs?.spotify_url || ''
        }
      }));

      setSongs(formattedSongs);
    } catch (error) {
      console.error('Error fetching setlist songs:', error);
      setError('Failed to load setlist songs');
    } finally {
      setLoading(false);
    }
  };

  const vote = async (setlistSongId: string): Promise<boolean> => {
    try {
      setSubmitting(setlistSongId);

      const { data, error } = await supabase.rpc('vote_for_song', {
        setlist_song_id: setlistSongId
      });

      if (error) {
        console.error('Vote error:', error);
        toast(`Error: ${error.message}`);
        return false;
      }

      // Safer type conversion with unknown first
      const voteResponse = data as unknown as VoteResponse;

      if (voteResponse && voteResponse.success) {
        // Optimistically update the UI
        setSongs(currentSongs => 
          currentSongs.map(song => 
            song.id === setlistSongId 
              ? { ...song, votes: voteResponse.votes || song.votes + 1, userVoted: true } 
              : song
          ).sort((a, b) => b.votes - a.votes)
        );

        toast("Your vote has been counted!");
        return true;
      } else {
        toast(voteResponse?.message || "Failed to vote");
        return false;
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast("Failed to vote. Please try again.");
      return false;
    } finally {
      setSubmitting(null);
    }
  };

  return {
    songs,
    loading,
    error,
    submitting,
    vote,
    refetch: fetchSetlistSongs
  };
}
