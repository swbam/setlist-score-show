
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp, AlertCircle } from "lucide-react";
import { SetlistSong } from "./types";

interface SongCardProps {
  song: SetlistSong;
  index: number;
  handleVote: (songId: string) => void;
  voteSubmitting: string | null;
  isDisabled: boolean;
}

const SongCard = ({ song, index, handleVote, voteSubmitting, isDisabled }: SongCardProps) => {
  return (
    <Card 
      className={`bg-gray-900/40 border-gray-800/50 transition-all duration-200 ${
        song.userVoted ? 'border-l-4 border-l-yellow-metal-500' : ''
      }`}
    >
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className="text-lg font-bold text-gray-400 w-6 text-center">
            {index + 1}.
          </div>
          <div>
            <h4 className="text-white font-semibold">{song.song?.name}</h4>
            {song.song?.album && (
              <p className="text-sm text-gray-400">{song.song.album}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="text-white font-bold">{song.votes}</div>
            <div className="text-xs text-gray-400">VOTES</div>
          </div>
          
          <Button
            size="sm"
            variant={song.userVoted ? "secondary" : "outline"}
            onClick={() => handleVote(song.id)}
            disabled={song.userVoted || isDisabled || voteSubmitting === song.id}
            className={`
              ${voteSubmitting === song.id ? 'animate-pulse' : ''}
              ${song.userVoted ? 'bg-yellow-metal-800/30 text-yellow-metal-400 cursor-not-allowed' : ''}
              ${isDisabled && !song.userVoted ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {voteSubmitting === song.id ? (
              <div className="h-4 w-4 border-2 border-t-transparent rounded-full animate-spin mr-2" />
            ) : song.userVoted ? (
              <ThumbsUp className="h-4 w-4 mr-2 text-yellow-metal-400" />
            ) : (
              <ThumbsUp className="h-4 w-4 mr-2" />
            )}
            Vote
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SongCard;
