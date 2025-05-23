
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/sonner";
import AppHeader from "@/components/AppHeader";
import ArtistSearch from "@/components/ArtistSearch";
import ArtistGrid from "@/components/ArtistGrid";
import * as ticketmasterService from "@/services/ticketmaster";
import { 
  Artist, 
  extractUniqueArtistsFromEvents, 
  fetchArtistsFromDatabase,
  searchArtistsFromDatabase,
  mergeArtists,
  sortSearchResults
} from "@/utils/artistUtils";

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
      const ticketmasterArtists = await extractUniqueArtistsFromEvents(events);
      console.log(`Extracted ${ticketmasterArtists.length} unique artists`);
      
      // Mix in any artists from the database that aren't already in the list
      const databaseArtists = await fetchArtistsFromDatabase();
      console.log(`Found ${databaseArtists.length} artists in database`);
      
      // Merge artists from both sources and sort them
      const finalArtists = mergeArtists(ticketmasterArtists, databaseArtists);
      
      setArtists(finalArtists);
    } catch (error) {
      console.error("Error fetching artists with upcoming shows:", error);
      toast.error("Failed to load artists");
    } finally {
      setLoading(false);
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
      const ticketmasterArtists = await extractUniqueArtistsFromEvents(events);
      
      // Also search for artists in our database
      const databaseArtists = await searchArtistsFromDatabase(searchQuery);
      
      // Merge and sort search results
      const searchResults = sortSearchResults(
        mergeArtists(ticketmasterArtists, databaseArtists),
        searchQuery
      );
      
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
          
          <ArtistSearch 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleSearch={handleSearch}
            handleReset={handleReset}
            loading={loading}
          />
        </div>
        
        <ArtistGrid 
          artists={artists}
          loading={loading}
          searchPerformed={searchPerformed}
          searchQuery={searchQuery}
          handleReset={handleReset}
        />
      </div>
    </div>
  );
};

export default AllArtists;
