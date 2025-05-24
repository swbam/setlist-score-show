
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
  show: Show | null;
  artist: any; // Accept any artist format
  setlist: Setlist | null;
  onRefresh: () => Promise<void>;
  voteSubmitting: string | null;
  handleVote: (songId: string) => void;
  votesRemaining: number | 'Unlimited';
  usedVotesCount: number;
  maxFreeVotes: number;
}

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
  const [selectedSongId, setSelectedSongId] = useState("");
  const [songs, setSongs] = useState<SetlistSong[]>([]);
  const [availableSongs, setAvailableSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSongs, setLoadingSongs] = useState(false);
  
  // Load setlist songs on setlist change
  useEffect(() => {
    if (setlist) {
      setSongs(setlist.songs || []);
    }
  }, [setlist]);
  
  // Load ALL available songs for the artist
  useEffect(() => {
    if (artist && artist.id) {
      fetchAllArtistSongs();
    }
  }, [artist, songs]);
  
  // Fetch ALL available songs for the artist from the database
  const fetchAllArtistSongs = async () => {
    if (!artist?.id) return;
    
    try {
      setLoadingSongs(true);
      console.log("Fetching all songs for artist:", artist.id);
      
      // Use catalog service to get all songs
      const allSongs = await catalogService.getArtistSongCatalog(artist.id);
      
      if (allSongs && allSongs.length > 0) {
        console.log(`Fetched ${allSongs.length} songs for artist ${artist.name}`);
        
        // Filter out songs that are already in the setlist
        const existingSongIds = songs.map(song => song.song_id);
        const filteredSongs = allSongs.filter(song => !existingSongIds.includes(song.id));
        
        console.log(`${filteredSongs.length} songs available to add (after filtering out existing songs in setlist)`);
        setAvailableSongs(filteredSongs);
      } else {
        console.log("No songs found for artist, initiating catalog sync");
        
        // If no songs found, try to sync the catalog
        const synced = await catalogService.syncArtistCatalog(artist.id, true);
        
        if (synced) {
          // Try to fetch songs again after sync
          const syncedSongs = await catalogService.getArtistSongCatalog(artist.id);
          
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
  
  // Refresh setlist data
  const refreshSetlist = useCallback(async () => {
    setLoading(true);
    await onRefresh();
    await fetchAllArtistSongs(); // Refresh available songs to exclude newly added ones
    setLoading(false);
  }, [onRefresh]);

  // Function to add a song to the setlist
  const addSong = async () => {
    if (!setlist || !selectedSongId) return false;
    
    try {
      setLoading(true);
      const success = await setlistService.addSongToSetlist(setlist.id, selectedSongId);
      if (success) {
        await refreshSetlist();
        toast.success("Song added to setlist");
        setSelectedSongId(""); // Reset selection
      } else {
        toast.error("Failed to add song. It might already be in the setlist.");
      }
      return success;
    } catch (error) {
      console.error("Error adding song:", error);
      toast.error("Failed to add song");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Setlist Voting Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">What do you want to hear?</h2>
        <p className="text-gray-400">Vote for songs you want to hear at this show</p>
      </div>

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
      
      {/* Add Song Section - Dropdown with ALL artist songs */}
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
            disabled={!selectedSongId || loading}
            className="w-full"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <PlusCircle className="h-4 w-4 mr-2" />
            )}
            Add to Setlist
          </Button>
        </div>
      </div>
    </div>
  );
}
