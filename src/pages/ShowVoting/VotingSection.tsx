
import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDebounce } from "@/hooks/use-debounce";
import { MoreVertical, CheckCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client"; // Added missing import
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import VotingStatsRefactored from "@/components/VotingStatsRefactored";
import AddSongToSetlist from "@/components/AddSongToSetlist";
import * as setlistService from "@/services/setlist";
import { SpotifyArtist } from "@/services/spotify";

interface VotingSectionProps {
  show: any;
  artist: SpotifyArtist;
  setlist: setlistService.Setlist | null;
  onRefresh: () => Promise<void>;
}

// Export as named export, not default
export function VotingSection({ show, artist, setlist, onRefresh }: VotingSectionProps) {
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
      }
      return success;
    } catch (error) {
      console.error("Error adding song:", error);
      return false;
    }
  };
  
  // Function to handle vote
  const handleVote = async (songId: string) => {
    // Optimistically update the UI
    const updatedSongs = songs.map(song => {
      if (song.song_id === songId) {
        return { ...song, votes: song.votes + 1 };
      }
      return song;
    }).sort((a, b) => b.votes - a.votes);
    
    setSongs(updatedSongs);
    
    // Call the API
    try {
      const { error } = await supabase.rpc('vote_for_song', {
        setlist_song_id: songId
      });
      
      if (error) {
        console.error("Error voting for song:", error);
        // Fixed toast call
        toast("Failed to vote", {
          description: "There was an error voting for this song",
          variant: "destructive",
        });
        
        // Revert the UI
        await refreshSetlist();
      }
    } catch (error) {
      console.error("Error voting for song:", error);
      // Fixed toast call
      toast("Failed to vote", {
        description: "There was an error voting for this song",
        variant: "destructive",
      });
      
      // Revert the UI
      await refreshSetlist();
    }
  };
  
  // Function to remove vote
  const handleRemoveVote = async (songId: string) => {
    // Optimistically update the UI
    const updatedSongs = songs.map(song => {
      if (song.song_id === songId) {
        return { ...song, votes: Math.max(0, song.votes - 1) };
      }
      return song;
    }).sort((a, b) => b.votes - a.votes);
    
    setSongs(updatedSongs);
    
    // Call the API
    try {
      const { error } = await supabase.rpc('remove_vote_for_song', {
        setlist_song_id: songId
      });
      
      if (error) {
        console.error("Error removing vote for song:", error);
        // Fixed toast call
        toast("Failed to remove vote", {
          description: "There was an error removing your vote for this song",
          variant: "destructive",
        });
        
        // Revert the UI
        await refreshSetlist();
      }
    } catch (error) {
      console.error("Error removing vote for song:", error);
      // Fixed toast call
      toast("Failed to remove vote", {
          description: "There was an error removing your vote for this song",
          variant: "destructive",
      });
      
      // Revert the UI
      await refreshSetlist();
    }
  };

  return (
    <div className="space-y-8">
      {/* Setlist Voting */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Setlist Voting</h2>
        
        {/* Voting Stats */}
        <VotingStatsRefactored setlistId={setlist?.id || ''} />
        
        {/* Song List */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-white mb-4">Current Setlist</h3>
          
          {songs.length === 0 ? (
            <Card className="bg-gray-900/40 border-gray-800/50">
              <CardContent className="p-6">
                <p className="text-gray-400">No songs in the setlist yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {songs.map((song, index) => (
                <Card 
                  key={song.song_id} 
                  className="bg-gray-900/40 border-gray-800/50"
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-400">{index + 1}.</span>
                      <div>
                        <h4 className="text-white font-medium">{song.song?.name}</h4>
                        <p className="text-sm text-gray-400">Votes: {song.votes}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handleVote(song.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Vote
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleRemoveVote(song.id)}
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Remove Vote
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      
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
