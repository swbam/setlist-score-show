
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ensureSetlistExists } from "@/services/setlistCreation";
import { toast } from "@/components/ui/sonner";

interface Show {
  id: string;
  name: string;
  date: string;
  start_time?: string | null;
  status: string;
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
  song_id: string;
  votes: number;
  position: number;
  song: {
    id: string;
    name: string;
    album: string;
    spotify_url?: string;
  };
}

const useShowVoting = (user: any) => {
  const { showId } = useParams<{ showId: string }>();
  const [show, setShow] = useState<Show | null>(null);
  const [setlist, setSetlist] = useState<SetlistSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingError, setVotingError] = useState<string | null>(null);
  const [voteSubmitting, setVoteSubmitting] = useState<string | null>(null);
  const [usedVotesCount, setUsedVotesCount] = useState(0);
  const maxFreeVotes = 5;
  const votesRemaining = maxFreeVotes - usedVotesCount;

  useEffect(() => {
    const fetchShowAndSetlist = async () => {
      if (!showId) return;
      
      setLoading(true);
      setVotingError(null);

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
          setVotingError("Failed to load show. Please try again.");
          return;
        }

        if (!showData) {
          setVotingError("Show not found.");
          return;
        }

        // Transform the data to match expected format
        const transformedShow: Show = {
          id: showData.id,
          name: showData.name,
          date: showData.date,
          start_time: showData.start_time,
          status: showData.status,
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

        // Ensure setlist exists for this show
        const setlistId = await ensureSetlistExists(showId);
        
        if (!setlistId) {
          setVotingError("Failed to create setlist for this show.");
          return;
        }

        // Fetch setlist songs - fix the UUID validation issue
        const { data: setlistData, error: setlistError } = await supabase
          .from('setlist_songs')
          .select(`
            *,
            songs!setlist_songs_song_id_fkey(id, name, album, spotify_url)
          `)
          .eq('setlist_id', setlistId)
          .order('votes', { ascending: false });

        if (setlistError) {
          console.error("Error fetching setlist:", setlistError);
          setVotingError("Failed to load setlist. Please try again.");
          return;
        }

        if (setlistData) {
          const transformedSetlist: SetlistSong[] = setlistData.map(item => ({
            id: item.id,
            song_id: item.song_id,
            votes: item.votes,
            position: item.position,
            song: {
              id: item.songs?.id || '',
              name: item.songs?.name || 'Unknown Song',
              album: item.songs?.album || '',
              spotify_url: item.songs?.spotify_url
            }
          }));
          
          setSetlist(transformedSetlist);
        }

        // Fetch user's vote count if logged in
        if (user) {
          const { data: userVotes } = await supabase
            .from('votes')
            .select('id')
            .eq('user_id', user.id);
          
          setUsedVotesCount(userVotes?.length || 0);
        }

      } catch (err) {
        console.error("Error fetching data:", err);
        setVotingError("An unexpected error occurred. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchShowAndSetlist();
  }, [showId, user]);

  const handleVote = async (setlistSongId: string) => {
    if (!user) {
      toast.error("Please log in to vote");
      return;
    }

    if (usedVotesCount >= maxFreeVotes) {
      toast.error("You've reached your vote limit");
      return;
    }

    setVoteSubmitting(setlistSongId);
    setVotingError(null);

    try {
      // Optimistically update the UI
      setSetlist(prev => prev.map(song =>
        song.id === setlistSongId ? { ...song, votes: song.votes + 1 } : song
      ));
      setUsedVotesCount(prev => prev + 1);

      // Call Supabase RPC function to handle the vote
      const { error } = await supabase.rpc('vote_for_song', {
        setlist_song_id: setlistSongId
      });

      if (error) {
        console.error("Error voting:", error);
        setVotingError("Failed to vote. Please try again.");
        
        // Revert the optimistic update on error
        setSetlist(prev => prev.map(song =>
          song.id === setlistSongId ? { ...song, votes: song.votes - 1 } : song
        ));
        setUsedVotesCount(prev => prev - 1);
        
        toast.error("Failed to vote. Please try again.");
      } else {
        toast.success("Vote recorded!");
      }
    } catch (err) {
      console.error("Error voting:", err);
      setVotingError("An unexpected error occurred. Please try again.");
      
      // Revert the optimistic update on error
      setSetlist(prev => prev.map(song =>
        song.id === setlistSongId ? { ...song, votes: song.votes - 1 } : song
      ));
      setUsedVotesCount(prev => prev - 1);
      
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setVoteSubmitting(null);
    }
  };

  const handleSongAdded = (newSong: any) => {
    // This would be called when a user adds a new song to the setlist
    // For now, we'll just refresh the setlist
    window.location.reload();
  };

  return {
    show,
    setlist,
    loading,
    votingError,
    voteSubmitting,
    usedVotesCount,
    maxFreeVotes,
    votesRemaining,
    handleVote,
    handleSongAdded
  };
};

export default useShowVoting;
