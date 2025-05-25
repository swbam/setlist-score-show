
import { SetlistSong } from "./types";
import SongCard from "./SongCard";

interface VotingSectionProps {
  setlistSongs: SetlistSong[];
  onVote: (setlistSongId: string) => void;
  loading: boolean;
}

export const VotingSection = ({ setlistSongs, onVote, loading }: VotingSectionProps) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (setlistSongs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No songs in setlist yet. The setlist will be created when the first vote is cast.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {setlistSongs.map((setlistSong, index) => (
        <SongCard
          key={setlistSong.id}
          song={setlistSong}
          index={index}
          handleVote={() => onVote(setlistSong.id)}
          voteSubmitting={null}
          isDisabled={false}
        />
      ))}
    </div>
  );
};
