import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VoteButton } from './VoteButton';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Song {
  id: string;
  name: string;
  album: string;
  duration_ms: number;
  spotify_url?: string;
}

interface SetlistSong {
  id: string;
  position: number;
  votes: number;
  hasVoted: boolean;
  canVote: boolean;
  song: Song;
}

interface VotingSectionProps {
  songs: SetlistSong[];
  onVote: (songId: string, setlistSongId: string) => Promise<void>;
  isLoading?: boolean;
  showId: string;
  voteLimits?: {
    showVotesRemaining: number;
    dailyVotesRemaining: number;
  };
}

export function VotingSection({ 
  songs, 
  onVote, 
  isLoading, 
  showId,
  voteLimits 
}: VotingSectionProps) {
  const [sortedSongs, setSortedSongs] = useState<SetlistSong[]>([]);
  const [sortBy, setSortBy] = useState<'votes' | 'position'>('votes');

  useEffect(() => {
    const sorted = [...songs].sort((a, b) => {
      if (sortBy === 'votes') {
        return b.votes - a.votes;
      }
      return a.position - b.position;
    });
    setSortedSongs(sorted);
  }, [songs, sortBy]);

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Vote for Songs</h2>
          <p className="text-gray-400 mt-1">
            Help choose the setlist by voting for your favorite songs
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortBy('votes')}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              sortBy === 'votes' 
                ? "bg-gray-600 text-white" 
                : "bg-gray-800 text-gray-400 hover:text-white"
            )}
          >
            <TrendingUp className="w-4 h-4 inline mr-1" />
            Popular
          </button>
          <button
            onClick={() => setSortBy('position')}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              sortBy === 'position' 
                ? "bg-gray-600 text-white" 
                : "bg-gray-800 text-gray-400 hover:text-white"
            )}
          >
            <Clock className="w-4 h-4 inline mr-1" />
            Original
          </button>
        </div>
      </div>

      {/* Vote Limits Warning */}
      {voteLimits && voteLimits.showVotesRemaining === 0 && (
        <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-200 font-medium">Vote limit reached</p>
            <p className="text-yellow-300/80 text-sm mt-1">
              You've used all your votes for this show. Come back tomorrow to vote again!
            </p>
          </div>
        </div>
      )}

      {/* Songs List */}
      <AnimatePresence mode="popLayout">
        <div className="space-y-3">
          {sortedSongs.map((setlistSong, index) => (
            <motion.div
              key={setlistSong.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={cn(
                "gradient-card rounded-lg p-4 border border-gray-800",
                "hover:border-gray-600/30 transition-all duration-300",
                setlistSong.hasVoted && "ring-1 ring-gray-500/50"
              )}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Rank Badge */}
                  <div className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold",
                    index === 0 && sortBy === 'votes' 
                      ? "bg-gray-600 text-white"
                      : "bg-gray-800 text-gray-400"
                  )}>
                    {sortBy === 'votes' ? `#${index + 1}` : setlistSong.position}
                  </div>

                  {/* Song Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg truncate">
                        {setlistSong.song.name}
                      </h3>
                      {setlistSong.hasVoted && (
                        <Badge variant="secondary" className="text-xs">
                          Voted
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-sm text-gray-400 truncate">
                        {setlistSong.song.album}
                      </p>
                      <span className="text-xs text-gray-500">
                        {formatDuration(setlistSong.song.duration_ms)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Vote Button */}
                <VoteButton
                  songId={setlistSong.song.id}
                  showId={showId}
                  currentVotes={setlistSong.votes}
                  hasVoted={setlistSong.hasVoted}
                  position={setlistSong.position}
                  onVote={(songId) => onVote(songId, setlistSong.id)}
                  disabled={!setlistSong.canVote}
                />
              </div>

              {/* Progress Bar */}
              {songs.length > 0 && (
                <div className="mt-3">
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gray-500"
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${(setlistSong.votes / Math.max(...songs.map(s => s.votes), 1)) * 100}%` 
                      }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {/* Total Stats */}
      <div className="mt-8 pt-6 border-t border-gray-800">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">
            Total songs: <span className="text-white font-medium">{songs.length}</span>
          </span>
          <span className="text-gray-400">
            Total votes: <span className="text-white font-medium">
              {songs.reduce((sum, s) => sum + s.votes, 0)}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}