
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Music, Search, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import AppHeader from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";

interface Artist {
  id: string;
  name: string;
  image_url?: string;
  genres?: string[];
  popularity?: number;
}

const AllArtists = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch artists on page load
  useEffect(() => {
    fetchArtists();
  }, []);
  
  // Fetch artists from database
  const fetchArtists = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from("artists")
        .select("*")
        .order("popularity", { ascending: false })
        .limit(30);
        
      if (error) {
        throw error;
      }
      
      setArtists(data || []);
    } catch (error) {
      console.error("Error fetching artists:", error);
      toast.error("Failed to load artists");
    } finally {
      setLoading(false);
    }
  };
  
  // Filter artists by search query
  const filteredArtists = searchQuery
    ? artists.filter(artist => 
        artist.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : artists;
  
  return (
    <div className="min-h-screen bg-black">
      <AppHeader />
      
      <div className="container mx-auto max-w-7xl px-4 pt-24 pb-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">All Artists</h1>
            <p className="text-gray-400">Browse artists with upcoming shows</p>
          </div>
          
          <div className="w-full md:w-auto flex gap-4">
            <div className="relative flex-1 md:flex-none md:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Search artists..."
                className="pl-10 bg-gray-900 border-gray-800"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Button
              variant="outline"
              className="border-gray-700 text-gray-300"
              onClick={fetchArtists}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <Card key={i} className="bg-gray-900 border-gray-800 animate-pulse">
                <div className="h-40 bg-gray-800" />
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-800 rounded mb-2" />
                  <div className="h-3 bg-gray-800 rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredArtists.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {filteredArtists.map(artist => (
              <Link to={`/artist/${artist.id}`} key={artist.id}>
                <Card className="bg-gray-900 border-gray-800 overflow-hidden hover:border-cyan-500 transition-all duration-300">
                  <div className="h-40 bg-gray-800 relative">
                    {artist.image_url ? (
                      <img
                        src={artist.image_url}
                        alt={artist.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                        <Music className="h-8 w-8 text-gray-600" />
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="text-white font-medium truncate">{artist.name}</h3>
                    {artist.genres && artist.genres.length > 0 && (
                      <p className="text-sm text-gray-400 truncate">
                        {artist.genres.slice(0, 2).join(", ")}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-900/50 rounded-lg border border-gray-800">
            <Music className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No artists found</h3>
            <p className="text-gray-400 mb-6">
              {searchQuery ? "Try a different search term" : "No artists available yet"}
            </p>
            {searchQuery && (
              <Button 
                className="bg-cyan-600 hover:bg-cyan-700"
                onClick={() => setSearchQuery("")}
              >
                Show All Artists
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllArtists;
