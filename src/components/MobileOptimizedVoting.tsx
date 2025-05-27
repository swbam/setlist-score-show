
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronUp, Plus, Music, Heart } from 'lucide-react';
import { SetlistSong } from '@/pages/ShowVoting/types';
import { useMobile } from '@/context/MobileContext';
import { LoadingSpinner } from './LoadingStates';

interface MobileOptimizedVotingProps {
  songs: SetlistSong[];
  onVote: (songId: string) => void;
  onAddSong: () => void;
  submitting: string | null;
  userVoted?: boolean;
  votesRemaining: number;
}

export default function MobileOptimizedVoting({
  songs,
  onVote,
  onAddSong,
  submitting,
  votesRemaining
}: MobileOptimizedVotingProps) {
  const { isMobile } = useMobile();
  const [expandedSong, setExpandedSong] = useState<string | null>(null);

  if (!isMobile) {
    // Return regular voting component for desktop
    return null;
  }

  const handleVote = (songId: string) => {
    // Haptic feedback for mobile
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    onVote(songId);
  };

  const toggleSongExpand = (songId: string) => {
    setExpandedSong(expandedSong === songId ? null : songId);
  };

  return (
    <div className="space-y-3">
      {/* Mobile Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Vote for Songs</h2>
        <Badge variant="outline" className="text-yellow-400 border-yellow-400">
          {votesRemaining} votes left
        </Badge>
      </div>

      {/* Add Song Button */}
      <Button
        onClick={onAddSong}
        variant="outline"
        className="w-full border-yellow-metal-600 text-yellow-metal-300 hover:bg-yellow-metal-900/50 py-6"
      >
        <Plus className="h-5 w-5 mr-2" />
        Add a Song to the Setlist
      </Button>

      {/* Song List - Mobile Optimized */}
      <div className="space-y-2">
        {songs.map((songItem, index) => {
          const isExpanded = expandedSong === songItem.id;
          const isSubmitting = submitting === songItem.id;
          const canVote = !songItem.userVoted && votesRemaining > 0;

          return (
            <Card 
              key={songItem.id} 
              className={`bg-gray-900/60 border-gray-800/50 transition-all duration-200 ${
                isExpanded ? 'ring-1 ring-yellow-metal-600' : ''
              }`}
            >
              <CardContent className="p-4">
                {/* Main Song Info - Always Visible */}
                <div 
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => toggleSongExpand(songItem.id)}
                >
                  {/* Position Badge */}
                  <div className="flex-shrink-0">
                    <Badge 
                      variant="outline" 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-yellow-metal-900/50 border-yellow-metal-600 text-yellow-metal-200"
                    >
                      {index + 1}
                    </Badge>
                  </div>

                  {/* Song Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">
                      {songItem.song.name}
                    </h3>
                    <p className="text-gray-400 text-sm truncate">
                      {songItem.song.album}
                    </p>
                  </div>

                  {/* Vote Count */}
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-yellow-400 font-bold">
                        {songItem.votes}
                      </div>
                      <div className="text-xs text-gray-400">votes</div>
                    </div>
                    
                    {/* User Voted Indicator */}
                    {songItem.userVoted && (
                      <Heart className="h-4 w-4 text-red-500 fill-current" />
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="flex items-center justify-between">
                      {/* Song Stats */}
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Music className="h-4 w-4" />
                          <span>{songItem.song.album}</span>
                        </div>
                      </div>

                      {/* Vote Button */}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVote(songItem.id);
                        }}
                        disabled={!canVote || isSubmitting}
                        size="sm"
                        className={`
                          flex items-center gap-2 min-w-[80px] transition-colors
                          ${songItem.userVoted 
                            ? 'bg-gray-700 text-gray-400' 
                            : 'bg-yellow-metal-600 hover:bg-yellow-metal-700 text-black'
                          }
                        `}
                      >
                        {isSubmitting ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <ChevronUp className="h-4 w-4" />
                            {songItem.userVoted ? 'Voted' : 'Vote'}
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Additional Mobile Info */}
                    <div className="mt-3 text-xs text-gray-500">
                      Tap to collapse • {songItem.userVoted ? 'You voted for this song' : 'Tap vote to support this song'}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Mobile Voting Tips */}
      <Card className="bg-blue-900/20 border-blue-800/50">
        <CardContent className="p-4">
          <div className="text-center">
            <h4 className="text-blue-300 font-medium mb-2">
              💡 Voting Tips
            </h4>
            <p className="text-blue-200 text-sm">
              Tap any song to see more details and vote. Your votes help determine the setlist ranking!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
