
import React, { useState, useEffect } from "react";
import { Search, Music, Plus, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { getArtistSongCatalog, syncArtistCatalog } from "@/services/catalog";

interface ArtistCatalogProps {
  artistId: string;
  onSongSelect?: (song: any) => void;
}

const ArtistCatalog: React.FC<ArtistCatalogProps> = ({ artistId, onSongSelect }) => {
  const [songs, setSongs] = useState<any[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSongs();
  }, [artistId]);

  useEffect(() => {
    filterSongs();
  }, [searchQuery, songs]);

  const fetchSongs = async () => {
    setLoading(true);
    const songData = await getArtistSongCatalog(artistId);
    setSongs(songData);
    setLoading(false);
  };

  const filterSongs = () => {
    if (!searchQuery.trim()) {
      setFilteredSongs(songs);
      return;
    }

    const filtered = songs.filter(song => 
      song.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.album.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setFilteredSongs(filtered);
  };

  const handleSync = async () => {
    setSyncing(true);
    toast({
      title: "Syncing catalog",
      description: "Fetching latest songs from Spotify...",
    });
    
    const success = await syncArtistCatalog(artistId, true);
    
    if (success) {
      toast({
        title: "Catalog updated",
        description: "Artist's song catalog has been refreshed",
      });
      fetchSongs();
    } else {
      toast({
        title: "Sync failed",
        description: "Could not update the song catalog",
        variant: "destructive",
      });
    }
    
    setSyncing(false);
  };

  const handleSongClick = (song: any) => {
    if (onSongSelect) {
      onSongSelect(song);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="text-xl font-semibold text-white">Song Catalog</h3>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search songs..."
              className="pl-10 bg-gray-900 border-gray-800"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
            className="whitespace-nowrap border-gray-700"
          >
            <Music className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Sync Catalog
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-2 w-full">
                    <Skeleton className="h-5 w-3/4 bg-gray-800" />
                    <Skeleton className="h-4 w-1/2 bg-gray-800" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredSongs.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-gray-700 rounded-lg">
          <AlertCircle className="h-12 w-12 text-gray-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No songs found</h3>
          <p className="text-gray-400 mb-4">
            {songs.length === 0 
              ? "This artist doesn't have any songs in our database yet." 
              : "No songs match your search query."}
          </p>
          {songs.length === 0 && (
            <Button onClick={handleSync} disabled={syncing}>
              <Music className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              Import Songs
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSongs.map((song) => (
            <Card 
              key={song.id}
              className="bg-gray-900 border-gray-800 hover:border-cyan-700 transition-colors"
              onClick={() => handleSongClick(song)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-white font-medium line-clamp-1">{song.name}</h4>
                    <p className="text-sm text-gray-400">{song.album}</p>
                  </div>
                  
                  {onSongSelect && (
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ArtistCatalog;
