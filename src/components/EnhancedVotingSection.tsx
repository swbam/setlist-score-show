
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, HeartHandshake, Loader2, CheckCircle, Plus } from 'lucide-react';
import { useEnhancedVoting } from '@/hooks/useEnhancedVoting';
import { useAuth } from '@/context/AuthContext';
import { SetlistSong } from '@/pages/ShowVoting/types';
import AddSongToSetlist from '@/components/AddSongToSetlist';
import * as setlistManager from '@/services/setlistManager';

interface EnhancedVotingSectionProps {
  songs: SetlistSong[];
  setlistId: string;
  showId: string;
  artistId?: string;
  onSongAdded?: () => void;
}

export function EnhancedVotingSection({ songs, setlistId, showId, artistId, onSongAdded }: EnhancedVotingSectionProps) {
  const { user } = useAuth();
  const enhancedVoting = useEnhancedVoting(setlistId || null, showId || null, user?.id || null);
  const [showAddSong, setShowAddSong] = useState(false);

  const handleVote = async (songId: string) => {
    if (!user) {
      return;
    }
    await enhancedVoting.vote(songId);
  };

  const handleAddSong = async (songId: string): Promise<boolean> => {
    try {
      const success = await setlistManager.addSongToSetlist(setlistId, songId);
      if (success && onSongAdded) {
        onSongAdded();
      }
      return success;
    } catch (error) {
      console.error('Error adding song:', error);
      return false;
    }
  };

  const sortedSongs = [...songs].sort((a, b) => {
    const aVotes = enhancedVoting.getVoteCount(a.id);
    const bVotes = enhancedVoting.getVoteCount(b.id);
    return bVotes - aVotes;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Vote for Songs</h2>
        <div className="flex items-center gap-4">
          {user && (
            <div className="text-sm text-gray-400">
              <span className="mr-4">Daily: {enhancedVoting.voteStats.dailyVotesRemaining}/50</span>
              <span>Show: {enhancedVoting.voteStats.showVotesRemaining}/10</span>
            </div>
          )}
          {user && artistId && (
            <Button
              onClick={() => setShowAddSong(!showAddSong)}
              variant="outline"
              size="sm"
              className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Song
            </Button>
          )}
        </div>
      </div>

      {/* Add Song Component */}
      {showAddSong && user && artistId && (
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Add Song to Setlist</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddSong(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </Button>
            </div>
            <AddSongToSetlist
              artistId={artistId}
              setlistId={setlistId}
              onAddSong={handleAddSong}
              onSongAdded={async () => {
                setShowAddSong(false);
                if (onSongAdded) onSongAdded();
              }}
            />
          </CardContent>
        </Card>
      )}

      {!user && (
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <p className="text-gray-300 text-center">
              Please log in to vote for songs you want to hear at this show!
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {sortedSongs.map((song, index) => {
          const voteCount = enhancedVoting.getVoteCount(song.id);
          const hasVoted = enhancedVoting.hasUserVoted(song.id);
          const isSubmitting = enhancedVoting.isVoteSubmitting(song.id);
          const canVote = user && !hasVoted && enhancedVoting.voteStats.showVotesRemaining > 0 && enhancedVoting.voteStats.dailyVotesRemaining > 0;

          return (
            <Card 
              key={song.id} 
              className={`bg-gray-900 border-gray-700 transition-all duration-200 ${
                hasVoted ? 'ring-2 ring-red-500/50 bg-red-950/20' : 'hover:bg-gray-800'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                      <h3 className="font-semibold text-white text-lg">
                        {song.song.name}
                      </h3>
                      {hasVoted && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-red-400">
                        <Heart className="w-4 h-4" />
                        <span className="font-bold text-lg">{voteCount}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {voteCount === 1 ? 'vote' : 'votes'}
                      </div>
                    </div>

                    <Button
                      onClick={() => handleVote(song.id)}
                      disabled={!canVote || isSubmitting}
                      variant={hasVoted ? "secondary" : "default"}
                      size="sm"
                      className={`min-w-[80px] ${
                        hasVoted 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : hasVoted ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Voted
                        </>
                      ) : (
                        <>
                          <HeartHandshake className="w-4 h-4 mr-1" />
                          Vote
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Vote limit warnings */}
                {user && !hasVoted && (
                  <>
                    {enhancedVoting.voteStats.showVotesRemaining === 0 && (
                      <div className="mt-2 text-xs text-amber-400">
                        Show vote limit reached (10/10)
                      </div>
                    )}
                    {enhancedVoting.voteStats.dailyVotesRemaining === 0 && (
                      <div className="mt-2 text-xs text-amber-400">
                        Daily vote limit reached (50/50)
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {songs.length === 0 && (
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-8 text-center">
            <p className="text-gray-400 text-lg">
              No songs available for voting yet.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Songs will appear here once the setlist is created for this show.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Real-time connection indicator */}
      <div className="flex items-center justify-center pt-4">
        <Badge 
          variant={enhancedVoting.isConnected ? "default" : "destructive"}
          className="text-xs"
        >
          {enhancedVoting.isConnected ? "🟢 Live voting updates" : "🔴 Connection lost"}
        </Badge>
      </div>
    </div>
  );
}
