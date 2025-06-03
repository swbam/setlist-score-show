
import React from "react";
import { Button } from "@/components/ui/button";
import { Share, Eye, Heart, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { SetlistSong } from "./types";

interface VotingSectionProps {
  songs: SetlistSong[];
  onVote: (setlistSongId: string) => void;
  submitting: string | null;
  onAddSong?: () => void;
}

const VotingSection = ({ songs, onVote, submitting, onAddSong }: VotingSectionProps) => {
  const isMobile = useIsMobile();
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
          <div className="flex flex-col gap-4">
            <span className="text-gray-300 font-medium">Add a song to this setlist:</span>
            <div className="flex flex-col sm:flex-row gap-3">
              <select className={`bg-gray-800 border border-gray-700 rounded-lg px-4 text-gray-300 flex-1 min-w-0 focus:ring-2 focus:ring-white focus:border-transparent ${isMobile ? 'py-3 text-base' : 'py-2'}`}>
                <option>Select a song</option>
              </select>
              <Button 
                size={isMobile ? "default" : "sm"}
                className={`bg-white text-black hover:bg-gray-200 font-medium whitespace-nowrap ${isMobile ? 'w-full h-12' : 'px-6'}`}
                onClick={onAddSong}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add to Setlist
              </Button>
            </div>
          </div>
          <p className="text-gray-500 text-sm mt-3">{songs.length} songs available in the catalog</p>
        </div>
      </div>

      {/* Table Header - Hidden on Mobile */}
      {!isMobile && (
        <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-gray-400 uppercase tracking-wide border-b border-gray-800">
          <div className="col-span-1">#</div>
          <div className="col-span-6">Song</div>
          <div className="col-span-3 text-center">Votes</div>
          <div className="col-span-2"></div>
        </div>
      )}

      {/* Songs List */}
      <div className="space-y-2">
        {songs.length > 0 ? (
          songs.map((song, index) => (
            isMobile ? (
              // Mobile Card Layout
              <Card 
                key={song.id} 
                className="bg-gray-900/30 hover:bg-gray-900/50 transition-colors border-gray-800/50"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    {/* Left side - Position and Song info */}
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold truncate text-base">
                          {song.song?.name || 'Unknown Song'}
                        </h3>
                        <p className="text-gray-400 text-sm truncate">
                          {song.song?.album || 'Unknown Album'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Right side - Votes and button */}
                    <div className="flex items-center space-x-3 flex-shrink-0">
                      <div className="text-center">
                        <div className="text-white font-bold text-lg">
                          {song.votes}
                        </div>
                        <div className="text-xs text-gray-400">
                          votes
                        </div>
                      </div>
                      <Button
                        onClick={() => onVote(song.id)}
                        disabled={submitting === song.id}
                        size="default"
                        className="bg-white text-black hover:bg-gray-200 font-medium min-w-[80px] h-11 touch-manipulation"
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              // Desktop Grid Layout
              <div 
                key={song.id} 
                className="grid grid-cols-12 gap-4 items-center p-4 bg-gray-900/30 hover:bg-gray-900/50 transition-colors border border-gray-800/50 rounded-lg"
              >
                {/* Position */}
                <div className="col-span-1">
                  <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                </div>
                
                {/* Song Info */}
                <div className="col-span-6 min-w-0">
                  <h3 className="text-white font-semibold truncate text-lg">
                    {song.song?.name || 'Unknown Song'}
                  </h3>
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
                  <Button
                    onClick={() => onVote(song.id)}
                    disabled={submitting === song.id}
                    size="sm"
                    className="bg-white text-black hover:bg-gray-200 font-medium min-w-[80px]"
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
                </div>
              </div>
            )
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

export default VotingSection;
