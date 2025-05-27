
import { useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import AppHeader from "@/components/AppHeader";
import MobileBottomNav from "@/components/MobileBottomNav";
import ShowHeader from "./ShowHeader";
import Sidebar from "./Sidebar";
import VotingInterface from "@/components/VotingInterface";
import { useShowVotingEnhanced } from "./useShowVotingEnhanced";
import { Loader2 } from "lucide-react";

const ShowVotingEnhanced = () => {
  const { showId } = useParams<{ showId: string }>();
  const { user } = useAuth();
  const {
    show,
    setlist,
    loading,
    error,
    handleVote,
    userVotes,
    submitting,
    canVote,
    voteLimits
  } = useShowVotingEnhanced(user);

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <AppHeader />
        <div className="container mx-auto max-w-7xl px-4 pt-20 pb-32 md:pb-12">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2 text-white">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-lg">Loading show...</span>
            </div>
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
              {error || "Show Not Found"}
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

  // Calculate total votes for sidebar
  const totalVotes = setlist.reduce((sum, song) => sum + song.votes, 0);
  const totalSongs = setlist.length;

  return (
    <div className="min-h-screen bg-black">
      <AppHeader />
      
      {/* Show Header */}
      <ShowHeader show={show} />

      {/* Main Content */}
      <div className="container mx-auto max-w-7xl px-4 py-8 pb-32 md:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Voting Section */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">
                  Fan Setlist Predictions
                </h2>
                <div className="text-sm text-gray-400">
                  {totalVotes} total votes • {totalSongs} songs
                </div>
              </div>

              <VotingInterface
                songs={setlist}
                onVote={handleVote}
                userVotes={userVotes}
                submitting={submitting}
                canVote={canVote}
                voteLimitMessage={!voteLimits.canVote ? voteLimits.reason : undefined}
              />
            </div>
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

export default ShowVotingEnhanced;
