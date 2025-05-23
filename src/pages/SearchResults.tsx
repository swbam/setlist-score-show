
import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Music, MapPin, Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [events, setEvents] = useState<ticketmasterService.TicketmasterEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("artists");

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
    }, 300),
    []
  );

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // Perform search using APIs
  const performSearch = async (query: string) => {
    if (!query.trim() || query.trim().length < 2) return;
    
    setLoading(true);
    console.log("Performing search for:", query);

    try {
      // Search Spotify for artists
      const artistResults = await spotifyService.searchArtists(query);
      console.log("Spotify artists search results:", artistResults.length, "artists");
      setArtists(artistResults);
      
      // Search Ticketmaster for events
      const eventResults = await ticketmasterService.searchEvents(query);
      console.log("Ticketmaster events search results:", eventResults.length, "events");
      setEvents(eventResults);
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
        // Import the full artist catalog to ensure we have all songs
        console.log("Importing full catalog for artist:", artist.id);
        const catalogImported = await spotifyService.importArtistCatalog(artist.id);
        
        if (catalogImported) {
          console.log("Successfully imported artist catalog");
        } else {
          console.warn("Could not import full catalog, trying to get top tracks instead");
          // Fallback to top tracks if full catalog fails
          const tracks = await spotifyService.getArtistTopTracks(artist.id);
          if (tracks && tracks.length > 0) {
            await spotifyService.storeTracksInDatabase(artist.id, tracks);
          }
        }
        
        // Get artist events from Ticketmaster and store them
        console.log("Fetching Ticketmaster events for artist:", artist.name);
        const events = await ticketmasterService.getArtistEvents(artist.name);
        let eventCount = 0;
        
        if (events && events.length > 0) {
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

  // Handle event click
  const handleEventClick = async (event: ticketmasterService.TicketmasterEvent) => {
    try {
      if (!event._embedded?.venues?.[0] || !event._embedded?.attractions?.[0]) {
        toast.error("Incomplete event data");
        return;
      }
      
      const venue = event._embedded.venues[0];
      const attraction = event._embedded.attractions[0];
      
      // Show loading toast
      const loadingToast = toast.loading(`Loading ${event.name} data...`);
      
      // Get attraction details from Spotify
      const artistResults = await spotifyService.searchArtists(attraction.name);
      if (artistResults.length === 0) {
        toast.dismiss(loadingToast);
        toast.error("Artist not found in Spotify");
        return;
      }
      
      const artist = artistResults[0];
      
      // Store artist in database
      await spotifyService.storeArtistInDatabase(artist);
      
      // Import full artist catalog
      console.log("Importing full catalog for artist:", artist.id);
      const catalogImported = await spotifyService.importArtistCatalog(artist.id);
      
      if (!catalogImported) {
        console.warn("Could not import full catalog, trying to get top tracks instead");
        // Fallback to top tracks if full catalog fails
        const tracks = await spotifyService.getArtistTopTracks(artist.id);
        if (tracks && tracks.length > 0) {
          await spotifyService.storeTracksInDatabase(artist.id, tracks);
        }
      }
      
      // Store venue in database
      await ticketmasterService.storeVenueInDatabase(venue);
      
      // Store show in database
      const showStored = await ticketmasterService.storeShowInDatabase(event, artist.id, venue.id);
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      if (showStored) {
        // Show success toast
        toast.success(`${event.name} data loaded successfully`);
        
        // Navigate to show page
        navigate(`/show/${event.id}`);
      } else {
        toast.error(`Failed to load ${event.name} data`);
      }
    } catch (error) {
      console.error("Error handling event click:", error);
      toast.error("An error occurred while loading event data");
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <AppHeader />
      <div className="container mx-auto max-w-7xl px-4 pt-24 pb-16">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search for artists, shows, or venues..."
              className="w-full py-6 pl-10 pr-4 bg-gray-900/70 border-gray-700 focus:border-cyan-500 text-lg"
              value={searchQuery}
              onChange={handleInputChange}
            />
          </div>
        </form>
        
        {/* Results Tabs */}
        <Tabs
          defaultValue="artists"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <div className="flex justify-between items-center mb-2">
            <TabsList className="bg-gray-900/60 border border-gray-800">
              <TabsTrigger value="artists" className="data-[state=active]:bg-cyan-600">
                Artists
              </TabsTrigger>
              <TabsTrigger value="shows" className="data-[state=active]:bg-cyan-600">
                Shows
              </TabsTrigger>
            </TabsList>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-gray-700 text-gray-300">
                  Sort By <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800">
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-800">Relevance</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-800">Date (Upcoming)</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-800">Popularity</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-gray-800">Name (A-Z)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Searching...</p>
            </div>
          )}
          
          {/* Artists Tab */}
          <TabsContent value="artists">
            {!loading && searchQuery && artists.length === 0 ? (
              <div className="text-center py-16 bg-gray-900/50 rounded-lg border border-gray-800">
                <Music className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">No artists found</h3>
                <p className="text-gray-400 mb-6">
                  Try searching by artist name or try another search term
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {artists.map(artist => (
                  <Card 
                    key={artist.id}
                    onClick={() => handleArtistClick(artist)}
                    className="bg-gray-900 border-gray-800 overflow-hidden hover:border-cyan-600/50 transition-all duration-300 cursor-pointer"
                  >
                    <div className="h-48 bg-gray-800 relative">
                      {artist.images && artist.images[0] ? (
                        <img
                          src={artist.images[0].url}
                          alt={artist.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                          <Music className="h-12 w-12 text-gray-600" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="text-lg font-medium text-white">{artist.name}</h3>
                      {artist.genres && artist.genres.length > 0 && (
                        <p className="text-sm text-gray-400 mt-1 truncate">
                          {artist.genres.slice(0, 3).join(", ")}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Shows Tab */}
          <TabsContent value="shows">
            {!loading && searchQuery && events.length === 0 ? (
              <div className="text-center py-16 bg-gray-900/50 rounded-lg border border-gray-800">
                <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">No shows found</h3>
                <p className="text-gray-400 mb-6">
                  Try searching by artist name or venue
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map(event => {
                  // Check if event has required data
                  if (!event._embedded?.venues?.[0] || !event.dates?.start?.dateTime) {
                    return null; // Skip events without venue or date
                  }
                  
                  const venue = event._embedded.venues[0];
                  const eventDate = new Date(event.dates.start.dateTime);
                  
                  return (
                    <Card 
                      key={event.id}
                      className="bg-gray-900/50 border-gray-800 hover:border-cyan-600/50 transition-all duration-300 cursor-pointer"
                      onClick={() => handleEventClick(event)}
                    >
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between p-6">
                          <div className="flex-grow space-y-2">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                event.dates.status?.code === 'cancelled' ? 'bg-red-900/50 text-red-300' :
                                event.dates.status?.code === 'postponed' ? 'bg-yellow-900/50 text-yellow-300' :
                                'bg-green-900/50 text-green-300'
                              }`}>
                                {event.dates.status?.code === 'cancelled' ? 'Canceled' :
                                 event.dates.status?.code === 'postponed' ? 'Postponed' :
                                'Upcoming'}
                              </span>
                              <h3 className="text-lg font-semibold text-white">
                                {event.name}
                              </h3>
                            </div>
                            
                            <div className="flex flex-col space-y-2 text-gray-400">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-cyan-500" />
                                <span>{format(eventDate, 'EEEE, MMMM d, yyyy')}</span>
                                {event.dates.start.localTime && (
                                  <>
                                    <span className="mx-2">•</span>
                                    <span>{format(new Date(`2000-01-01T${event.dates.start.localTime}`), 'h:mm a')}</span>
                                  </>
                                )}
                              </div>
                              
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-2 text-cyan-500" />
                                <span>
                                  {venue.name}, {venue.city?.name}
                                  {venue.state?.name ? `, ${venue.state.name}` : ''}, {venue.country?.name}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4 md:mt-0">
                            <Button 
                              className="bg-cyan-600 hover:bg-cyan-700"
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SearchResults;
