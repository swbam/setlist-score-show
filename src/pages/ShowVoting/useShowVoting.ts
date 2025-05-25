
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ShowData, SetlistSong } from './types';
import { ensureSetlistExists } from '@/services/setlistCreation';

export const useShowVoting = (showId: string | undefined) => {
  const [showData, setShowData] = useState<ShowData | null>(null);
  const [setlistSongs, setSetlistSongs] = useState<SetlistSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [setlistId, setSetlistId] = useState<string>("");

  useEffect(() => {
    if (showId) {
      fetchShowData();
    }
  }, [showId]);

  const fetchShowData = async () => {
    if (!showId) return;

    try {
      setLoading(true);

      // Fetch show details
      const { data: show, error: showError } = await supabase
        .from('shows')
        .select(`
          *,
          artist:artists(id, name, image_url),
          venue:venues(id, name, city, state, country)
        `)
        .eq('id', showId)
        .single();

      if (showError) {
        console.error('Error fetching show:', showError);
        toast.error('Failed to load show data');
        return;
      }

      if (!show) {
        toast.error('Show not found');
        return;
      }

      setShowData(show);

      // Ensure setlist exists (create if needed)
      const setlistIdResult = await ensureSetlistExists(showId);
      
      if (!setlistIdResult) {
        toast.error('Failed to create setlist for this show');
        return;
      }

      setSetlistId(setlistIdResult);

      // Fetch setlist songs
      await fetchSetlistSongs(setlistIdResult);

      // Increment view count
      await supabase
        .from('shows')
        .update({ view_count: (show.view_count || 0) + 1 })
        .eq('id', showId);

    } catch (error) {
      console.error('Error fetching show data:', error);
      toast.error('Failed to load show data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSetlistSongs = async (setlistId: string) => {
    try {
      const { data: songs, error } = await supabase
        .from('setlist_songs')
        .select(`
          *,
          song:songs(id, name, artist_id, album, spotify_url)
        `)
        .eq('setlist_id', setlistId)
        .order('votes', { ascending: false });

      if (error) {
        console.error('Error fetching setlist songs:', error);
        toast.error('Failed to load setlist');
        return;
      }

      setSetlistSongs(songs || []);
    } catch (error) {
      console.error('Error fetching setlist songs:', error);
      toast.error('Failed to load setlist');
    }
  };

  const handleVote = async (setlistSongId: string) => {
    try {
      // Optimistic update
      setSetlistSongs(prev => 
        prev.map(song => 
          song.id === setlistSongId 
            ? { ...song, votes: song.votes + 1 }
            : song
        )
      );

      const { data, error } = await supabase.rpc('vote_for_song', {
        setlist_song_id: setlistSongId
      });

      if (error) {
        // Revert optimistic update on error
        setSetlistSongs(prev => 
          prev.map(song => 
            song.id === setlistSongId 
              ? { ...song, votes: song.votes - 1 }
              : song
          )
        );
        
        if (error.message.includes('Already voted')) {
          toast.error("You've already voted for this song!");
        } else {
          toast.error("Failed to vote. Please try again.");
        }
        return;
      }

      if (data?.success) {
        toast.success("Vote recorded!");
      }
    } catch (error) {
      console.error('Error voting:', error);
      // Revert optimistic update on error
      setSetlistSongs(prev => 
        prev.map(song => 
          song.id === setlistSongId 
            ? { ...song, votes: song.votes - 1 }
            : song
        )
      );
      toast.error("Failed to vote. Please try again.");
    }
  };

  return {
    showData,
    setlistSongs,
    setSetlistSongs,
    loading,
    setlistId,
    handleVote,
    refetch: fetchShowData
  };
};
