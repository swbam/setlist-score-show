
import { Users, Share, XCircle, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AddSongToSetlist from "@/components/AddSongToSetlist";
import SongCard from "./SongCard";
import { Setlist, SetlistSong, Show } from "./types";

interface VotingSectionProps {
  setlist: Setlist | null;
  show: Show | null;
  loading: boolean;
  votingError: string | null;
  voteSubmitting: string | null;
  handleVote: (songId: string) => void;
  handleSongAdded: () => Promise<void>;
  usedVotesCount: number;
  maxFreeVotes: number;
  votesRemaining: string | number;
  user: any; // Using any since we're not importing the entire auth context
}

const VotingSection = ({
  setlist,
  show,
  loading,
  votingError,
  voteSubmitting,
  handleVote,
  handleSongAdded,
  usedVotesCount,
  maxFreeVotes,
  votesRemaining,
  user
}: VotingSectionProps) => {
  return (
    <div className="lg:col-span-2">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Vote on Setlist</h2>
          <p className="text-gray-400 text-sm">Help shape what will be played at this show</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" className="border-gray-700 text-gray-300 gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden md:inline">Votes:</span> {setlist?.songs?.reduce((total, song) => total + song.votes, 0) || 0}
          </Button>
          <Button variant="outline" className="border-gray-700 text-gray-300 gap-2">
            <Share className="h-4 w-4" />
            <span className="hidden md:inline">Share</span>
          </Button>
        </div>
      </div>

      {votingError && (
        <div className="bg-red-900/20 border border-red-900 text-red-300 p-4 rounded-md mb-6 flex items-start">
          <XCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">{votingError}</p>
            <p className="text-sm opacity-80 mt-1">
              Sign in to vote on setlists. Non-logged in users can vote up to 3 times.
            </p>
          </div>
        </div>
      )}

      {/* Add Song Section */}
      {setlist && show?.artist_id && (
        <Card className="bg-gray-900/40 border-gray-800/50 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Add songs to this setlist:</span>
              <AddSongToSetlist
                setlistId={setlist.id}
                artistId={show.artist_id}
                onSongAdded={handleSongAdded}
              />
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Add your favorite songs to the setlist for everyone to vote on.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Songs List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Card key={i} className="bg-gray-900/40 border-gray-800/50 animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center justify-between h-16">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-gray-800 rounded"></div>
                    <div className="space-y-2">
                      <div className="w-48 h-4 bg-gray-800 rounded"></div>
                      <div className="w-32 h-3 bg-gray-800 rounded"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-800 rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : setlist && setlist.songs && setlist.songs.length > 0 ? (
        <div className="space-y-3">
          {setlist.songs.map((song: SetlistSong, index: number) => (
            <SongCard
              key={song.id}
              song={song}
              index={index}
              handleVote={handleVote}
              voteSubmitting={voteSubmitting}
              isDisabled={usedVotesCount >= maxFreeVotes && !user}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-900/50 border border-gray-800 rounded-lg">
          <Music className="h-12 w-12 text-gray-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300">No songs in setlist yet</h3>
          <p className="text-gray-400 mt-2">Be the first to add a song!</p>
        </div>
      )}

      <div className="text-center text-gray-400 text-sm mt-6">
        You've used {usedVotesCount}/{votesRemaining === 'Unlimited' ? '∞' : maxFreeVotes} {votesRemaining === 'Unlimited' ? '' : 'free'} votes
        {!user && usedVotesCount < maxFreeVotes && (
          <p className="mt-2">Sign in to vote on unlimited songs!</p>
        )}
      </div>
    </div>
  );
};

export default VotingSection;
