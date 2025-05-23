
import { useAuth } from "@/context/AuthContext";
import AppHeader from "@/components/AppHeader";
import ShowHeader from "./ShowHeader";
import { VotingSection } from "./VotingSection";
import Sidebar from "./Sidebar";
import useShowVoting from "./useShowVoting";
import { SpotifyArtist } from "@/services/spotify";

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

  // Format artist data to match SpotifyArtist type
  const artist: SpotifyArtist = show?.artist ? {
    id: show.artist.id,
    name: show.artist.name,
    images: show.artist.image_url ? [{ 
      url: show.artist.image_url,
      height: 640, // Default values
      width: 640
    }] : [],
    popularity: show.artist.popularity || 0,
    genres: show.artist.genres || [],
    external_urls: { spotify: show.artist.spotify_url || '' }
  } : { 
    id: '', 
    name: '', 
    images: [], 
    popularity: 0,
    genres: [],
    external_urls: { spotify: '' }
  };

  return (
    <div className="min-h-screen bg-black">
      <AppHeader />
      
      {/* Enhanced Show Header */}
      <ShowHeader show={show} />

      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Voting Section - 2 columns on large screens */}
          <div className="lg:col-span-2">
            <VotingSection
              setlist={setlist}
              show={show}
              artist={artist}
              onRefresh={handleSongAdded}
              voteSubmitting={voteSubmitting}
              handleVote={handleVote}
              votesRemaining={typeof votesRemaining === 'string' ? votesRemaining : Number(votesRemaining)}
              usedVotesCount={usedVotesCount}
              maxFreeVotes={maxFreeVotes}
            />
          </div>

          {/* Sidebar - 1 column */}
          <div className="lg:col-span-1">
            <Sidebar setlist={setlist} show={show} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowVoting;
