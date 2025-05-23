
import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDebounce } from "@/hooks/use-debounce";
import { ThumbsUp, Search, PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client"; // Make sure this import is present
import AddSongToSetlist from "@/components/AddSongToSetlist";
import * as setlistService from "@/services/setlist";
import { SpotifyArtist } from "@/services/spotify";
import SongCard from "./SongCard";

interface VotingSectionProps {
  show: any;
  artist: SpotifyArtist;
  setlist: setlistService.Setlist | null;
  onRefresh: () => Promise<void>;
  voteSubmitting: string | null;
  handleVote: (songId: string) => void;
  votesRemaining: number | 'Unlimited';
  usedVotesCount: number;
  maxFreeVotes: number;
}

// Export as named export
export function VotingSection({ 
  show, 
  artist, 
  setlist, 
  onRefresh,
  voteSubmitting,
  handleVote,
  votesRemaining,
  usedVotesCount,
  maxFreeVotes
}: VotingSectionProps) {
  const [songToAdd, setSongToAdd] = useState("");
  const [songs, setSongs] = useState<setlistService.SetlistSong[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedSong = useDebounce(songToAdd, 500);
  
  // Load setlist songs on setlist change
  useEffect(() => {
    if (setlist) {
      setSongs(setlist.songs || []);
    }
  }, [setlist]);
  
  // Refresh setlist data
  const refreshSetlist = useCallback(async () => {
    setLoading(true);
    await onRefresh();
    setLoading(false);
  }, [onRefresh]);

  // Function to add a song to the setlist
  const addSong = async (songId: string) => {
    if (!setlist) return false;
    
    try {
      const success = await setlistService.addSongToSetlist(setlist.id, songId);
      if (success) {
        await refreshSetlist();
        toast("Song added to setlist");
      }
      return success;
    } catch (error) {
      console.error("Error adding song:", error);
      toast("Failed to add song");
      return false;
    }
  };

  return (
    <div className="space-y-8">
      {/* Setlist Voting Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Setlist Voting</h2>
      </div>

      {/* Current Setlist */}
      <div className="space-y-4">
        <h3 className="text-xl font-medium text-white">Current Setlist</h3>
        
        {songs.length === 0 ? (
          <Card className="bg-gray-900/40 border-gray-800/50">
            <CardContent className="p-6">
              <p className="text-gray-400">No songs in the setlist yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {songs.map((song, index) => (
              <SongCard
                key={song.id}
                song={song}
                index={index}
                handleVote={handleVote}
                voteSubmitting={voteSubmitting}
                isDisabled={votesRemaining === 0}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Voting Stats */}
      {votesRemaining !== 'Unlimited' && (
        <Card className="bg-gray-900/40 border-gray-800/50">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <span className="text-white">Votes used: {usedVotesCount}/{maxFreeVotes}</span>
              <span className="text-white">Remaining: {votesRemaining}</span>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Add Song Section */}
      <div className="mt-8 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
        <h3 className="text-lg font-medium text-white mb-4">Add Songs to Setlist</h3>
        <AddSongToSetlist 
          setlistId={setlist?.id || ''} 
          artistId={artist.id}
          onAddSong={addSong}
          onSongAdded={refreshSetlist}
        />
      </div>
    </div>
  );
}
