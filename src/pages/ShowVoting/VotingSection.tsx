
import React from "react";
import { Button } from "@/components/ui/button";
import { Share, Eye, Heart, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SetlistSong } from "./types";

interface VotingSectionProps {
  songs: SetlistSong[];
  onVote: (setlistSongId: string) => void;
  submitting: string | null;
  onAddSong?: () => void;
}

const VotingSection = ({ songs, onVote, submitting, onAddSong }: VotingSectionProps) => {
  const totalVotes = songs.reduce((sum, song) => sum + song.votes, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Vote for Songs</h2>
            <p className="text-gray-400">Help create the perfect setlist for this show</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <Eye className="h-4 w-4 mr-2" />
              {totalVotes} votes
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Add Song Section */}
        <div className="flex items-center gap-4 p-4 bg-gray-900 rounded-lg border border-gray-800">
          <span className="text-gray-300">Add a song to this setlist:</span>
          <select className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-300 min-w-[200px]">
            <option>Select a song</option>
          </select>
          <Button 
            size="sm"
            className="bg-white text-black hover:bg-gray-200 font-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Song
          </Button>
        </div>
      </div>

      {/* Songs List */}
      <div className="space-y-3">
        {songs.length > 0 ? (
          songs.map((song, index) => (
            <Card 
              key={song.id} 
              className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  {/* Song Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Position */}
                    <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    
                    {/* Song Details */}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-white font-medium truncate">
                        {song.song?.name || 'Unknown Song'}
                      </h3>
                      <p className="text-gray-400 text-sm truncate">
                        {song.song?.album || 'Unknown Album'}
                      </p>
                    </div>
                  </div>

                  {/* Voting Section */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-center">
                      <div className="text-white font-bold text-lg">
                        {song.votes}
                      </div>
                      <div className="text-gray-400 text-xs uppercase tracking-wide">
                        VOTES
                      </div>
                    </div>

                    <Button
                      onClick={() => onVote(song.id)}
                      disabled={submitting === song.id}
                      size="sm"
                      className="bg-white text-black hover:bg-gray-200 font-medium min-w-[70px]"
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
          ))
        ) : (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-8 text-center">
              <p className="text-gray-400 mb-4">
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
            </CardContent>
          </Card>
        )}
      </div>

      <div className="text-center text-gray-500 text-sm mt-6">
        Last updated less than a minute ago
      </div>
    </div>
  );
};

export default VotingSection;
