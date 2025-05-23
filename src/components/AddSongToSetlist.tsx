
import { useState } from "react";
import { Plus, Search, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/sonner";
import * as setlistService from "@/services/setlist";
import { Song } from "@/services/setlist";

interface AddSongToSetlistProps {
  setlistId: string;
  artistId: string;
  onSongAdded?: () => void;
}

const AddSongToSetlist = ({ setlistId, artistId, onSongAdded }: AddSongToSetlistProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    
    if (isOpen) {
      // Fetch artist songs when dialog opens
      fetchArtistSongs();
    } else {
      // Reset state when dialog closes
      setSearchQuery("");
    }
  };

  const fetchArtistSongs = async () => {
    setLoading(true);
    try {
      const artistSongs = await setlistService.getArtistSongs(artistId);
      setSongs(artistSongs);
      setFilteredSongs(artistSongs);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching artist songs:", error);
      toast.error("Could not load artist songs");
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredSongs(songs);
      return;
    }
    
    const filtered = songs.filter(song => 
      song.name.toLowerCase().includes(query) || 
      song.album.toLowerCase().includes(query)
    );
    
    setFilteredSongs(filtered);
  };

  const handleAddSong = async (song: Song) => {
    try {
      const success = await setlistService.addSongToSetlist(setlistId, song.id);
      
      if (success) {
        toast.success(`Added "${song.name}" to setlist`);
        setOpen(false);
        if (onSongAdded) onSongAdded();
      } else {
        toast.error("Failed to add song to setlist");
      }
    } catch (error) {
      console.error("Error adding song to setlist:", error);
      toast.error("An error occurred while adding song to setlist");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="border-slate-700 text-white hover:bg-slate-800"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add to Setlist
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-black border-slate-800 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add a song to the setlist</DialogTitle>
        </DialogHeader>
        
        {/* Search input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Search songs by name or album..."
            className="pl-9 bg-slate-900 border-slate-700"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        
        {/* Song list */}
        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-slate-400 text-sm">Loading songs...</p>
          </div>
        ) : filteredSongs.length === 0 ? (
          <div className="text-center py-8">
            <Music className="h-12 w-12 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400">No songs found</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {filteredSongs.map(song => (
                <div 
                  key={song.id}
                  className="flex items-center justify-between p-3 rounded-md bg-slate-900 hover:bg-slate-800 transition-colors"
                >
                  <div>
                    <p className="font-medium text-white">{song.name}</p>
                    <p className="text-sm text-slate-400">{song.album}</p>
                  </div>
                  <Button 
                    size="sm"
                    className="bg-white text-black hover:bg-slate-200"
                    onClick={() => handleAddSong(song)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddSongToSetlist;
