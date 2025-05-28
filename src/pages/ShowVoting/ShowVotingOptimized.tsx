
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useVoteTrackingFixed } from "@/hooks/useVoteTrackingFixed";
import { useRealtimeVotingFixed } from "@/hooks/useRealtimeVotingFixed";
import * as setlistManager from "@/services/setlistManager";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import MobileBottomNav from "@/components/MobileBottomNav";
import ShowHeader from "./ShowHeader";
import VotingSectionEnhanced from "./VotingSectionEnhanced";
import Sidebar from "./Sidebar";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Wifi, WifiOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ShowVotingOptimized = () => {
  const { showId } = useParams<{ showId: string }>();
  const { user } = useAuth();
  
  const [show, setShow] = useState<any>(null);
  const [setlist, setSetlist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fixed hooks
  const {
    voteStatus,
    isLoading: voteStatusLoading,
    voteForSong,
    hasVotedForSong,
    canVote
  } = useVoteTrackingFixed(showId || '');

  const {
    voteCounts,
    isConnected,
    getVoteCount,
    optimisticVoteUpdate,
    revertVoteUpdate
  } = useRealtimeVotingFixed(setlist?.id || null);

  // Load show and setlist data
  useEffect(() => {
    const loadShowData = async () => {
      if (!showId) return;

      try {
        setLoading(true);
        setError(null);

        console.log(`[Show Voting] Loading show: ${showId}`);

        // Get show details
        const { data: showData, error: showError } = await supabase
          .from('shows')
          .select(`
            *,
            artists(id, name, image_url),
            venues(id, name, city, state, country)
          `)
          .eq('id', showId)
          .single();

        if (showError || !showData) {
          throw new Error('Show not found');
        }

        setShow(showData);
        console.log(`[Show Voting] Show loaded:`, showData.name);

        // Get or create setlist with songs
        const setlistResult = await setlistManager.getOrCreateSetlistWithSongs(showId);
        
        if (!setlistResult.success) {
          throw new Error(setlistResult.error || 'Failed to load setlist');
        }

        // Get full setlist data
        const setlistData = await setlistManager.getSetlistWithSongs(showId);
        
        if (setlistData) {
          setSetlist(setlistData);
          console.log(`[Show Voting] Setlist loaded with ${setlistData.setlist_songs?.length || 0} songs`);
        }

      } catch (error) {
        console.error(`[Show Voting] Error loading show data:`, error);
        setError(error instanceof Error ? error.message : 'Failed to load show');
      } finally {
        setLoading(false);
      }
    };

    loadShowData();
  }, [showId]);

  // Enhanced vote handler
  const handleVote = async (songId: string, setlistSongId: string) => {
    if (!canVote()) {
      console.warn(`[Show Voting] Vote blocked: user cannot vote`);
      return;
    }

    try {
      console.log(`[Show Voting] Voting for song: ${songId}`);

      // Optimistic update
      optimisticVoteUpdate(setlistSongId);

      // Attempt to vote
      const success = await voteForSong(setlistSongId);

      if (!success) {
        // Revert if failed
        revertVoteUpdate(setlistSongId);
        console.error(`[Show Voting] Vote failed, reverted optimistic update`);
      } else {
        console.log(`[Show Voting] ✅ Vote successful for song: ${songId}`);
      }
    } catch (error) {
      console.error(`[Show Voting] Error during vote:`, error);
      revertVoteUpdate(setlistSongId);
    }
  };

  if (loading || voteStatusLoading) {
    return (
      <div className="min-h-screen bg-black">
        <AppHeader />
        <div className="container mx-auto max-w-7xl px-4 pt-20 pb-32 md:pb-12">
          <div className="flex items-center justify-center h-64">
            <div className="text-white text-lg">Loading show...</div>
          </div>
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  if (error || !show) {
    return (
      <div className="min-h-screen bg-black">
        <AppHeader />
        <div className="container mx-auto max-w-7xl px-4 pt-20 pb-32 md:pb-12">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold text-white mb-4">
              {error || 'Show Not Found'}
            </h1>
            <button 
              onClick={() => window.history.back()} 
              className="bg-white text-black hover:bg-gray-200 px-4 py-2 rounded font-medium"
            >
              Go Back
            </button>
          </div>
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  // Enhance setlist with real-time vote counts and user vote status
  const enhancedSetlist = (setlist?.setlist_songs || []).map((song: any) => ({
    ...song,
    votes: getVoteCount(song.id),
    hasVoted: hasVotedForSong(song.song_id),
    canVote: canVote() && !hasVotedForSong(song.song_id)
  }));

  // Calculate totals
  const totalVotes = enhancedSetlist.reduce((sum: number, song: any) => sum + song.votes, 0);
  const totalSongs = enhancedSetlist.length;

  return (
    <div className="min-h-screen bg-black">
      <AppHeader />
      
      {/* Show Header */}
      <ShowHeader show={show} />

      {/* Connection and Vote Status Bar */}
      {user && (
        <div className="bg-gray-900 border-b border-gray-800">
          <div className="container mx-auto max-w-7xl px-4 py-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Show Votes:</span>
                  <Badge variant={voteStatus.show_votes_remaining > 0 ? "default" : "secondary"}>
                    {voteStatus.show_votes_used} / 10
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Daily Votes:</span>
                  <Badge variant={voteStatus.daily_votes_remaining > 0 ? "default" : "secondary"}>
                    {voteStatus.daily_votes_used} / 50
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isConnected ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-red-500" />}
                <span className="text-xs text-gray-400">
                  {isConnected ? 'Live Updates Active' : 'Reconnecting...'}
                </span>
              </div>
            </div>
            {voteStatus.show_votes_remaining === 0 && (
              <Alert className="mt-3 bg-yellow-900/20 border-yellow-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You've used all your votes for this show. Come back tomorrow to vote again!
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto max-w-7xl px-4 py-8 pb-32 md:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Voting Section */}
          <div className="lg:col-span-2">
            <VotingSectionEnhanced
              songs={enhancedSetlist}
              onVote={handleVote}
              submitting={false}
              onAddSong={() => {}}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Sidebar 
              show={show} 
              totalVotes={totalVotes}
              totalSongs={totalSongs}
            />
          </div>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default ShowVotingOptimized;
