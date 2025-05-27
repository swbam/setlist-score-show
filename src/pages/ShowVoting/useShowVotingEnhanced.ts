
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateSetlistWithSongs } from "@/services/setlistCreation";
import { useEnhancedVoting } from "@/hooks/useEnhancedVoting";
import { useVoteLimits } from "@/hooks/useVoteLimits";
import { toast } from "@/components/ui/sonner";

interface Show {
  id: string;
  name: string;
  date: string;
  start_time?: string | null;
  status: string;
  view_count: number;
  artist: {
    id: string;
    name: string;
    image_url?: string;
  };
  venue: {
    id: string;
    name: string;
    city: string;
    state?: string | null;
    country: string;
  };
}

interface SetlistSong {
  id: string;
  setlist_id: string;
  song_id: string;
  votes: number;
  position: number;
  song: {
    id: string;
    name: string;
    album: string;
    artist_id: string;
    spotify_url: string;
  };
}

export function useShowVotingEnhanced(user: any) {
  const { showId } = useParams<{ showId: string }>();
  const [show, setShow] = useState<Show | null>(null);
  const [setlist, setSetlist] = useState<SetlistSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setlistId, setSetlistId] = useState<string | null>(null);

  // Use enhanced voting hooks with proper parameters
  const voting = useEnhancedVoting(setlistId, showId || null, user?.id || null);
  const voteLimits = useVoteLimits(showId);

  useEffect(() => {
    const fetchShowAndSetlist = async () => {
      if (!showId) return;
      
      setLoading(true);
      setError(null);

      try {
        // Fetch show data
        const { data: showData, error: showError } = await supabase
          .from('shows')
          .select(`
            *,
            artists!shows_artist_id_fkey(id, name, image_url),
            venues!shows_venue_id_fkey(id, name, city, state, country)
          `)
          .eq('id', showId)
          .single();

        if (showError) {
          console.error("Error fetching show:", showError);
          setError("Failed to load show. Please try again.");
          return;
        }

        if (!showData) {
          setError("Show not found.");
          return;
        }

        // Transform the data to match expected format
        const transformedShow: Show = {
          id: showData.id,
          name: showData.name,
          date: showData.date,
          start_time: showData.start_time,
          status: showData.status,
          view_count: showData.view_count,
          artist: {
            id: showData.artists?.id || '',
            name: showData.artists?.name || 'Unknown Artist',
            image_url: showData.artists?.image_url
          },
          venue: {
            id: showData.venues?.id || '',
            name: showData.venues?.name || 'Unknown Venue',
            city: showData.venues?.city || '',
            state: showData.venues?.state,
            country: showData.venues?.country || ''
          }
        };

        setShow(transformedShow);

        // Increment show views
        await supabase.rpc('increment_show_views', { show_id: showId });

        // Ensure setlist exists for this show with initial songs
        const setlistResult = await getOrCreateSetlistWithSongs(showId);
        
        if (!setlistResult.success || !setlistResult.setlist_id) {
          setError(setlistResult.message || "Failed to create setlist for this show.");
          return;
        }

        const newSetlistId = setlistResult.setlist_id;
        setSetlistId(newSetlistId);

        // Fetch setlist songs
        const { data: setlistData, error: setlistError } = await supabase
          .from('setlist_songs')
          .select(`
            *,
            songs!setlist_songs_song_id_fkey(id, name, album, artist_id, spotify_url)
          `)
          .eq('setlist_id', newSetlistId)
          .order('votes', { ascending: false });

        if (setlistError) {
          console.error("Error fetching setlist:", setlistError);
          setError("Failed to load setlist. Please try again.");
          return;
        }

        if (setlistData) {
          const transformedSetlist: SetlistSong[] = setlistData.map(item => ({
            id: item.id,
            setlist_id: item.setlist_id,
            song_id: item.song_id,
            votes: item.votes,
            position: item.position,
            song: {
              id: item.songs?.id || '',
              name: item.songs?.name || 'Unknown Song',
              album: item.songs?.album || '',
              artist_id: item.songs?.artist_id || showData.artist_id,
              spotify_url: item.songs?.spotify_url || ''
            }
          }));
          
          setSetlist(transformedSetlist);

          // Let the voting hook manage its own vote counts
          // This ensures real-time updates work correctly
        }

      } catch (err) {
        console.error("Error fetching data:", err);
        setError("An unexpected error occurred. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchShowAndSetlist();
  }, [showId]);

  // Enhanced vote handler
  const handleVote = async (setlistSongId: string) => {
    if (!user) {
      toast.error("Please log in to vote");
      return false;
    }

    if (!voteLimits.canVote) {
      toast.error(voteLimits.reason || "Cannot vote at this time");
      return false;
    }

    const success = await voting.vote(setlistSongId);
    
    if (success) {
      // Update local setlist state
      setSetlist(prev => prev.map(song =>
        song.id === setlistSongId
          ? { ...song, votes: voting.getVoteCount(setlistSongId) }
          : song
      ).sort((a, b) => b.votes - a.votes));
      
      // Refresh vote limits
      voteLimits.refreshLimits();
    }

    return success;
  };

  return {
    show,
    setlist: setlist.sort((a, b) => b.votes - a.votes),
    loading,
    error,
    handleVote,
    userVotes: voting.userVotes,
    submitting: voting.isVoteSubmitting,
    canVote: voteLimits.canVote,
    voteLimits,
    refreshVotes: voting.refreshUserData
  };
}
