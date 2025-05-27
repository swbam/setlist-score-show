
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
  userVoted?: boolean;
  song: {
    id: string;
    name: string;
    album: string;
    artist_id: string;
    spotify_url: string;
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
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const maxFreeVotes = 10;
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

        // Ensure setlist exists for this show
        const setlistId = await ensureSetlistExists(showId);
        
        if (!setlistId) {
          setVotingError("Failed to create setlist for this show.");
          return;
        }

        // Fetch setlist songs with proper song data including artist_id
        const { data: setlistData, error: setlistError } = await supabase
          .from('setlist_songs')
          .select(`
            *,
            songs!setlist_songs_song_id_fkey(id, name, album, artist_id, spotify_url)
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
            setlist_id: item.setlist_id,
            song_id: item.song_id,
            votes: item.votes,
            position: item.position,
            userVoted: false,
            song: {
              id: item.songs?.id || '',
              name: item.songs?.name || 'Unknown Song',
              album: item.songs?.album || '',
              artist_id: item.songs?.artist_id || showData.artist_id,
              spotify_url: item.songs?.spotify_url || ''
            }
          }));
          
          setSetlist(transformedSetlist);
        }

        // Fetch user's vote data if logged in
        if (user) {
          const { data: userVoteData } = await supabase
            .from('votes')
            .select('setlist_song_id')
            .eq('user_id', user.id);
          
          if (userVoteData) {
            const userVoteSet = new Set(userVoteData.map(vote => vote.setlist_song_id));
            setUserVotes(userVoteSet);
            setUsedVotesCount(userVoteData.length);
            
            // Update setlist with user vote status
            setSetlist(prev => prev.map(song => ({
              ...song,
              userVoted: userVoteSet.has(song.id)
            })));
          }
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

  // Set up real-time subscription for vote updates
  useEffect(() => {
    if (!show || !setlist.length) return;

    const setlistIds = [...new Set(setlist.map(song => song.setlist_id))];
    
    const channel = supabase
      .channel(`setlist-voting-${showId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'setlist_songs',
          filter: `setlist_id=in.(${setlistIds.join(',')})`
        },
        (payload) => {
          setSetlist(prev => prev.map(song =>
            song.id === payload.new.id
              ? { ...song, votes: payload.new.votes, position: payload.new.position }
              : song
          ).sort((a, b) => b.votes - a.votes));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'votes'
        },
        (payload) => {
          if (payload.new.user_id === user?.id) {
            setUserVotes(prev => new Set([...prev, payload.new.setlist_song_id]));
            setSetlist(prev => prev.map(song =>
              song.id === payload.new.setlist_song_id
                ? { ...song, userVoted: true }
                : song
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [show, setlist.length, showId, user?.id]);

  const handleVote = async (setlistSongId: string) => {
    if (!user) {
      toast.error("Please log in to vote");
      return;
    }

    if (userVotes.has(setlistSongId)) {
      toast.info("You've already voted for this song");
      return;
    }

    if (usedVotesCount >= maxFreeVotes) {
      toast.error("You've reached your vote limit for this show");
      return;
    }

    setVoteSubmitting(setlistSongId);
    setVotingError(null);

    try {
      // Optimistically update the UI
      setSetlist(prev => prev.map(song =>
        song.id === setlistSongId 
          ? { ...song, votes: song.votes + 1, userVoted: true } 
          : song
      ).sort((a, b) => b.votes - a.votes));
      
      setUserVotes(prev => new Set([...prev, setlistSongId]));
      setUsedVotesCount(prev => prev + 1);

      // Call Supabase RPC function to handle the vote
      const { data, error } = await supabase.rpc('vote_for_song', {
        setlist_song_id: setlistSongId
      });

      if (error) {
        console.error("Error voting:", error);
        
        // Revert the optimistic update on error
        setSetlist(prev => prev.map(song =>
          song.id === setlistSongId 
            ? { ...song, votes: song.votes - 1, userVoted: false } 
            : song
        ).sort((a, b) => b.votes - a.votes));
        
        setUserVotes(prev => {
          const newSet = new Set(prev);
          newSet.delete(setlistSongId);
          return newSet;
        });
        setUsedVotesCount(prev => prev - 1);
        
        if (error.message.includes("Already voted")) {
          toast.info("You already voted for this song");
        } else {
          toast.error("Failed to vote. Please try again.");
        }
      } else {
        toast.success("Vote recorded!");
      }
    } catch (err) {
      console.error("Error voting:", err);
      
      // Revert the optimistic update on error
      setSetlist(prev => prev.map(song =>
        song.id === setlistSongId 
          ? { ...song, votes: song.votes - 1, userVoted: false } 
          : song
      ).sort((a, b) => b.votes - a.votes));
      
      setUserVotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(setlistSongId);
        return newSet;
      });
      setUsedVotesCount(prev => prev - 1);
      
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setVoteSubmitting(null);
    }
  };

  const handleSongAdded = (newSong: any) => {
    // Refresh the setlist when a new song is added
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
