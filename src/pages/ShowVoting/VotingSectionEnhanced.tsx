import React from "react";
import { Button } from "@/components/ui/button";
import { Share, Eye, Heart, Plus, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface EnhancedSetlistSong {
  id: string;
  song_id: string;
  setlist_id: string;
  position: number;
  votes: number;
  hasVoted?: boolean;
  canVote?: boolean;
  song?: {
    id: string;
    name: string;
    album?: string;
    artist_id: string;
  };
}

interface VotingSectionEnhancedProps {
  songs: EnhancedSetlistSong[];
  onVote: (songId: string, setlistSongId: string) => void;
  submitting: string | null;
  onAddSong?: () => void;
}

const VotingSectionEnhanced = ({ songs, onVote, submitting, onAddSong }: VotingSectionEnhancedProps) => {
  const totalVotes = songs.reduce((sum, song) => sum + song.votes, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">What do you want to hear?</h2>
            <p className="text-gray-400">Vote for songs you want to hear at this show</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600"
            >
              <Eye className="h-4 w-4 mr-2" />
              {totalVotes} votes
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600"
            >
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Add Song Section */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <span className="text-gray-300 font-medium">Add a song to this setlist:</span>
            <div className="flex gap-3 flex-1">
              <select className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-300 flex-1 min-w-0 focus:ring-2 focus:ring-white focus:border-transparent">
                <option>Select a song</option>
              </select>
              <Button 
                size="sm"
                className="bg-white text-black hover:bg-gray-200 font-medium px-6 whitespace-nowrap"
                onClick={onAddSong}
              >
                Add to Setlist
              </Button>
            </div>
          </div>
          <p className="text-gray-500 text-sm mt-3">{songs.length} songs available in the catalog</p>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-gray-400 uppercase tracking-wide border-b border-gray-800">
        <div className="col-span-1">#</div>
        <div className="col-span-6">Song</div>
        <div className="col-span-3 text-center">Votes</div>
        <div className="col-span-2"></div>
      </div>

      {/* Songs List */}
      <div className="space-y-2">
        {songs.length > 0 ? (
          songs.map((song, index) => (
            <div 
              key={song.id} 
              className={cn(
                "grid grid-cols-12 gap-4 items-center p-4 transition-colors border rounded-lg",
                song.hasVoted 
                  ? "bg-green-900/20 border-green-800/50 hover:bg-green-900/30" 
                  : "bg-gray-900/30 border-gray-800/50 hover:bg-gray-900/50"
              )}
            >
              {/* Position */}
              <div className="col-span-1">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                  song.hasVoted ? "bg-green-500 text-white" : "bg-white text-black"
                )}>
                  {index + 1}
                </div>
              </div>
              
              {/* Song Info */}
              <div className="col-span-6 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-semibold truncate text-lg">
                    {song.song?.name || 'Unknown Song'}
                  </h3>
                  {song.hasVoted && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                      <Check className="h-3 w-3 mr-1" />
                      Voted
                    </Badge>
                  )}
                </div>
                <p className="text-gray-400 text-sm truncate">
                  {song.song?.album || 'Unknown Album'}
                </p>
              </div>

              {/* Votes */}
              <div className="col-span-3 text-center">
                <div className="text-white font-bold text-xl">
                  {song.votes}
                </div>
              </div>

              {/* Vote Button */}
              <div className="col-span-2 flex justify-end">
                {song.hasVoted ? (
                  <Button
                    size="sm"
                    disabled
                    className="bg-gray-700 text-gray-400 cursor-not-allowed min-w-[80px]"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Voted
                  </Button>
                ) : (
                  <Button
                    onClick={() => onVote(song.song_id, song.id)}
                    disabled={submitting === song.id || !song.canVote}
                    size="sm"
                    className={cn(
                      "font-medium min-w-[80px]",
                      song.canVote 
                        ? "bg-white text-black hover:bg-gray-200" 
                        : "bg-gray-700 text-gray-400 cursor-not-allowed"
                    )}
                  >
                    {submitting === song.id ? (
                      <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Heart className="h-4 w-4 mr-1" />
                        Vote
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-gray-900/30 border border-gray-800 rounded-lg">
            <p className="text-gray-400 mb-4 text-lg">
              No songs in this setlist yet. Be the first to add one!
            </p>
            {onAddSong && (
              <Button
                onClick={onAddSong}
                className="bg-white text-black hover:bg-gray-200 font-medium"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Song
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="text-center text-gray-500 text-sm mt-6">
        Last updated less than a minute ago
      </div>
    </div>
  );
};

export default VotingSectionEnhanced;