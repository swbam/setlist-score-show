import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, TrendingUp, Calendar, Grid, List } from "lucide-react";
import AppHeader from "@/components/AppHeaderRedesigned";
import ArtistCardEnhanced from "@/components/ArtistCardEnhanced";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import MobileBottomNav from "@/components/MobileBottomNav";

const AllArtistsEnhanced = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("popularity");
  const [filterGenre, setFilterGenre] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Fetch all artists with their upcoming shows
  const { data: artists, isLoading } = useQuery({
    queryKey: ["all-artists", sortBy, filterGenre],
    queryFn: async () => {
      let query = supabase
        .from("artists")
        .select(`
          *,
          shows!shows_artist_id_fkey(
            id,
            date,
            venues!shows_venue_id_fkey(name, city)
          )
        `);

      // Apply genre filter
      if (filterGenre !== "all") {
        query = query.contains("genres", [filterGenre]);
      }

      // Apply sorting
      switch (sortBy) {
        case "popularity":
          query = query.order("popularity", { ascending: false });
          break;
        case "name":
          query = query.order("name", { ascending: true });
          break;
        case "shows":
          // This would need a different approach - counting shows
          query = query.order("popularity", { ascending: false });
          break;
      }

      const { data, error } = await query.limit(50);
      
      if (error) throw error;

      // Process artists to add show counts and next show info
      return (data || []).map(artist => {
        const upcomingShows = (artist.shows || [])
          .filter(show => new Date(show.date) >= new Date())
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const nextShow = upcomingShows[0];

        return {
          ...artist,
          showCount: upcomingShows.length,
          nextShow: nextShow ? {
            id: nextShow.id,
            date: nextShow.date,
            venue: nextShow.venues?.name || "Unknown Venue",
            city: nextShow.venues?.city || "Unknown City"
          } : null
        };
      });
    },
    staleTime: 5 * 60 * 1000,
  });

  // Filter artists based on search query
  const filteredArtists = artists?.filter(artist =>
    artist.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Get unique genres for filter
  const genres = Array.from(new Set(
    artists?.flatMap(artist => artist.genres || []) || []
  )).sort();

  return (
    <div className="min-h-screen bg-black">
      <AppHeader />
      
      {/* Page Header */}
      <div className="bg-gray-950 border-b border-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">All Artists</h1>
              <p className="text-gray-400">
                Browse artists with upcoming shows
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className={viewMode === "grid" ? "bg-[#00FF88] text-black" : ""}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                className={viewMode === "list" ? "bg-[#00FF88] text-black" : ""}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <Input
                placeholder="Search artists..."
                className="pl-10 bg-gray-900 border-gray-800 focus:border-[#00FF88] text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Genre Filter */}
            <Select value={filterGenre} onValueChange={setFilterGenre}>
              <SelectTrigger className="w-full md:w-48 bg-gray-900 border-gray-800 text-white">
                <SelectValue placeholder="All Genres" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genres</SelectItem>
                {genres.map(genre => (
                  <SelectItem key={genre} value={genre}>
                    {genre.charAt(0).toUpperCase() + genre.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48 bg-gray-900 border-gray-800 text-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Popularity
                  </div>
                </SelectItem>
                <SelectItem value="name">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Name A-Z
                  </div>
                </SelectItem>
                <SelectItem value="shows">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Most Shows
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <p className="text-gray-400 text-sm">
          Showing {filteredArtists.length} of {artists?.length || 0} artists
        </p>
      </div>

      {/* Artists Grid/List */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        {isLoading ? (
          <div className={viewMode === "grid" 
            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" 
            : "space-y-4"
          }>
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-lg animate-pulse">
                {viewMode === "grid" ? (
                  <div>
                    <div className="aspect-square bg-gray-800" />
                    <div className="p-4">
                      <div className="h-6 bg-gray-800 rounded w-3/4 mb-2" />
                      <div className="h-4 bg-gray-800 rounded w-1/2" />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4">
                    <div className="w-20 h-20 bg-gray-800 rounded-lg" />
                    <div className="flex-1">
                      <div className="h-5 bg-gray-800 rounded w-1/3 mb-2" />
                      <div className="h-4 bg-gray-800 rounded w-1/4" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : filteredArtists.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">No artists found</h3>
            <p className="text-gray-400">
              {searchQuery ? "Try a different search term" : "No artists match your filters"}
            </p>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={viewMode === "grid" 
              ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" 
              : "space-y-4"
            }
          >
            {filteredArtists.map((artist, index) => (
              <motion.div
                key={artist.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.02 }}
              >
                <ArtistCardEnhanced 
                  artist={artist} 
                  variant={viewMode}
                  showVoteButton={true}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default AllArtistsEnhanced;