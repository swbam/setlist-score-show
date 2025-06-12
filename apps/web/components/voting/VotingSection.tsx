import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VoteButton } from './VoteButton';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Clock, AlertCircle, Users, Share, Users2 } from 'lucide-react';
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

interface CatalogSong {
  id: string;
  title: string;
  album?: string;
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
  artistSongs?: CatalogSong[];
  selectedSongToAdd?: CatalogSong | null;
  onSongSelect?: (song: CatalogSong | null) => void;
  onAddSong?: () => void;
  isAddingSong?: boolean;
  user?: any;
  showData?: any;
}

export function VotingSection({ 
  songs, 
  onVote, 
  isLoading, 
  showId,
  voteLimits,
  artistSongs = [],
  selectedSongToAdd,
  onSongSelect,
  onAddSong,
  isAddingSong = false,
  user,
  showData
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

  const totalVotes = songs.reduce((sum, s) => sum + s.votes, 0);
  const votedUsersCount = 127; // This would come from props or API
  const votingCloseTime = "2d 14h"; // This would be calculated from show date

  // Filter out songs that are already in the setlist
  const availableSongs = artistSongs.filter(catalogSong => 
    !songs.some(setlistSong => setlistSong.song.id === catalogSong.id)
  ).sort((a, b) => a.title.localeCompare(b.title));

  if (isLoading) {
    return (
      <div className="flex gap-8">
        <div className="flex-1">
          <div className="h-12 bg-muted rounded-lg animate-pulse mb-8" />
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
        <div className="w-80">
          <div className="h-64 bg-muted rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-8">
      {/* Main Voting Area */}
      <div className="flex-1">
        {/* Main Setlist Card */}
        <div className="card-base p-6">
          {/* Header with dropdown */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-headline font-bold mb-2 text-foreground">What do you want to hear?</h2>
              <p className="text-muted-foreground font-body">
                Vote for songs you want to hear at this show
              </p>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users2 className="w-4 h-4" />
              <span>0 votes</span>
              <Share className="w-4 h-4 ml-4" />
              <span>Share</span>
            </div>
          </div>

          {/* Add Song Section */}
          {showData?.setlists?.[0]?.id && user && (
            <div className="mb-6 pb-6 border-b border-border/30">
              <p className="text-sm text-muted-foreground font-body mb-3">Add a song to this setlist:</p>
              <div className="flex items-center gap-3">
                <select
                  className="bg-input border border-border text-foreground px-4 py-2 rounded-lg font-body flex-1 focus:outline-none focus:border-primary transition-colors"
                  value={selectedSongToAdd?.id || ''}
                  onChange={(e) => {
                    const song = availableSongs.find(s => s.id === e.target.value) || null
                    onSongSelect?.(song)
                  }}
                >
                  <option value="">Select a song</option>
                  {availableSongs.map((song) => (
                    <option key={song.id} value={song.id}>{song.title}</option>
                  ))}
                </select>
                <button
                  onClick={onAddSong}
                  disabled={!selectedSongToAdd || isAddingSong}
                  className="bg-muted hover:bg-muted/80 text-foreground px-4 py-2 rounded-lg font-body disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                                     {isAddingSong ? 'Adding...' : 'Add to Setlist'}
                </button>
              </div>
              <p className="text-xs text-muted-foreground font-body mt-2">{availableSongs.length} songs available in the catalog</p>
            </div>
          )}

          {/* Vote Limits Warning */}
          {voteLimits && voteLimits.showVotesRemaining === 0 && (
            <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-4 flex items-start gap-3 mb-6">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-200 font-medium">Vote limit reached</p>
                <p className="text-yellow-300/80 text-sm mt-1">
                  You've used all your votes for this show. Come back tomorrow to vote again!
                </p>
              </div>
            </div>
          )}

          {/* Songs Table */}
          <div className="space-y-0">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 text-sm font-medium text-muted-foreground border-b border-border/30 font-body">
              <div className="col-span-1">#</div>
              <div className="col-span-7">SONG</div>
              <div className="col-span-2 text-center">VOTES</div>
              <div className="col-span-2"></div>
            </div>

            {/* Songs List */}
            <AnimatePresence mode="popLayout">
              {sortedSongs.map((setlistSong, index) => (
                <motion.div
                  key={setlistSong.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.02 }}
                  className="grid grid-cols-12 gap-4 px-4 py-4 border-b border-border/20 hover:bg-muted/20 transition-colors group"
                >
                  {/* Rank Number */}
                  <div className="col-span-1 flex items-center">
                    <span className={cn(
                      "text-lg font-headline font-bold",
                      index === 0 && sortBy === 'votes' 
                        ? "text-yellow-500" 
                        : "text-muted-foreground" 
                    )}>
                      {sortBy === 'votes' ? index + 1 : setlistSong.position}
                    </span>
                  </div>

                  {/* Song Info */}
                  <div className="col-span-7 flex items-center">
                    <div className="min-w-0">
                      <h3 className="font-medium text-base text-foreground font-body truncate">
                        {setlistSong.song.name}
                      </h3>
                      {setlistSong.song.album && (
                        <p className="text-sm text-muted-foreground font-body truncate">
                          {setlistSong.song.album}
                        </p>
                      )}
                    </div>
                    {setlistSong.hasVoted && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-md font-medium ml-auto">
                        Voted
                      </span>
                    )}
                  </div>

                  {/* Vote Count */}
                  <div className="col-span-2 flex items-center justify-center">
                    <span className="text-base font-medium text-foreground">
                      {setlistSong.votes}
                    </span>
                  </div>

                  {/* Vote Button */}
                  <div className="col-span-2 flex items-center justify-center">
                    <VoteButton
                      songId={setlistSong.song.id}
                      showId={showId}
                      setlistSongId={setlistSong.id}
                      currentVotes={setlistSong.votes}
                      hasVoted={setlistSong.hasVoted}
                      position={setlistSong.position}
                      onVote={(songId) => onVote(songId, setlistSong.id)}
                      disabled={!setlistSong.canVote}
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-border/30 flex items-center justify-between text-sm text-muted-foreground">
            <span>You've used 1/3 free votes</span>
            <span>Last updated less than a minute ago</span>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Voting Stats */}
      <div className="w-80 space-y-6">
        {/* Voting Stats Card */}
        <div className="card-base p-6">
          <h3 className="text-xl font-headline font-bold mb-6 text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Voting Stats
          </h3>
          
          {/* Total Votes */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground font-body mb-1">Total Votes</p>
            <p className="text-3xl font-headline font-bold text-foreground">{totalVotes}</p>
          </div>

          {/* Free Votes Used */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground font-body">Free Votes Used</p>
              <button className="text-xs text-primary hover:underline font-body">Log in for more</button>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xl font-headline font-bold text-foreground">
                {voteLimits ? `${3 - voteLimits.showVotesRemaining}/3` : '1/3'}
              </p>
            </div>
            <div className="w-full bg-secondary/30 rounded-full h-1 mt-2">
              <div 
                className="bg-primary h-1 rounded-full transition-all duration-300"
                style={{ width: voteLimits ? `${((3 - voteLimits.showVotesRemaining) / 3) * 100}%` : '33%' }}
              />
            </div>
          </div>

          {/* Voting Closes In */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground font-body mb-1">Voting Closes In</p>
            <p className="text-xl font-headline font-bold text-foreground">{votingCloseTime}</p>
          </div>

          {/* Fans Voted */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-body">
            <Users className="w-4 h-4" />
            <span><span className="font-semibold text-foreground">{votedUsersCount}</span> fans have voted</span>
          </div>
        </div>

        {/* How It Works Card */}
        <div className="card-base p-6">
          <h3 className="text-lg font-headline font-bold mb-4 text-foreground flex items-center gap-2">
            <Clock className="w-5 h-5" />
            How It Works
          </h3>
          
          <div className="space-y-4 text-sm font-body">
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <p className="text-muted-foreground">
                Vote for songs you want to hear at this show. The most voted songs rise to the top of the list.
              </p>
            </div>
            
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <p className="text-muted-foreground">
                Anyone can add songs to the setlist! Select from the dropdown above to help build the perfect concert.
              </p>
            </div>
            
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <p className="text-muted-foreground">
                Non-logged in users can vote for up to 3 songs. Create an account to vote for unlimited songs!
              </p>
            </div>
            
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xs font-bold">4</span>
              <p className="text-muted-foreground">
                Voting closes 2 hours before the show
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}