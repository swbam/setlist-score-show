
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronUp, Loader2, Check } from 'lucide-react';
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

      <div className="space-y-3">
        {sortedSongs.map((setlistSong, index) => {
          const isSubmitting = submitting.has(setlistSong.id);
          const hasVoted = userVotes.has(setlistSong.id);
          const canVoteForSong = canVote(setlistSong.id);

          return (
            <Card 
              key={setlistSong.id}
              className={cn(
                "bg-gray-900/40 border-gray-800/50 transition-all duration-200",
                hasVoted && "border-yellow-400/50 bg-yellow-400/5",
                isSubmitting && "scale-[0.98] opacity-80"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  {/* Position Badge */}
                  <div className="flex items-center space-x-3">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs font-mono w-8 h-8 rounded-full flex items-center justify-center",
                        index < 3 && "bg-yellow-400/20 text-yellow-400 border-yellow-400/40"
                      )}
                    >
                      {index + 1}
                    </Badge>

                    {/* Song Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate">
                        {setlistSong.song.name}
                      </h3>
                      <p className="text-gray-400 text-sm truncate">
                        {setlistSong.song.album}
                      </p>
                    </div>
                  </div>

                  {/* Vote Section */}
                  <div className="flex items-center space-x-3">
                    {/* Vote Count */}
                    <div className="text-center min-w-[60px]">
                      <div className="text-lg font-bold text-white">
                        {setlistSong.votes}
                      </div>
                      <div className="text-xs text-gray-400">
                        {setlistSong.votes === 1 ? 'vote' : 'votes'}
                      </div>
                    </div>

                    {/* Vote Button */}
                    <Button
                      onClick={() => handleVote(setlistSong.id)}
                      disabled={!canVoteForSong || isSubmitting}
                      variant={hasVoted ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "w-16 h-16 rounded-full transition-all duration-200",
                        hasVoted && "bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-400",
                        !hasVoted && "border-gray-600 hover:border-yellow-400 hover:bg-yellow-400/10",
                        !canVoteForSong && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : hasVoted ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <ChevronUp className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Progress Bar for Top Songs */}
                {index < 5 && setlistSong.votes > 0 && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-700 rounded-full h-1">
                      <div 
                        className="bg-yellow-400 h-1 rounded-full transition-all duration-300"
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
    </div>
  );
}
