
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AppHeader from "@/components/AppHeader";
import { VotingSection } from "./VotingSection";
import ShowHeader from "./ShowHeader";
import Sidebar from "./Sidebar";
import { ShowData, SetlistSong } from "./types";
import { useShowVoting } from "./useShowVoting";
import { useRealtimeVotes } from "@/hooks/useRealtimeVotes";

const ShowVoting = () => {
  const { showId } = useParams<{ showId: string }>();
  const {
    showData,
    setlistSongs,
    setSetlistSongs,
    loading,
    setlistId,
    handleVote,
    refetch
  } = useShowVoting(showId);

  // Subscribe to real-time vote updates
  const voteUpdates = useRealtimeVotes(setlistId);

  // Apply real-time updates to local state
  useEffect(() => {
    if (voteUpdates.length > 0) {
      setSetlistSongs(prev => 
        prev.map(song => {
          const update = voteUpdates.find(v => v.id === song.id);
          return update ? { ...song, votes: update.votes } : song;
        }).sort((a, b) => b.votes - a.votes) // Re-sort by votes
      );
    }
  }, [voteUpdates, setSetlistSongs]);

  const handleVoteWithOptimism = async (setlistSongId: string) => {
    try {
      // Optimistic update
      setSetlistSongs(prev => 
        prev.map(song => 
          song.id === setlistSongId 
            ? { ...song, votes: song.votes + 1 }
            : song
        ).sort((a, b) => b.votes - a.votes)
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
          ).sort((a, b) => b.votes - a.votes)
        );
        
        if (error.message.includes('Already voted')) {
          toast.error("You've already voted for this song!");
        } else {
          toast.error("Failed to vote. Please try again.");
        }
        return;
      }

      // Check if response indicates success
      if (data && typeof data === 'object' && 'success' in data && data.success) {
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
        ).sort((a, b) => b.votes - a.votes)
      );
      toast.error("Failed to vote. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading show details...</p>
        </div>
      </div>
    );
  }

  if (!showData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Show Not Found</h2>
          <p className="text-gray-600">The show you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const totalVotes = setlistSongs.reduce((sum, song) => sum + song.votes, 0);
  const totalSongs = setlistSongs.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ShowHeader 
          show={showData}
          artist={showData.artist}
          venue={showData.venue}
        />
        
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main voting section */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Fan Setlist</h2>
                <p className="text-sm text-gray-500">
                  {totalSongs} songs • {totalVotes} votes
                </p>
              </div>
              
              <VotingSection
                setlistSongs={setlistSongs}
                onVote={handleVoteWithOptimism}
                loading={loading}
              />
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Sidebar 
              show={showData}
              totalVotes={totalVotes}
              totalSongs={totalSongs}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowVoting;
