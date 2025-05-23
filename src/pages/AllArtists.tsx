
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Music, Search, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import AppHeader from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";
import * as spotifyService from "@/services/spotify";
import * as ticketmasterService from "@/services/ticketmaster";

interface Artist {
  id: string;
  name: string;
  image_url?: string;
  genres?: string[];
  popularity?: number;
  source?: 'database' | 'ticketmaster';
}

const AllArtists = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchPerformed, setSearchPerformed] = useState(false);
  
  // Fetch artists on page load
  useEffect(() => {
    fetchCombinedArtists();
  }, []);
  
  // Fetch both database and Ticketmaster artists
  const fetchCombinedArtists = async () => {
    setLoading(true);
    
    try {
      // Fetch from database first
      const { data: dbArtists, error } = await supabase
        .from("artists")
        .select("*")
        .order("popularity", { ascending: false })
        .limit(15);
        
      if (error) {
        throw error;
      }
      
      // Mark database artists
      const dbArtistsWithSource = (dbArtists || []).map(artist => ({
        ...artist,
        source: 'database' as const
      }));
      
      // Fetch from Ticketmaster API for popular events
      const events = await ticketmasterService.getPopularEvents(20);
      
      // Extract unique artists from events
      const tmArtists = events
        .filter(event => event._embedded?.attractions?.[0])
        .map(event => {
          const attraction = event._embedded?.attractions?.[0];
          if (!attraction) return null;
          
          // Find a suitable image
          let imageUrl = null;
          if (attraction.images && attraction.images.length > 0) {
            const wideImage = attraction.images.find(img => img.ratio === '16_9');
            imageUrl = wideImage ? wideImage.url : attraction.images[0].url;
          }
          
          return {
            id: attraction.id || `tm-${attraction.name}`,
            name: attraction.name,
            image_url: imageUrl,
            genres: [],
            popularity: 0,
            source: 'ticketmaster' as const
          };
        })
        .filter(Boolean) as Artist[];
      
      // Deduplicate artists (prefer database entries)
      const dbArtistNames = new Set(dbArtistsWithSource.map(a => a.name.toLowerCase()));
      const uniqueTmArtists = tmArtists.filter(a => !dbArtistNames.has(a.name.toLowerCase()));
      
      // Combine and set
      const combinedArtists = [...dbArtistsWithSource, ...uniqueTmArtists];
      setArtists(combinedArtists);
    } catch (error) {
      console.error("Error fetching artists:", error);
      toast.error("Failed to load artists");
    } finally {
      setLoading(false);
    }
  };
  
  // Perform search when user submits form
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      fetchCombinedArtists();
      return;
    }
    
    setLoading(true);
    setSearchPerformed(true);
    
    try {
      // Search Spotify for artists
      const spotifyArtists = await spotifyService.searchArtists(searchQuery);
      
      // Search Ticketmaster for artists with events
      const events = await ticketmasterService.searchEvents(searchQuery);
      
      // Extract unique artists from events
      const tmArtists = events
        .filter(event => event._embedded?.attractions?.[0])
        .map(event => {
          const attraction = event._embedded?.attractions?.[0];
          if (!attraction) return null;
          
          let imageUrl = null;
          if (attraction.images && attraction.images.length > 0) {
            const wideImage = attraction.images.find(img => img.ratio === '16_9');
            imageUrl = wideImage ? wideImage.url : attraction.images[0].url;
          }
          
          return {
            id: attraction.id || `tm-${attraction.name}`,
            name: attraction.name,
            image_url: imageUrl,
            genres: [],
            popularity: 0,
            source: 'ticketmaster' as const
          };
        })
        .filter(Boolean) as Artist[];
      
      // Convert Spotify artists to our format
      const formattedSpotifyArtists = spotifyArtists.map(artist => ({
        id: artist.id,
        name: artist.name,
        image_url: artist.images && artist.images.length > 0 ? artist.images[0].url : undefined,
        genres: artist.genres || [],
        popularity: artist.popularity || 0,
        source: 'database' as const
      }));
      
      // Combine and deduplicate artists
      const combinedArtists = mergeArtists([...formattedSpotifyArtists, ...tmArtists]);
      setArtists(combinedArtists);
    } catch (error) {
      console.error("Error searching artists:", error);
      toast.error("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to deduplicate artists by name
  const mergeArtists = (artistArray: Artist[]): Artist[] => {
    const artistMap = new Map<string, Artist>();
    
    artistArray.forEach(artist => {
      const key = artist.name.toLowerCase();
      // Prefer database artists over ticketmaster ones
      if (!artistMap.has(key) || artist.source === 'database') {
        artistMap.set(key, artist);
      }
    });
    
    return Array.from(artistMap.values());
  };
  
  // Reset search and show all artists
  const handleReset = () => {
    setSearchQuery("");
    setSearchPerformed(false);
    fetchCombinedArtists();
  };
  
  // Filter artists by search query
  const filteredArtists = searchPerformed 
    ? artists 
    : (searchQuery
        ? artists.filter(artist => 
            artist.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : artists);
  
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
            <form onSubmit={handleSearch} className="relative flex-1 md:flex-none md:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Search artists..."
                className="pl-10 bg-gray-900 border-gray-800"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            
            <Button
              variant="outline"
              className="border-gray-700 text-gray-300"
              onClick={handleReset}
              type="button"
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
              <Card 
                key={artist.id}
                className="bg-gray-900 border-gray-800 overflow-hidden hover:border-cyan-500 transition-all duration-300 group"
              >
                <Link to={`/artist/${artist.id}`}>
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
                    
                    {/* Source badge */}
                    <div className="absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded-full bg-black/70 text-white">
                      {artist.source === 'database' ? 'Imported' : 'Ticketmaster'}
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="text-white font-medium truncate">{artist.name}</h3>
                    {artist.genres && artist.genres.length > 0 && (
                      <p className="text-sm text-gray-400 truncate">
                        {artist.genres.slice(0, 2).join(", ")}
                      </p>
                    )}
                  </CardContent>
                </Link>
              </Card>
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
                onClick={handleReset}
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
