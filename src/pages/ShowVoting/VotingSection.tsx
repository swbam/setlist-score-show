import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Music, PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import * as setlistService from "@/services/setlist";
import * as catalogService from "@/services/catalog";
import SongCard from "./SongCard";
import { Setlist, SetlistSong, Show } from "./types";

interface VotingSectionProps {
  setlist: Setlist | null;
  show: Show | null;
  loading: boolean;
  votingError: string | null;
  voteSubmitting: string | null;
  handleVote: (songId: string) => void;
  handleSongAdded: () => void;
  usedVotesCount: number;
  maxFreeVotes: number;
  votesRemaining: number | 'unlimited';
  user: any;
}

const VotingSection = ({ 
  setlist, 
  show,
  loading,
  votingError,
  voteSubmitting,
  handleVote,
  handleSongAdded,
  usedVotesCount,
  maxFreeVotes,
  votesRemaining,
  user
}: VotingSectionProps) => {
  const [selectedSongId, setSelectedSongId] = useState("");
  const [songs, setSongs] = useState<SetlistSong[]>([]);
  const [availableSongs, setAvailableSongs] = useState<any[]>([]);
  const [addingLoading, setAddingLoading] = useState(false);
  const [loadingSongs, setLoadingSongs] = useState(false);
  
  // Load setlist songs on setlist change
  useEffect(() => {
    if (setlist) {
      setSongs(setlist.songs || []);
    }
  }, [setlist]);
  
  // Load ALL available songs for the artist
  useEffect(() => {
    if (show?.artist && show.artist.id) {
      fetchAllArtistSongs();
    }
  }, [show?.artist, songs]);
  
  // Fetch ALL available songs for the artist from the database
  const fetchAllArtistSongs = async () => {
    if (!show?.artist?.id) return;
    
    try {
      setLoadingSongs(true);
      console.log("Fetching all songs for artist:", show.artist.id);
      
      // Use catalog service to get all songs
      const allSongs = await catalogService.getArtistSongCatalog(show.artist.id);
      
      if (allSongs && allSongs.length > 0) {
        console.log(`Fetched ${allSongs.length} songs for artist ${show.artist.name}`);
        
        // Filter out songs that are already in the setlist
        const existingSongIds = songs.map(song => song.song_id);
        const filteredSongs = allSongs.filter(song => !existingSongIds.includes(song.id));
        
        console.log(`${filteredSongs.length} songs available to add (after filtering out existing songs in setlist)`);
        setAvailableSongs(filteredSongs);
      } else {
        console.log("No songs found for artist, initiating catalog sync");
        
        // If no songs found, try to sync the catalog
        const synced = await catalogService.syncArtistCatalog(show.artist.id, true);
        
        if (synced) {
          // Try to fetch songs again after sync
          const syncedSongs = await catalogService.getArtistSongCatalog(show.artist.id);
          
          if (syncedSongs && syncedSongs.length > 0) {
            // Filter out existing songs
            const existingSongIds = songs.map(song => song.song_id);
            const filteredSongs = syncedSongs.filter(song => !existingSongIds.includes(song.id));
            
            setAvailableSongs(filteredSongs);
          } else {
            setAvailableSongs([]);
            toast.error("No songs found for this artist, even after syncing");
          }
        } else {
          setAvailableSongs([]);
          toast.error("Failed to sync artist catalog");
        }
      }
    } catch (error) {
      console.error("Error loading songs:", error);
      toast.error("Failed to load artist songs");
    } finally {
      setLoadingSongs(false);
    }
  };

  // Function to add a song to the setlist
  const addSong = async () => {
    if (!setlist || !selectedSongId) return false;
    
    try {
      setAddingLoading(true);
      const success = await setlistService.addSongToSetlist(setlist.id, selectedSongId);
      if (success) {
        handleSongAdded();
        toast.success("Song added to setlist");
        setSelectedSongId(""); // Reset selection
        // Refresh available songs to exclude newly added ones
        await fetchAllArtistSongs();
      } else {
        toast.error("Failed to add song. It might already be in the setlist.");
      }
      return success;
    } catch (error) {
      console.error("Error adding song:", error);
      toast.error("Failed to add song");
      return false;
    } finally {
      setAddingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="lg:col-span-2 space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-800 rounded w-2/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-2 space-y-8">
      {/* Setlist Voting Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">What do you want to hear?</h2>
        <p className="text-gray-400">Vote for songs you want to hear at this show</p>
      </div>

      {/* Voting Stats */}
      {user && (
        <Card className="bg-yellow-metal-950/50 border-yellow-metal-800">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <span className="text-white">
                  Votes used: <span className="font-bold text-yellow-metal-300">{usedVotesCount}</span>
                  {votesRemaining !== 'unlimited' && (
                    <span className="text-gray-400">/{maxFreeVotes}</span>
                  )}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-white">
                  Remaining: <span className="font-bold text-yellow-metal-300">
                    {votesRemaining === 'unlimited' ? 'Unlimited' : votesRemaining}
                  </span>
                </span>
              </div>
              {!user && (
                <Button 
                  variant="link" 
                  className="text-yellow-metal-300"
                  onClick={() => window.location.href = "/login"}
                >
                  Sign in for more votes
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Setlist */}
      <div className="space-y-4">
        {songs.length === 0 ? (
          <Card className="bg-gray-900/40 border-gray-800/50">
            <CardContent className="p-6">
              <div className="flex flex-col items-center py-6">
                <Music className="h-12 w-12 text-gray-700 mb-3" />
                <p className="text-gray-400 mb-2 text-center">No songs in the setlist yet</p>
              </div>
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
                isDisabled={!user || (votesRemaining !== 'unlimited' && votesRemaining === 0)}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Add Song Section - Dropdown with ALL artist songs */}
      {show?.artist && (
        <div className="mt-8 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
          <h3 className="text-lg font-medium text-white mb-4">Add a song to this setlist:</h3>
          
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="song-select" className="text-gray-300">Select a song</Label>
              <Select 
                value={selectedSongId} 
                onValueChange={setSelectedSongId}
                disabled={loadingSongs}
              >
                <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder={loadingSongs ? "Loading songs..." : "Select a song"} />
                </SelectTrigger>
                <SelectContent 
                  className="bg-gray-800 border-gray-700 text-white"
                  position="popper"
                  sideOffset={5}
                  align="start"
                  side="bottom"
                >
                  <div className="max-h-[300px] overflow-y-auto">
                    {availableSongs.map((song) => (
                      <SelectItem key={song.id} value={song.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{song.name}</span>
                          {song.album && <span className="text-xs text-gray-400">{song.album}</span>}
                        </div>
                      </SelectItem>
                    ))}
                    {availableSongs.length === 0 && !loadingSongs && (
                      <div className="p-4 text-center text-gray-400">
                        <Music className="h-6 w-6 mx-auto mb-2" />
                        <p>No songs available for this artist</p>
                        <p className="text-xs mt-1">Try refreshing to import songs from Spotify</p>
                      </div>
                    )}
                    {loadingSongs && (
                      <div className="p-4 text-center text-gray-400">
                        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p>Loading songs...</p>
                      </div>
                    )}
                  </div>
                </SelectContent>
              </Select>
            </div>
            
            <Button
              type="button"
              onClick={addSong}
              disabled={!selectedSongId || addingLoading}
              className="w-full"
            >
              {addingLoading ? (
                <div className="h-4 w-4 border-2 border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <PlusCircle className="h-4 w-4 mr-2" />
              )}
              Add to Setlist
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VotingSection;
