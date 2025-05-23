
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
    fetchTopArtistsWithUpcomingShows();
  }, []);
  
  // Fetch top artists with upcoming shows from Ticketmaster
  const fetchTopArtistsWithUpcomingShows = async () => {
    setLoading(true);
    
    try {
      // Get popular events from Ticketmaster API
      const events = await ticketmasterService.getPopularEvents(50);
      console.log(`Found ${events.length} popular events`);
      
      // Extract unique artists from events
      const artistMap = new Map<string, Artist>();
      
      for (const event of events) {
        const attractions = event._embedded?.attractions;
        if (!attractions) continue;
        
        // Process each artist/attraction
        for (const attraction of attractions) {
          if (!attraction || !attraction.name) continue;
          
          // Skip if we already processed this artist
          const artistKey = attraction.name.toLowerCase();
          if (artistMap.has(artistKey)) continue;
          
          // Find a suitable image
          let imageUrl = null;
          if (attraction.images && attraction.images.length > 0) {
            const wideImage = attraction.images.find(img => img.ratio === '16_9');
            imageUrl = wideImage ? wideImage.url : attraction.images[0].url;
          }
          
          const artist: Artist = {
            id: attraction.id || `tm-${attraction.name}`,
            name: attraction.name,
            image_url: imageUrl,
            genres: [],
            popularity: 0,
            source: 'ticketmaster' as const
          };
          
          artistMap.set(artistKey, artist);
          
          // Store the artist in Supabase
          await storeArtistInDatabase(artist);
        }
      }
      
      // Get the unique artists
      const uniqueArtists = Array.from(artistMap.values());
      console.log(`Extracted ${uniqueArtists.length} unique artists`);
      
      // Mix in any artists from the database that aren't already in the list
      const { data: dbArtists, error } = await supabase
        .from("artists")
        .select("*")
        .order("popularity", { ascending: false })
        .limit(40);
      
      if (!error && dbArtists) {
        console.log(`Found ${dbArtists.length} artists in database`);
        
        // Add database artists that aren't already in our map
        for (const dbArtist of dbArtists) {
          const artistKey = dbArtist.name.toLowerCase();
          if (!artistMap.has(artistKey)) {
            artistMap.set(artistKey, {
              ...dbArtist,
              source: 'database' as const
            });
          }
        }
      }
      
      // Final list of unique artists, sorted by source (database first) then name
      const finalArtists = Array.from(artistMap.values()).sort((a, b) => {
        // Database artists come first
        if (a.source === 'database' && b.source !== 'database') return -1;
        if (a.source !== 'database' && b.source === 'database') return 1;
        
        // Then sort by name
        return a.name.localeCompare(b.name);
      });
      
      setArtists(finalArtists);
    } catch (error) {
      console.error("Error fetching artists with upcoming shows:", error);
      toast.error("Failed to load artists");
    } finally {
      setLoading(false);
    }
  };
  
  // Store artist in Supabase database
  const storeArtistInDatabase = async (artist: Artist): Promise<boolean> => {
    try {
      // Skip if no valid ID
      if (!artist.id) return false;
      
      // Check if artist exists in database
      const { data: existingArtist } = await supabase
        .from('artists')
        .select('id')
        .eq('id', artist.id)
        .maybeSingle();
      
      if (existingArtist) {
        console.log(`Artist ${artist.name} already exists in database`);
        return true; // Artist already exists
      }
      
      // Create artist in database with minimal information
      // Later sync processes can fetch more details from Spotify
      const { error } = await supabase
        .from('artists')
        .insert({
          id: artist.id,
          name: artist.name,
          image_url: artist.image_url || null,
          genres: artist.genres || [],
          popularity: artist.popularity || 0,
          spotify_url: null,
          last_synced_at: new Date().toISOString()
        });
      
      if (error) {
        console.error(`Error storing artist ${artist.name}:`, error);
        return false;
      }
      
      console.log(`Successfully stored artist ${artist.name} in database`);
      return true;
    } catch (error) {
      console.error(`Error storing artist ${artist.name}:`, error);
      return false;
    }
  };
  
  // Perform search when user submits form
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      fetchTopArtistsWithUpcomingShows();
      return;
    }
    
    setLoading(true);
    setSearchPerformed(true);
    
    try {
      // Search Ticketmaster for artists with events
      const events = await ticketmasterService.searchEvents(searchQuery);
      console.log(`Found ${events.length} events matching "${searchQuery}"`);
      
      // Extract unique artists from events
      const artistMap = new Map<string, Artist>();
      
      for (const event of events) {
        const attractions = event._embedded?.attractions;
        if (!attractions) continue;
        
        for (const attraction of attractions) {
          if (!attraction || !attraction.name) continue;
          
          const artistKey = attraction.name.toLowerCase();
          if (artistMap.has(artistKey)) continue;
          
          let imageUrl = null;
          if (attraction.images && attraction.images.length > 0) {
            const wideImage = attraction.images.find(img => img.ratio === '16_9');
            imageUrl = wideImage ? wideImage.url : attraction.images[0].url;
          }
          
          const artist: Artist = {
            id: attraction.id || `tm-${attraction.name}`,
            name: attraction.name,
            image_url: imageUrl,
            genres: [],
            popularity: 0,
            source: 'ticketmaster' as const
          };
          
          artistMap.set(artistKey, artist);
          
          // Store the artist in Supabase
          await storeArtistInDatabase(artist);
        }
      }
      
      // Also search for artists in our database
      const { data: dbArtists } = await supabase
        .from("artists")
        .select("*")
        .ilike("name", `%${searchQuery}%`)
        .limit(20);
        
      if (dbArtists) {
        for (const dbArtist of dbArtists) {
          const artistKey = dbArtist.name.toLowerCase();
          if (!artistMap.has(artistKey)) {
            artistMap.set(artistKey, {
              ...dbArtist,
              source: 'database' as const
            });
          }
        }
      }
      
      // Convert to array and sort
      const searchResults = Array.from(artistMap.values()).sort((a, b) => {
        // Database artists come first
        if (a.source === 'database' && b.source !== 'database') return -1;
        if (a.source !== 'database' && b.source === 'database') return 1;
        
        // Then sort by how well the name matches the search query
        const aStartsWith = a.name.toLowerCase().startsWith(searchQuery.toLowerCase());
        const bStartsWith = b.name.toLowerCase().startsWith(searchQuery.toLowerCase());
        
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        
        // Finally sort by name
        return a.name.localeCompare(b.name);
      });
      
      setArtists(searchResults);
    } catch (error) {
      console.error("Error searching artists:", error);
      toast.error("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Reset search and show all artists
  const handleReset = () => {
    setSearchQuery("");
    setSearchPerformed(false);
    fetchTopArtistsWithUpcomingShows();
  };
  
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
        ) : artists.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {artists.map(artist => (
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
