
import { useAuth } from "@/context/AuthContext";
import AppHeader from "@/components/AppHeader";
import ShowHeader from "./ShowHeader";
import VotingSection from "./VotingSection";
import Sidebar from "./Sidebar";
import useShowVoting from "./useShowVoting";

const ShowVoting = () => {
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

  return (
    <div className="min-h-screen bg-black">
      <AppHeader />
      
      {/* Enhanced Show Header */}
      <ShowHeader show={show} />

      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Voting Section */}
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

          {/* Sidebar */}
          <Sidebar setlist={setlist} show={show} />
        </div>
      </div>
    </div>
  );
};

export default ShowVoting;
