
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from "@/context/AuthContext";
import { useRealtimeVotes } from '@/hooks/useRealtimeVotes';
import { votingService } from '@/services/voting';
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import MobileBottomNav from "@/components/MobileBottomNav";
import { VotingSection } from "@/components/voting/VotingSection";
import { LiveActivityIndicator } from "@/components/voting/LiveActivityIndicator";
import ShowHeader from "./ShowHeader";
import Sidebar from "./Sidebar";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Music } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from '@/components/ui/sonner';
import { validateConfig } from "@/services/config";

const ShowVotingEnhanced = () => {
  const { showId } = useParams<{ showId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const { 
    latestUpdate, 
    activeUsers, 
    isConnected,
    voteUpdates
  } = useRealtimeVotes(showId || '');

  const [voteLimits, setVoteLimits] = useState({
    showVotesUsed: 0,
    showVotesRemaining: 10,
    dailyVotesUsed: 0,
    dailyVotesRemaining: 50
  });

  // Validate configuration on component mount
  useEffect(() => {
    validateConfig();
  }, []);

  // Fetch show data with songs
  const { data: show, isLoading: showLoading } = useQuery({
    queryKey: ['show', showId],
    queryFn: async () => {
      if (!showId) return null;
      
      const { data, error } = await supabase
        .from('shows')
        .select(`
          *,
          artists(*),
          venues(*),
          setlists(
            *,
            setlist_songs(
              *,
              song:songs(*)
            )
          )
        `)
        .eq('id', showId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!showId
  });

  // Fetch user vote status
  const { data: userVotes, refetch: refetchUserVotes } = useQuery({
    queryKey: ['userVotes', showId, user?.id],
    queryFn: async () => {
      if (!user || !showId) return { votedSongs: [], counts: { dailyVotes: 0, showVotes: 0 } };
      
      const [votedSongs, counts] = await Promise.all([
        votingService.getUserVotesForShow(user.id, showId),
        votingService.getVoteCounts(user.id, showId)
      ]);
      
      return { votedSongs, counts };
    },
    enabled: !!user && !!showId
  });

  // Update vote limits
  useEffect(() => {
    if (userVotes?.counts) {
      setVoteLimits({
        showVotesUsed: userVotes.counts.showVotes,
        showVotesRemaining: Math.max(0, 10 - userVotes.counts.showVotes),
        dailyVotesUsed: userVotes.counts.dailyVotes,
        dailyVotesRemaining: Math.max(0, 50 - userVotes.counts.dailyVotes)
      });
    }
  }, [userVotes]);

  // Handle vote updates from realtime
  useEffect(() => {
    if (latestUpdate) {
      // Update the query cache with new vote count
      queryClient.setQueryData(['show', showId], (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          setlists: oldData.setlists.map((setlist: any) => ({
            ...setlist,
            setlist_songs: setlist.setlist_songs.map((ss: any) => 
              ss.id === latestUpdate.setlistSongId
                ? { ...ss, votes: latestUpdate.newVoteCount }
                : ss
            )
          }))
        };
      });
      
      // Show toast for vote updates
      if (latestUpdate.songTitle) {
        toast.success(`"${latestUpdate.songTitle}" received a vote!`, {
          duration: 2000,
        });
      }
    }
  }, [latestUpdate, queryClient, showId]);

  // Handle voting
  const handleVote = async (songId: string, setlistSongId: string) => {
    if (!user || !showId) {
      toast.error('Please log in to vote');
      return;
    }

    const result = await votingService.castVote({
      userId: user.id,
      showId: showId,
      songId: songId,
      setlistSongId: setlistSongId
    });

    if (result.success) {
      // Refetch user votes to update limits
      refetchUserVotes();
      
      // Update vote limits
      if (result.dailyVotesRemaining !== undefined && result.showVotesRemaining !== undefined) {
        setVoteLimits({
          showVotesUsed: 10 - result.showVotesRemaining,
          showVotesRemaining: result.showVotesRemaining,
          dailyVotesUsed: 50 - result.dailyVotesRemaining,
          dailyVotesRemaining: result.dailyVotesRemaining
        });
      }
    }
  };

  if (showLoading) {
    return (
      <div className="min-h-screen bg-background">
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

  if (!show) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto max-w-7xl px-4 pt-20 pb-32 md:pb-12">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold text-white mb-4">Show Not Found</h1>
            <button 
              onClick={() => window.history.back()} 
              className="gradient-button px-6 py-3 rounded-lg font-medium text-white"
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
  const enhancedSetlist = (show.setlists?.[0]?.setlist_songs || []).map((song: any) => ({
    ...song,
    votes: voteUpdates[song.id] || song.votes || 0,
    hasVoted: userVotes?.votedSongs.includes(song.id) || false,
    canVote: user && voteLimits.showVotesRemaining > 0 && !userVotes?.votedSongs.includes(song.id)
  }));

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      {/* Show Header */}
      <ShowHeader show={show} />

      {/* Vote Status Bar */}
      {user && (
        <div className="bg-gray-900/50 border-b border-gray-800">
          <div className="container mx-auto max-w-7xl px-4 py-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Show Votes:</span>
                  <Badge 
                    variant={voteLimits.showVotesRemaining > 0 ? "default" : "secondary"}
                    className={voteLimits.showVotesRemaining > 0 
                      ? "bg-gradient-to-r from-teal-500 to-cyan-500" 
                      : ""
                    }
                  >
                    {voteLimits.showVotesUsed} / 10
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Daily Votes:</span>
                  <Badge 
                    variant={voteLimits.dailyVotesRemaining > 0 ? "default" : "secondary"}
                    className={voteLimits.dailyVotesRemaining > 0 
                      ? "bg-gradient-to-r from-teal-500 to-cyan-500" 
                      : ""
                    }
                  >
                    {voteLimits.dailyVotesUsed} / 50
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Music className="w-4 h-4 text-teal-500" />
                <span className="text-gray-400">
                  {activeUsers} {activeUsers === 1 ? 'person' : 'people'} voting now
                </span>
              </div>
            </div>
            {voteLimits.showVotesRemaining === 0 && (
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
            <VotingSection
              songs={enhancedSetlist}
              onVote={handleVote}
              isLoading={false}
              showId={showId || ''}
              voteLimits={voteLimits}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Sidebar 
              show={show} 
              totalVotes={enhancedSetlist.reduce((sum: number, s: any) => sum + s.votes, 0)}
              totalSongs={enhancedSetlist.length}
            />
          </div>
        </div>
      </div>

      {/* Live Activity Indicator */}
      <LiveActivityIndicator showId={showId || ''} isConnected={isConnected} />

      <MobileBottomNav />
    </div>
  );
};

export default ShowVotingEnhanced;
