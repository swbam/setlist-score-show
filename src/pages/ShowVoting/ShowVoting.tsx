
import { useAuth } from "@/context/AuthContext";
import AppHeader from "@/components/AppHeader";
import ShowHeader from "./ShowHeader";
import { VotingSection } from "./VotingSection";
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

  // Convert our setlist type to match what VotingSection expects
  const formattedSetlist = setlist ? {
    id: setlist.id,
    show_id: setlist.show_id,
    created_at: setlist.created_at,
    updated_at: setlist.updated_at,
    songs: setlist.songs || []
  } : null;

  return (
    <div className="min-h-screen bg-black">
      <AppHeader />
      
      {/* Show Header with fixed layout */}
      <ShowHeader show={show} />

      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Voting Section - 2 columns on large screens */}
          <div className="lg:col-span-2">
            <VotingSection
              show={show}
              setlist={formattedSetlist}
              onRefresh={handleSongAdded}
              voteSubmitting={voteSubmitting}
              handleVote={handleVote}
              votesRemaining={votesRemaining === 'Unlimited' ? 'Unlimited' : Number(votesRemaining)}
              usedVotesCount={usedVotesCount}
              maxFreeVotes={maxFreeVotes}
              artist={show?.artist || null}
            />
          </div>

          {/* Sidebar - 1 column */}
          <div className="lg:col-span-1">
            <Sidebar setlist={formattedSetlist} show={show} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowVoting;
