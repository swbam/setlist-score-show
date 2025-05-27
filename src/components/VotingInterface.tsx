
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronUp, Loader2, Check, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Song {
  id: string;
  name: string;
  album: string;
  spotify_url: string;
}

interface SetlistSong {
  id: string;
  song: Song;
  votes: number;
  position: number;
}

interface VotingInterfaceProps {
  songs: SetlistSong[];
  onVote: (setlistSongId: string) => Promise<boolean>;
  userVotes: Set<string>;
  submitting: Set<string>;
  canVote: (setlistSongId: string) => boolean;
  voteLimitMessage?: string;
}

export default function VotingInterface({
  songs,
  onVote,
  userVotes,
  submitting,
  canVote,
  voteLimitMessage
}: VotingInterfaceProps) {
  const sortedSongs = [...songs].sort((a, b) => b.votes - a.votes);

  const handleVote = async (setlistSongId: string) => {
    if (!canVote(setlistSongId)) return;
    await onVote(setlistSongId);
  };

  return (
    <div className="space-y-4">
      {voteLimitMessage && (
        <Card className="bg-orange-500/10 border-orange-500/20">
          <CardContent className="p-4">
            <p className="text-orange-400 text-sm">{voteLimitMessage}</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {sortedSongs.map((setlistSong, index) => {
          const isSubmitting = submitting.has(setlistSong.id);
          const hasVoted = userVotes.has(setlistSong.id);
          const canVoteForSong = canVote(setlistSong.id);

          return (
            <Card 
              key={setlistSong.id}
              className={cn(
                "bg-gray-900/60 border-gray-800/50 transition-all duration-200 hover:border-gray-700",
                hasVoted && "border-yellow-metal-400/50 bg-yellow-metal-400/5"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  {/* Left side - Song info */}
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    {/* Position */}
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2",
                        index < 3 
                          ? "bg-yellow-metal-400 text-black border-yellow-metal-400" 
                          : "bg-gray-800 text-gray-300 border-gray-600"
                      )}>
                        {index < 3 && <Star className="h-4 w-4" />}
                        {index >= 3 && (index + 1)}
                      </div>
                    </div>

                    {/* Song Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold truncate text-lg">
                        {setlistSong.song.name}
                      </h3>
                      <p className="text-gray-400 text-sm truncate">
                        {setlistSong.song.album}
                      </p>
                    </div>
                  </div>

                  {/* Right side - Votes and button */}
                  <div className="flex items-center space-x-4">
                    {/* Vote Count */}
                    <div className="text-center min-w-[60px]">
                      <div className="text-2xl font-bold text-white">
                        {setlistSong.votes}
                      </div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide">
                        votes
                      </div>
                    </div>

                    {/* Vote Button */}
                    <Button
                      onClick={() => handleVote(setlistSong.id)}
                      disabled={!canVoteForSong || isSubmitting}
                      variant={hasVoted ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "min-w-[80px] h-10 font-semibold transition-all duration-200",
                        hasVoted && "bg-yellow-metal-400 hover:bg-yellow-metal-300 text-black",
                        !hasVoted && "border-gray-600 hover:border-yellow-metal-400 hover:bg-yellow-metal-400/10 hover:text-yellow-metal-300",
                        !canVoteForSong && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : hasVoted ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Voted
                        </>
                      ) : (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Vote
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Progress Bar for Top 5 Songs */}
                {index < 5 && setlistSong.votes > 0 && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-800 rounded-full h-1">
                      <div 
                        className="bg-yellow-metal-400 h-1 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (setlistSong.votes / Math.max(sortedSongs[0]?.votes || 1, 1)) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {songs.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-4">No songs in this setlist yet.</p>
          <p className="text-sm">Be the first to vote when songs are added!</p>
        </div>
      )}
    </div>
  );
}
