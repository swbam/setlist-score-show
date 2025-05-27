
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateSetlistWithSongs } from "@/services/setlistCreation";
import { toast } from "sonner";

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

  useEffect(() => {
    const fetchShowAndSetlist = async () => {
      if (!showId) {
        setError("No show ID provided");
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);

      try {
        console.log(`🎪 Fetching show data for: ${showId}`);

        // Fetch show data with proper relationship hints
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
          console.error("❌ Error fetching show:", showError);
          setError("Failed to load show. Please try again.");
          return;
        }

        if (!showData) {
          setError("Show not found.");
          return;
        }

        // Transform the data to match expected format
        const artistData = showData.artists as any;
        const venueData = showData.venues as any;

        const transformedShow: Show = {
          id: showData.id,
          name: showData.name || `${artistData?.name || 'Unknown Artist'} Concert`,
          date: showData.date,
          start_time: showData.start_time,
          status: showData.status,
          view_count: showData.view_count || 0,
          artist: {
            id: artistData?.id || '',
            name: artistData?.name || 'Unknown Artist',
            image_url: artistData?.image_url
          },
          venue: {
            id: venueData?.id || '',
            name: venueData?.name || 'Unknown Venue',
            city: venueData?.city || '',
            state: venueData?.state,
            country: venueData?.country || ''
          }
        };

        setShow(transformedShow);

        // Increment show views
        try {
          await supabase.rpc('increment_show_views', { show_id: showId });
          console.log("📈 Incremented show views");
        } catch (viewError) {
          console.warn("⚠️ Failed to increment show views:", viewError);
        }

        // Ensure setlist exists for this show with initial songs
        console.log("🎵 Ensuring setlist exists...");
        const setlistResult = await getOrCreateSetlistWithSongs(showId);
        
        if (!setlistResult.success) {
          setError(setlistResult.message || "Failed to create setlist for this show.");
          return;
        }

        console.log(`✅ Setlist ready: ${setlistResult.setlist_id}`);

        // Fetch setlist songs
        const { data: setlistData, error: setlistError } = await supabase
          .from('setlist_songs')
          .select(`
            *,
            songs!setlist_songs_song_id_fkey(id, name, album, artist_id, spotify_url)
          `)
          .eq('setlist_id', setlistResult.setlist_id)
          .order('votes', { ascending: false });

        if (setlistError) {
          console.error("❌ Error fetching setlist:", setlistError);
          setError("Failed to load setlist. Please try again.");
          return;
        }

        if (setlistData) {
          const transformedSetlist: SetlistSong[] = setlistData.map(item => {
            const songData = item.songs as any;
            
            return {
              id: item.id,
              setlist_id: item.setlist_id,
              song_id: item.song_id,
              votes: item.votes,
              position: item.position,
              song: {
                id: songData?.id || '',
                name: songData?.name || 'Unknown Song',
                album: songData?.album || '',
                artist_id: songData?.artist_id || transformedShow.artist.id,
                spotify_url: songData?.spotify_url || ''
              }
            };
          });
          
          setSetlist(transformedSetlist);
          console.log(`✅ Loaded ${transformedSetlist.length} songs in setlist`);
        }

      } catch (err) {
        console.error("❌ Error fetching data:", err);
        setError("An unexpected error occurred. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchShowAndSetlist();
  }, [showId]);

  // Vote handler
  const handleVote = async (setlistSongId: string) => {
    if (!user) {
      toast.error("Please log in to vote");
      return false;
    }

    try {
      const { data, error } = await supabase
        .rpc('vote_for_song', { setlist_song_id: setlistSongId });

      if (error) {
        console.error("❌ Vote error:", error);
        toast.error(error.message || "Failed to vote");
        return false;
      }

      const result = data as any;
      
      if (!result?.success) {
        toast.error(result?.error || "Vote failed");
        return false;
      }

      // Update local state
      setSetlist(prev => prev.map(song =>
        song.id === setlistSongId
          ? { ...song, votes: result.votes || song.votes + 1 }
          : song
      ).sort((a, b) => b.votes - a.votes));

      toast.success("Vote cast successfully!");
      return true;

    } catch (error) {
      console.error("❌ Error voting:", error);
      toast.error("Failed to cast vote");
      return false;
    }
  };

  return {
    show,
    setlist: setlist.sort((a, b) => b.votes - a.votes),
    loading,
    error,
    handleVote,
    submitting: false
  };
}
