import { useState, useEffect } from "react";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { Search, Filter, Calendar, MapPin, Music, Mic2, Loader2 } from "lucide-react";
import AppHeader from "@/components/AppHeaderRedesigned";
import ArtistCardEnhanced from "@/components/ArtistCardEnhanced";
import ShowCardEnhanced from "@/components/ShowCardEnhanced";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as searchService from "@/services/search";
import { motion, AnimatePresence } from "framer-motion";
import MobileBottomNav from "@/components/MobileBottomNav";

export default function SearchResultsEnhanced() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  
  const [searchQuery, setSearchQuery] = useState(query);
  const [artistResults, setArtistResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState("relevance");
  const [locationFilter, setLocationFilter] = useState("");
  const [dateRange, setDateRange] = useState("all");
  
  useEffect(() => {
    if (query) {
      performSearch(query);
    } else {
      setLoading(false);
    }
  }, [query]);
  
  const performSearch = async (searchTerm: string) => {
    setLoading(true);
    try {
      const { artists, shows } = await searchService.searchArtistsAndShows(searchTerm);
      
      setArtistResults(artists);
      setShowResults(shows);
    } catch (error) {
      console.error("Error performing search:", error);
      setArtistResults([]);
      setShowResults([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = () => {
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Filter shows based on location and date
  const filteredShows = showResults.filter(show => {
    if (locationFilter && !show.venue?.city?.toLowerCase().includes(locationFilter.toLowerCase())) {
      return false;
    }
    
    if (dateRange !== "all") {
      const showDate = new Date(show.date);
      const now = new Date();
      
      switch (dateRange) {
        case "this-week":
          const weekEnd = new Date(now);
          weekEnd.setDate(now.getDate() + 7);
          return showDate >= now && showDate <= weekEnd;
        case "this-month":
          const monthEnd = new Date(now);
          monthEnd.setMonth(now.getMonth() + 1);
          return showDate >= now && showDate <= monthEnd;
        case "next-3-months":
          const threeMonthsEnd = new Date(now);
          threeMonthsEnd.setMonth(now.getMonth() + 3);
          return showDate >= now && showDate <= threeMonthsEnd;
      }
    }
    
    return true;
  });

  // Sort results
  const sortedArtists = [...artistResults].sort((a, b) => {
    switch (sortBy) {
      case "popularity":
        return (b.popularity || 0) - (a.popularity || 0);
      case "name":
        return a.name.localeCompare(b.name);
      case "shows":
        return (b.upcomingShowsCount || 0) - (a.upcomingShowsCount || 0);
      default:
        return 0;
    }
  });

  const sortedShows = [...filteredShows].sort((a, b) => {
    switch (sortBy) {
      case "date":
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case "popularity":
        return (b.view_count || 0) - (a.view_count || 0);
      default:
        return 0;
    }
  });

  const totalResults = artistResults.length + showResults.length;

  return (
    <div className="min-h-screen bg-black">
      <AppHeader />
      
      {/* Search Header */}
      <div className="bg-gray-950 border-b border-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyUp={handleKeyPress}
              placeholder="Search artists, shows, venues..."
              className="pl-12 pr-24 py-3 text-lg bg-gray-900 border-gray-800 focus:border-[#00FF88] text-white"
            />
            <Button 
              onClick={handleSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#00FF88] hover:bg-[#00E67A] text-black font-medium"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
            </Button>
          </div>
          
          {query && !loading && (
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-2">
                {totalResults} results for "{query}"
              </h1>
              <p className="text-gray-400">
                {artistResults.length} artists • {showResults.length} shows
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-gray-900 border border-gray-800">
                <TabsTrigger value="all" className="data-[state=active]:bg-[#00FF88] data-[state=active]:text-black">
                  All Results
                </TabsTrigger>
                <TabsTrigger value="artists" className="data-[state=active]:bg-[#00FF88] data-[state=active]:text-black">
                  <Music className="w-4 h-4 mr-2" />
                  Artists ({artistResults.length})
                </TabsTrigger>
                <TabsTrigger value="shows" className="data-[state=active]:bg-[#00FF88] data-[state=active]:text-black">
                  <Calendar className="w-4 h-4 mr-2" />
                  Shows ({showResults.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex gap-2">
            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 bg-gray-900 border-gray-800 text-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="popularity">Popularity</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="shows">Most Shows</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range Filter (for shows) */}
            {(activeTab === "shows" || activeTab === "all") && (
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-40 bg-gray-900 border-gray-800 text-white">
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="this-week">This Week</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="next-3-months">Next 3 Months</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Location Filter */}
            {(activeTab === "shows" || activeTab === "all") && (
              <Input
                placeholder="Filter by city..."
                className="w-40 bg-gray-900 border-gray-800 text-white"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
            )}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#00FF88] animate-spin" />
          </div>
        ) : totalResults === 0 && query ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">No results found</h3>
            <p className="text-gray-400 mb-6">
              We couldn't find anything matching "{query}"
            </p>
            <Button
              onClick={() => navigate("/search")}
              className="bg-[#00FF88] hover:bg-[#00E67A] text-black font-medium"
            >
              Browse All Shows
            </Button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === "all" && (
              <motion.div
                key="all"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-12"
              >
                {/* Artists Section */}
                {sortedArtists.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                      <Mic2 className="w-6 h-6 text-[#00FF88]" />
                      Artists
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {sortedArtists.slice(0, 8).map((artist) => (
                        <ArtistCardEnhanced
                          key={artist.id}
                          artist={artist}
                          showVoteButton={true}
                        />
                      ))}
                    </div>
                    {sortedArtists.length > 8 && (
                      <div className="text-center mt-6">
                        <Button
                          variant="outline"
                          onClick={() => setActiveTab("artists")}
                          className="border-gray-800 text-gray-400 hover:border-[#00FF88] hover:text-[#00FF88]"
                        >
                          View All {sortedArtists.length} Artists
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Shows Section */}
                {sortedShows.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                      <Calendar className="w-6 h-6 text-[#00FF88]" />
                      Shows
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {sortedShows.slice(0, 6).map((show) => (
                        <ShowCardEnhanced
                          key={show.id}
                          show={show}
                        />
                      ))}
                    </div>
                    {sortedShows.length > 6 && (
                      <div className="text-center mt-6">
                        <Button
                          variant="outline"
                          onClick={() => setActiveTab("shows")}
                          className="border-gray-800 text-gray-400 hover:border-[#00FF88] hover:text-[#00FF88]"
                        >
                          View All {sortedShows.length} Shows
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "artists" && (
              <motion.div
                key="artists"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
              >
                {sortedArtists.map((artist) => (
                  <ArtistCardEnhanced
                    key={artist.id}
                    artist={artist}
                    showVoteButton={true}
                  />
                ))}
              </motion.div>
            )}

            {activeTab === "shows" && (
              <motion.div
                key="shows"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {sortedShows.map((show) => (
                  <ShowCardEnhanced
                    key={show.id}
                    show={show}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      <MobileBottomNav />
    </div>
  );
}