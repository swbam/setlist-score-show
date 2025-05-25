
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ensureSetlistExists } from "@/services/setlistCreation";
import { incrementShowViews } from "@/services/trending";
import { useAuth } from "@/context/AuthContext";
import AppHeader from "@/components/AppHeader";
import ShowHeader from "./ShowHeader";
import VotingSection from "./VotingSection";
import Sidebar from "./Sidebar";
import { Show, SetlistSong } from "./types";
import { toast } from "@/components/ui/sonner";

const ShowVoting = () => {
  const { showId } = useParams<{ showId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [show, setShow] = useState<Show | null>(null);
  const [setlistSongs, setSetlistSongs] = useState<SetlistSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [usedVotesCount, setUsedVotesCount] = useState(0);
  const maxFreeVotes = 5;

  useEffect(() => {
    if (!showId) {
      setError("Show ID is required");
      setLoading(false);
      return;
    }

    fetchShowAndSetlist();
    
    // Increment view count
    incrementShowViews(showId).catch(err => 
      console.error("Failed to increment view count:", err)
    );
  }, [showId]);

  const fetchShowAndSetlist = async () => {
    if (!showId) return;
    
    setLoading(true);
    setError(null);

    try {
      console.log("Fetching show data for ID:", showId);
      
      // Fetch show data with proper joins
      const { data: showData, error: showError } = await supabase
        .from('shows')
        .select(`
          *,
          artists!shows_artist_id_fkey (
            id,
            name,
            image_url
          ),
          venues!shows_venue_id_fkey (
            id,
            name,
            city,
            state,
            country
          )
        `)
        .eq('id', showId)
        .single();

      if (showError) {
        console.error("Error fetching show:", showError);
        setError("Show not found or failed to load");
        return;
      }

      if (!showData) {
        setError("Show not found");
        return;
      }

      // Transform show data to match expected format
      const transformedShow: Show = {
        id: showData.id,
        name: showData.name || `${showData.artists?.name} Concert`,
        date: showData.date,
        start_time: showData.start_time,
        status: showData.status,
        ticketmaster_url: showData.ticketmaster_url,
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

      // Ensure setlist exists and get setlist ID
      console.log("Ensuring setlist exists for show:", showId);
      const setlistId = await ensureSetlistExists(showId);
      
      if (!setlistId) {
        setError("Failed to create or find setlist for this show");
        return;
      }

      console.log("Fetching setlist songs for setlist ID:", setlistId);
      
      // Fetch setlist songs with explicit relationship name
      const { data: setlistData, error: setlistError } = await supabase
        .from('setlist_songs')
        .select(`
          *,
          songs!setlist_songs_song_id_fkey (
            id,
            name,
            album,
            spotify_url
          )
        `)
        .eq('setlist_id', setlistId)
        .order('votes', { ascending: false });

      if (setlistError) {
        console.error("Error fetching setlist:", setlistError);
        setError("Failed to load setlist songs");
        return;
      }

      if (setlistData && setlistData.length > 0) {
        const transformedSetlist: SetlistSong[] = setlistData.map(item => ({
          id: item.id,
          setlist_id: item.setlist_id,
          song_id: item.song_id,
          votes: item.votes,
          position: item.position,
          userVoted: false, // Will be updated when we check user votes
          song: {
            id: item.songs?.id || '',
            name: item.songs?.name || 'Unknown Song',
            artist_id: transformedShow.artist.id,
            album: item.songs?.album || '',
            spotify_url: item.songs?.spotify_url || ''
          }
        }));
        
        setSetlistSongs(transformedSetlist);
      } else {
        setSetlistSongs([]);
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
      console.error("Error in fetchShowAndSetlist:", err);
      setError("An unexpected error occurred while loading the show");
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (setlistSongId: string) => {
    if (!user) {
      toast.error("Please log in to vote");
      return;
    }

    if (usedVotesCount >= maxFreeVotes) {
      toast.error("You've reached your vote limit");
      return;
    }

    setSubmitting(setlistSongId);

    try {
      // Optimistically update UI
      setSetlistSongs(prev => prev.map(song =>
        song.id === setlistSongId ? { ...song, votes: song.votes + 1, userVoted: true } : song
      ));
      setUsedVotesCount(prev => prev + 1);

      // Call vote function
      const { error } = await supabase.rpc('vote_for_song', {
        setlist_song_id: setlistSongId
      });

      if (error) {
        console.error("Error voting:", error);
        
        // Revert optimistic update
        setSetlistSongs(prev => prev.map(song =>
          song.id === setlistSongId ? { ...song, votes: song.votes - 1, userVoted: false } : song
        ));
        setUsedVotesCount(prev => prev - 1);
        
        toast.error("Failed to vote. Please try again.");
      } else {
        toast.success("Vote recorded!");
      }
    } catch (err) {
      console.error("Error voting:", err);
      
      // Revert optimistic update
      setSetlistSongs(prev => prev.map(song =>
        song.id === setlistSongId ? { ...song, votes: song.votes - 1, userVoted: false } : song
      ));
      setUsedVotesCount(prev => prev - 1);
      
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(null);
    }
  };

  const handleSongAdded = () => {
    // Refresh the setlist when a new song is added
    fetchShowAndSetlist();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <AppHeader />
        <div className="container mx-auto max-w-7xl px-4 pt-20 pb-16">
          <div className="animate-pulse space-y-6">
            <div className="h-64 bg-gray-800 rounded-lg" />
            <div className="h-96 bg-gray-800 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !show) {
    return (
      <div className="min-h-screen bg-black">
        <AppHeader />
        <div className="container mx-auto max-w-7xl px-4 pt-20 pb-16">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold text-white mb-4">
              {error || "Show Not Found"}
            </h1>
            <p className="text-gray-400 mb-6">
              {error || "The show you're looking for doesn't exist."}
            </p>
            <button 
              onClick={() => navigate('/')}
              className="bg-yellow-metal-400 hover:bg-yellow-metal-500 text-black px-6 py-2 rounded-lg font-medium"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <AppHeader />
      
      <ShowHeader show={show} />

      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Voting Section */}
          <div className="lg:col-span-2">
            <VotingSection
              songs={setlistSongs}
              onVote={handleVote}
              submitting={submitting}
              onAddSong={handleSongAdded}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Sidebar 
              show={show} 
              totalVotes={setlistSongs.reduce((sum, song) => sum + song.votes, 0)}
              totalSongs={setlistSongs.length}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowVoting;
