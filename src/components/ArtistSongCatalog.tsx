
import React, { useState, useEffect } from 'react';
import { Search, Music, Loader2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import * as setlistService from "@/services/setlist";
import { useDebounce } from "@/hooks/use-debounce";

interface ArtistSongCatalogProps {
  artistId: string;
  setlistId?: string;
  onAddSong?: (songId: string) => Promise<boolean>;
}

export default function ArtistSongCatalog({ artistId, setlistId, onAddSong }: ArtistSongCatalogProps) {
  const [songs, setSongs] = useState<setlistService.Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    fetchSongs();
  }, [artistId]);
  
  useEffect(() => {
    if (debouncedSearch) {
      searchSongs(debouncedSearch);
    } else {
      fetchSongs();
    }
  }, [debouncedSearch]);
  
  async function fetchSongs() {
    try {
      setLoading(true);
      const popularSongs = await setlistService.getPopularSongsForArtist(artistId, 20);
      setSongs(popularSongs);
    } catch (error) {
      console.error("Error fetching popular songs:", error);
      toast.error("Failed to load artist songs");
    } finally {
      setLoading(false);
    }
  }
  
  async function searchSongs(query: string) {
    try {
      setLoading(true);
      const results = await setlistService.searchArtistSongs(artistId, query);
      setSongs(results);
    } catch (error) {
      console.error("Error searching songs:", error);
    } finally {
      setLoading(false);
    }
  }
  
  async function refreshSongCatalog() {
    try {
      setRefreshing(true);
      toast.info("Refreshing song catalog from Spotify...");
      const success = await setlistService.fetchArtistSongs(artistId);
      
      if (success) {
        toast.success("Song catalog refreshed successfully");
        fetchSongs();
      } else {
        toast.error("Failed to refresh song catalog");
      }
    } catch (error) {
      console.error("Error refreshing catalog:", error);
      toast.error("Failed to refresh song catalog");
    } finally {
      setRefreshing(false);
    }
  }
  
  async function handleAddSong(songId: string) {
    if (!setlistId || !onAddSong) return;
    
    try {
      const success = await onAddSong(songId);
      if (success) {
        toast.success("Song added to setlist");
      } else {
        toast.error("Failed to add song to setlist");
      }
    } catch (error) {
      console.error("Error adding song:", error);
      toast.error("Failed to add song to setlist");
    }
  }
  
  return (
    <Card className="bg-gray-900/40 border-gray-800/50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Artist Song Catalog</h3>
          <Button 
            variant="outline" 
            size="sm"
            className="text-xs"
            onClick={refreshSongCatalog}
            disabled={refreshing}
          >
            {refreshing ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Refreshing...
              </>
            ) : (
              "Refresh Catalog"
            )}
          </Button>
        </div>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search songs..."
            className="pl-10 bg-black/50 border-gray-700 text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="max-h-80 overflow-y-auto pr-1 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 text-cyan-500 animate-spin" />
            </div>
          ) : songs.length === 0 ? (
            <div className="text-center py-8">
              <Music className="h-10 w-10 text-gray-700 mx-auto mb-2" />
              <p className="text-gray-400">No songs found</p>
              <Button
                variant="link"
                className="text-cyan-500 mt-2"
                onClick={refreshSongCatalog}
                disabled={refreshing}
              >
                Import songs from Spotify
              </Button>
            </div>
          ) : (
            <ul className="space-y-2">
              {songs.map((song) => (
                <li 
                  key={song.id}
                  className="flex items-center justify-between bg-gray-800/40 rounded-md p-3"
                >
                  <div>
                    <h4 className="text-white font-medium">{song.name}</h4>
                    <p className="text-sm text-gray-400">{song.album}</p>
                  </div>
                  
                  {setlistId && onAddSong && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="hover:bg-cyan-900/50 hover:text-cyan-300"
                      onClick={() => handleAddSong(song.id)}
                    >
                      Add
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
