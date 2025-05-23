
import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/context/AuthContext";
import * as spotifyService from "@/services/spotify";
import * as ticketmasterService from "@/services/ticketmaster";
import AppHeader from "@/components/AppHeader";
import { debounce } from 'lodash';

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [artists, setArtists] = useState<spotifyService.SpotifyArtist[]>([]);
  const [loading, setLoading] = useState(false);

  // Parse query from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q');
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [location.search]);

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      performSearch(searchQuery);
    }
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (query.trim().length > 2) {
        performSearch(query);
      }
    }, 500),
    []
  );

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // Perform search using Spotify API for artists
  const performSearch = async (query: string) => {
    if (!query.trim() || query.trim().length < 2) return;
    
    setLoading(true);
    console.log("Performing search for:", query);

    try {
      // Search Spotify for artists
      const artistResults = await spotifyService.searchArtists(query);
      console.log("Spotify artists search results:", artistResults.length, "artists");
      setArtists(artistResults);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("An error occurred during search");
    } finally {
      setLoading(false);
    }
  };

  // Store artist in database and navigate to their page
  const handleArtistClick = async (artist: spotifyService.SpotifyArtist) => {
    try {
      // Show loading toast
      const loadingToast = toast.loading(`Loading ${artist.name} data...`);
      
      // Store artist in database
      const artistStored = await spotifyService.storeArtistInDatabase(artist);
      
      if (artistStored) {
        // Import the artist's top tracks
        console.log("Importing top tracks for artist:", artist.id);
        const tracks = await spotifyService.getArtistTopTracks(artist.id);
        
        if (tracks && tracks.length > 0) {
          await spotifyService.storeTracksInDatabase(artist.id, tracks);
          console.log(`Stored ${tracks.length} top tracks for ${artist.name}`);
        } else {
          console.warn("No top tracks found for artist");
        }
        
        // Get artist events from Ticketmaster and store them
        console.log("Fetching Ticketmaster events for artist:", artist.name);
        const events = await ticketmasterService.getArtistEvents(artist.name);
        let eventCount = 0;
        
        if (events && events.length > 0) {
          console.log(`Found ${events.length} events for ${artist.name}`);
          
          for (const event of events) {
            if (event._embedded?.venues?.[0]) {
              const venue = event._embedded.venues[0];
              
              // Store venue in database
              await ticketmasterService.storeVenueInDatabase(venue);
              
              // Store show in database
              await ticketmasterService.storeShowInDatabase(event, artist.id, venue.id);
              eventCount++;
            }
          }
          console.log(`Stored ${eventCount} events for ${artist.name}`);
        } else {
          console.log(`No events found for ${artist.name}`);
        }
        
        // Dismiss loading toast
        toast.dismiss(loadingToast);
        
        // Show success toast
        toast.success(
          `${artist.name} data loaded with ${eventCount} upcoming shows`
        );
        
        // Navigate to artist page
        navigate(`/artist/${artist.id}`);
      } else {
        toast.dismiss(loadingToast);
        toast.error(`Failed to load ${artist.name} data`);
      }
    } catch (error) {
      console.error("Error handling artist click:", error);
      toast.error("An error occurred while loading artist data");
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <AppHeader />
      <div className="container mx-auto max-w-7xl px-4 pt-24 pb-16">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="Search for artists..."
              className="w-full py-6 pl-10 pr-4 bg-slate-900/70 border-slate-700 focus:border-white text-lg"
              value={searchQuery}
              onChange={handleInputChange}
            />
          </div>
        </form>
        
        {/* Artist Results */}
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold text-white">Artists</h2>
          </div>
          
          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-400">Searching...</p>
            </div>
          )}
          
          {/* Results */}
          {!loading && searchQuery && artists.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/50 rounded-lg border border-slate-800">
              <Music className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No artists found</h3>
              <p className="text-slate-400 mb-6">
                Try searching by artist name or try another search term
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {artists.map(artist => (
                <Card 
                  key={artist.id}
                  onClick={() => handleArtistClick(artist)}
                  className="bg-slate-900 border-slate-800 overflow-hidden hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 cursor-pointer"
                >
                  <div className="h-48 bg-slate-800 relative">
                    {artist.images && artist.images[0] ? (
                      <img
                        src={artist.images[0].url}
                        alt={artist.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                        <Music className="h-12 w-12 text-slate-600" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-medium text-white">{artist.name}</h3>
                    {artist.genres && artist.genres.length > 0 && (
                      <p className="text-sm text-slate-400 mt-1 truncate">
                        {artist.genres.slice(0, 3).join(", ")}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
