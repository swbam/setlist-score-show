
import { useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import AppHeader from "@/components/AppHeader";
import MobileBottomNav from "@/components/MobileBottomNav";
import ShowHeader from "./ShowHeader";
import VotingSection from "./VotingSection";
import Sidebar from "./Sidebar";
import useShowVoting from "./useShowVoting";

const ShowVoting = () => {
  const { showId } = useParams<{ showId: string }>();
  const { user } = useAuth();
  const {
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
  } = useShowVoting(user);

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

      {/* Main Content */}
      <div className="container mx-auto max-w-7xl px-4 py-8 pb-32 md:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Voting Section */}
          <div className="lg:col-span-2">
            <VotingSection
              songs={setlist}
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
  );
};

export default ShowVoting;
