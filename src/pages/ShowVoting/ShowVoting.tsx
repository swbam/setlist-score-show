import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Show } from "./types";
import { SetlistSong } from "./types";
import { VotingSection } from "./VotingSection";
import { Sidebar } from "./Sidebar";
import { ShowHeader } from "./ShowHeader";
import AppHeader from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";

interface RouteParams {
  showId: string;
}

const ShowVoting = () => {
  const { showId } = useParams<RouteParams>();
  const [show, setShow] = useState<Show | null>(null);
  const [setlistSongs, setSetlistSongs] = useState<SetlistSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votingLoading, setVotingLoading] = useState(false);

  useEffect(() => {
    const fetchShowAndSetlist = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch show data
        const { data: showData, error: showError } = await supabase
          .from('shows')
          .select(`
            *,
            artist:artists (
              id,
              name,
              image_url
            ),
            venue:venues (
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
          setError("Failed to load show. Please try again.");
          return;
        }

        if (!showData) {
          setError("Show not found.");
          return;
        }

        setShow(showData);

        // Fetch setlist songs
        const { data: setlistData, error: setlistError } = await supabase
          .from('setlist_songs')
          .select(`
            *,
            song:songs (
              id,
              name,
              artist_id,
              album,
              spotify_url
            )
          `)
          .eq('setlist_id', showData.id)
          .order('votes', { ascending: false });

        if (setlistError) {
          console.error("Error fetching setlist:", setlistError);
          setError("Failed to load setlist. Please try again.");
          return;
        }

        if (setlistData) {
          // Add userVoted property
          const updatedSetlistSongs = setlistData.map(song => ({
            ...song,
            userVoted: false // Placeholder, implement actual logic later
          }));
          setSetlistSongs(updatedSetlistSongs);
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

  const handleVote = async (setlistSongId: string) => {
    setVotingLoading(true);
    try {
      // Optimistically update the UI
      const updatedSetlistSongs = setlistSongs.map(song =>
        song.id === setlistSongId ? { ...song, votes: song.votes + 1, userVoted: true } : song
      );
      setSetlistSongs(updatedSetlistSongs);

      // Call Supabase function to handle the vote
      const { error } = await supabase.functions.invoke('vote-for-song', {
        body: { setlistSongId }
      });

      if (error) {
        console.error("Error voting:", error);
        setError("Failed to vote. Please try again.");
        // Revert the optimistic update on error
        const revertedSetlistSongs = setlistSongs.map(song =>
          song.id === setlistSongId ? { ...song, votes: song.votes - 1, userVoted: false } : song
        );
        setSetlistSongs(revertedSetlistSongs);
      }
    } catch (err) {
      console.error("Error voting:", err);
      setError("An unexpected error occurred. Please try again.");
      // Revert the optimistic update on error
      const revertedSetlistSongs = setlistSongs.map(song =>
        song.id === setlistSongId ? { ...song, votes: song.votes - 1, userVoted: false } : song
      );
      setSetlistSongs(revertedSetlistSongs);
    } finally {
      setVotingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-64 bg-gray-800 rounded-lg" />
            <div className="h-96 bg-gray-800 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold mb-4">Error Loading Show</h1>
            <p className="text-gray-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold mb-4">Show Not Found</h1>
            <p className="text-gray-400">The show you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
      <AppHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            <ShowHeader show={show} />
            
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
              <h2 className="text-xl font-bold text-white mb-6">Fan Setlist</h2>
              <VotingSection
                setlistSongs={setlistSongs}
                onVote={handleVote}
                loading={votingLoading}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Sidebar show={show} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowVoting;
