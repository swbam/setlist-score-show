
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp } from "lucide-react";
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
      className={`bg-gray-900/40 border-gray-800/50 hover:border-cyan-500/50 transition-all duration-300 ${
        song.userVoted ? 'border-l-4 border-l-cyan-500' : ''
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-2xl font-bold text-gray-400 w-8">
              {index + 1}
            </div>
            <div className="overflow-hidden">
              <h3 className="text-white font-semibold truncate max-w-[200px] sm:max-w-[300px] md:max-w-full">
                {song.song.name}
              </h3>
              <p className="text-gray-400 text-sm truncate max-w-[200px] sm:max-w-[300px] md:max-w-full">
                {song.song.album}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-white font-bold">{song.votes}</div>
              <div className="text-gray-400 text-xs">VOTES</div>
            </div>
            <div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleVote(song.id)}
                disabled={song.userVoted || isDisabled || voteSubmitting === song.id}
                className={`h-10 w-10 rounded-full p-0 
                  ${voteSubmitting === song.id 
                    ? 'animate-pulse bg-gray-800/50 cursor-not-allowed' 
                    : song.userVoted 
                    ? 'text-cyan-400 bg-cyan-400/20' 
                    : isDisabled
                      ? 'text-gray-600 cursor-not-allowed'
                      : 'text-gray-400 hover:text-cyan-400 hover:bg-cyan-400/10'
                  }`}
              >
                {voteSubmitting === song.id ? (
                  <div className="h-4 w-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"/>
                ) : (
                  <ThumbsUp className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SongCard;
