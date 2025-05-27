
import { useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useVoteTracking } from "@/hooks/useVoteTracking";
import { useRealtimeVotingFixed } from "@/hooks/useRealtimeVotingFixed";
import { ErrorBoundaryFixed } from "@/components/ErrorBoundaryFixed";
import AppHeader from "@/components/AppHeader";
import MobileBottomNav from "@/components/MobileBottomNav";
import ShowHeader from "./ShowHeader";
import VotingSectionEnhanced from "./VotingSectionEnhanced";
import Sidebar from "./Sidebar";
import useShowVoting from "./useShowVoting";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Wifi, WifiOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { validateConfig } from "@/services/config";

const ShowVotingEnhanced = () => {
  const { showId } = useParams<{ showId: string }>();
  const { user } = useAuth();
  
  // Validate configuration on component mount
  React.useEffect(() => {
    validateConfig();
  }, []);

  // Original show voting hook
  const {
    show,
    setlist,
    loading,
    votingError,
    voteSubmitting,
    handleSongAdded
  } = useShowVoting(user);

  // Vote tracking hook
  const {
    voteStatus,
    isLoading: voteStatusLoading,
    voteForSong,
    hasVotedForSong,
    canVote
  } = useVoteTracking(showId || '');

  // Fixed real-time voting hook
  const {
    voteCounts,
    isConnected,
    getVoteCount,
    optimisticVoteUpdate,
    revertVoteUpdate
  } = useRealtimeVotingFixed(setlist?.[0]?.setlist_id || null);

  // Enhanced vote handler with improved error handling
  const handleVote = async (songId: string, setlistSongId: string) => {
    if (!canVote()) {
      console.warn('Vote blocked: user cannot vote');
      return;
    }

    try {
      // Optimistic update
      optimisticVoteUpdate(setlistSongId);

      // Attempt to vote
      const success = await voteForSong(setlistSongId);

      if (!success) {
        // Revert if failed
        revertVoteUpdate(setlistSongId);
        console.error('Vote failed, reverted optimistic update');
      } else {
        console.log('✅ Vote successful for song:', songId);
      }
    } catch (error) {
      console.error('Error during vote:', error);
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

  if (!show) {
    return (
      <div className="min-h-screen bg-black">
        <AppHeader />
        <div className="container mx-auto max-w-7xl px-4 pt-20 pb-32 md:pb-12">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold text-white mb-4">Show Not Found</h1>
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
  const enhancedSetlist = setlist.map(song => ({
    ...song,
    votes: getVoteCount(song.id),
    hasVoted: hasVotedForSong(song.song_id),
    canVote: canVote() && !hasVotedForSong(song.song_id)
  }));

  // Calculate total votes
  const totalVotes = enhancedSetlist.reduce((sum, song) => sum + song.votes, 0);
  const totalSongs = enhancedSetlist.length;

  return (
    <ErrorBoundaryFixed>
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
              {votingError && (
                <Alert className="mt-3 bg-red-900/20 border-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {votingError}
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
                submitting={voteSubmitting}
                onAddSong={() => handleSongAdded({})}
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
    </ErrorBoundaryFixed>
  );
};

export default ShowVotingEnhanced;
