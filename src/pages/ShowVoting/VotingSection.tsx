
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Heart, Share, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SetlistSong } from "./types";
import { useMobile } from "@/context/MobileContext";

interface VotingSectionProps {
  songs: SetlistSong[];
  onVote: (setlistSongId: string) => void;
  submitting: string | null;
  onAddSong?: () => void;
}

export const VotingSection = ({ songs, onVote, submitting, onAddSong }: VotingSectionProps) => {
  const { isMobile } = useMobile();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">What do you want to hear?</h2>
            <p className="text-gray-400">Vote for songs you want to hear at this show</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-yellow-metal-300"
            >
              <Eye className="h-4 w-4 mr-2" />
              0 votes
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-yellow-metal-300"
            >
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Add Song Section */}
        <div className="flex items-center gap-4 p-4 bg-gray-900/60 rounded-lg border border-gray-800">
          <span className="text-gray-300">Add a song to this setlist:</span>
          <select className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-300 min-w-[200px]">
            <option>Select a song</option>
          </select>
          <Button 
            size="sm"
            className="bg-yellow-metal-400 text-black hover:bg-yellow-metal-300 font-medium"
          >
            Add to Setlist
          </Button>
          <span className="text-gray-500 text-sm">82 songs available in the catalog</span>
        </div>
      </div>

      {/* Songs List */}
      <div className="space-y-3">
        {songs.map((setlistSong, index) => (
          <Card 
            key={setlistSong.id} 
            className="bg-gray-900/60 border-gray-800 hover:border-gray-700 transition-colors"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                {/* Song Info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Position Badge */}
                  <div className="w-8 h-8 bg-yellow-metal-400 text-black rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  
                  {/* Song Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-medium truncate">
                        {setlistSong.song?.name || 'Unknown Song'}
                      </h3>
                    </div>
                    <p className="text-gray-400 text-sm truncate">
                      {setlistSong.song?.album || 'Unknown Album'}
                    </p>
                  </div>
                </div>

                {/* Voting Section */}
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-white font-bold text-lg">
                      {setlistSong.votes}
                    </div>
                    <div className="text-gray-400 text-xs uppercase tracking-wide">
                      VOTES
                    </div>
                  </div>

                  <Button
                    onClick={() => onVote(setlistSong.id)}
                    disabled={submitting === setlistSong.id}
                    size="sm"
                    className="bg-yellow-metal-400 text-black hover:bg-yellow-metal-300 font-medium min-w-[60px]"
                  >
                    {submitting === setlistSong.id ? (
                      <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Heart className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {songs.length === 0 && (
          <Card className="bg-gray-900/60 border-gray-800">
            <CardContent className="p-8 text-center">
              <p className="text-gray-400 mb-4">
                No songs in this setlist yet. Be the first to add one!
              </p>
              {onAddSong && (
                <Button
                  onClick={onAddSong}
                  className="bg-yellow-metal-400 text-black hover:bg-yellow-metal-300 font-medium"
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
