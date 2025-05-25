
import React from "react";
import { Button } from "@/components/ui/button";
import { Heart, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Fan-Voted Setlist</h2>
        {onAddSong && (
          <Button
            onClick={onAddSong}
            variant="outline"
            size="sm"
            className="border-cyan-600 text-cyan-600 hover:bg-cyan-600 hover:text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Song
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {songs.map((setlistSong, index) => (
          <Card 
            key={setlistSong.id} 
            className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors"
          >
            <CardContent className={`${isMobile ? 'p-3' : 'p-4'}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-400 font-mono text-sm w-8">
                      #{index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-white font-medium truncate">
                        {setlistSong.song?.name || 'Unknown Song'}
                      </h3>
                      <p className="text-gray-400 text-sm truncate">
                        {setlistSong.song?.album || 'Unknown Album'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-center">
                    <div className="text-white font-bold">
                      {setlistSong.votes}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {setlistSong.votes === 1 ? 'vote' : 'votes'}
                    </div>
                  </div>

                  <Button
                    onClick={() => onVote(setlistSong.id)}
                    disabled={submitting === setlistSong.id}
                    variant="outline"
                    size={isMobile ? "sm" : "default"}
                    className="border-cyan-600 text-cyan-600 hover:bg-cyan-600 hover:text-white"
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {songs.length === 0 && (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-8 text-center">
              <p className="text-gray-400">
                No songs in this setlist yet. Be the first to add one!
              </p>
              {onAddSong && (
                <Button
                  onClick={onAddSong}
                  className="mt-4 bg-cyan-600 hover:bg-cyan-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Song
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VotingSection;
