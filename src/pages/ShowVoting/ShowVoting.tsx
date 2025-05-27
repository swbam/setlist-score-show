
import { useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEnhancedVoting } from "@/hooks/useEnhancedVoting";
import AppHeader from "@/components/AppHeader";
import MobileBottomNav from "@/components/MobileBottomNav";
import ShowHeader from "./ShowHeader";
import VotingSection from "./VotingSection";
import { EnhancedVotingSection } from "@/components/EnhancedVotingSection";
import Sidebar from "./Sidebar";
import { useShowVotingEnhanced } from "./useShowVotingEnhanced";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff } from "lucide-react";

const ShowVoting = () => {
  const { showId } = useParams<{ showId: string }>();
  const { user } = useAuth();
  const {
    show,
    setlist,
    loading,
    error: votingError,
    handleVote
  } = useShowVotingEnhanced(showId);

  // Enhanced voting with real-time updates and validation
  const enhancedVoting = useEnhancedVoting(
    setlist.length > 0 ? setlist[0]?.setlist_id : null,
    showId || null,
    user?.id || null
  );

  if (loading) {
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

  // Calculate total votes for sidebar
  const totalVotes = setlist.reduce((sum, song) => sum + song.votes, 0);
  const totalSongs = setlist.length;

  return (
    <div className="min-h-screen bg-black">
      <AppHeader />
      
      {/* Show Header */}
      <ShowHeader show={show} />

      {/* Real-time Connection Status */}
      <div className="container mx-auto max-w-7xl px-4 pt-4">
        <div className="flex items-center justify-between mb-4">
          <Badge variant={enhancedVoting.isConnected ? "default" : "destructive"} className="flex items-center gap-2">
            {enhancedVoting.isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {enhancedVoting.isConnected ? "Live Updates" : "Disconnected"}
          </Badge>
          
          {user && (
            <div className="flex gap-2 text-sm text-gray-400">
              <span>Daily: {enhancedVoting.voteStats.dailyVotesRemaining}/50</span>
              <span>Show: {enhancedVoting.voteStats.showVotesRemaining}/10</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto max-w-7xl px-4 py-4 pb-32 md:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Voting Section */}
          <div className="lg:col-span-2">
            <EnhancedVotingSection
              songs={setlist}
              setlistId={setlist.length > 0 ? setlist[0]?.setlist_id || '' : ''}
              showId={showId || ''}
              artistId={show?.artist?.id}
              onSongAdded={() => window.location.reload()}
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

export default ShowVoting;
