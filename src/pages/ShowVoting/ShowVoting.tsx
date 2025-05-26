
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
              className="bg-yellow-metal-400 hover:bg-yellow-metal-500 text-black px-4 py-2 rounded"
            >
              Go Back
            </button>
          </div>
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <AppHeader />
      
      <div className="container mx-auto max-w-7xl px-4 pt-20 pb-32 md:pb-12">
        <ShowHeader show={show} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <VotingSection
            setlist={setlist}
            show={show}
            loading={loading}
            votingError={votingError}
            voteSubmitting={voteSubmitting}
            handleVote={handleVote}
            handleSongAdded={handleSongAdded}
            usedVotesCount={usedVotesCount}
            maxFreeVotes={maxFreeVotes}
            votesRemaining={votesRemaining}
            user={user}
          />

          <Sidebar setlist={setlist} show={show} />
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default ShowVoting;
