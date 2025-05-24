
import { useState, useEffect } from "react";
import { Search, Music } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import * as setlistService from "@/services/setlist";

interface AddSongToSetlistProps {
  artistId: string;
  setlistId: string;
  onAddSong: (songId: string) => Promise<boolean>;
  onSongAdded?: () => Promise<void>; // Make this optional
}

export default function AddSongToSetlist({ 
  artistId, 
  setlistId, 
  onAddSong,
  onSongAdded 
}: AddSongToSetlistProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [songs, setSongs] = useState<setlistService.Song[]>([]);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  useEffect(() => {
    if (debouncedSearchQuery) {
      searchSongs(debouncedSearchQuery);
    } else {
      loadPopularSongs();
    }
  }, [debouncedSearchQuery, artistId]);
  
  async function loadPopularSongs() {
    try {
      setSearching(true);
      const popularSongs = await setlistService.getPopularSongsForArtist(artistId);
      setSongs(popularSongs);
    } catch (error) {
      console.error("Error loading popular songs:", error);
    } finally {
      setSearching(false);
    }
  }
  
  async function searchSongs(query: string) {
    if (!query) return;
    
    try {
      setSearching(true);
      const results = await setlistService.searchArtistSongs(artistId, query);
      setSongs(results);
    } catch (error) {
      console.error("Error searching songs:", error);
    } finally {
      setSearching(false);
    }
  }
  
  const handleAddSong = async (songId: string) => {
    const success = await onAddSong(songId);
    
    if (success) {
      toast({
        title: "Song added to setlist",
        description: "Your song has been added to the setlist",
      });
      // Call onSongAdded if it exists
      if (onSongAdded) {
        await onSongAdded();
      }
    } else {
      toast({
        title: "Failed to add song",
        description: "The song may already be in the setlist",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search for songs..."
          className="pl-9 bg-gray-950/40 border-gray-800"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar">
        {searching ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : songs.length === 0 ? (
          <div className="text-center py-8">
            <Music className="h-10 w-10 text-gray-700 mx-auto mb-2" />
            <p className="text-gray-400 mb-2">No songs found</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setlistService.fetchArtistSongs(artistId).then(() => loadPopularSongs())}
            >
              Import songs from Spotify
            </Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {songs.map((song) => (
              <li 
                key={song.id} 
                className="flex justify-between items-center bg-gray-800/30 rounded-md p-3"
              >
                <div>
                  <h4 className="text-white text-sm font-medium">{song.name}</h4>
                  <p className="text-xs text-gray-400">{song.album}</p>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="text-xs hover:bg-cyan-900/30 hover:text-cyan-300"
                  onClick={() => handleAddSong(song.id)}
                >
                  Add
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
