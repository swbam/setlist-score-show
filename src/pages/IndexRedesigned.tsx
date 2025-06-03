import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight, Calendar, MapPin, Users, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import AppHeader from "@/components/AppHeaderRedesigned";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useMobile } from "@/context/MobileContext";
import { motion, AnimatePresence } from "framer-motion";
import { searchArtists } from "@/services/spotify";
import { getTrendingArtists } from "@/services/search";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

const IndexRedesigned = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const navigate = useNavigate();
  const { isMobile } = useMobile();

  // Fetch trending shows
  const { data: trendingShows, isLoading: showsLoading } = useQuery({
    queryKey: ["trending-shows-homepage"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shows")
        .select(`
          id,
          name,
          title,
          date,
          view_count,
          trending_score,
          venues!inner (id, name, city, state),
          artists!inner (id, name, image_url)
        `)
        .gte("date", new Date().toISOString().split('T')[0])
        .order("trending_score", { ascending: false, nullsFirst: false })
        .limit(12);

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch trending artists
  const { data: trendingArtists, isLoading: artistsLoading } = useQuery({
    queryKey: ["trending-artists-homepage"],
    queryFn: () => getTrendingArtists(8),
    staleTime: 5 * 60 * 1000,
  });

  // Real-time search
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        try {
          const artists = await searchArtists(searchQuery);
          setSearchResults(artists.slice(0, 5));
        } catch (error) {
          console.error("Search error:", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const popularSearches = ["Taylor Swift", "Drake", "Billie Eilish", "The Weeknd", "Bad Bunny"];

  return (
    <div className="min-h-screen w-full bg-black">
      <AppHeader />
      
      {/* Hero Section - Matching the example design */}
      <section className="relative pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className={`${isMobile ? "text-5xl" : "text-6xl md:text-7xl"} font-bold mb-6`}>
              <span className="text-white">Shape the Concert</span>
              <br />
              <span className="text-white">Experience You Want</span>
            </h1>
            
            <p className={`${isMobile ? "text-lg" : "text-xl"} text-gray-400 mb-10 max-w-3xl mx-auto`}>
              Vote on setlists for your favorite artists and help create the perfect show
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-6">
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <Input
                  placeholder="Search artists or venues"
                  className="w-full pl-14 pr-4 py-4 text-lg bg-gray-900 border-gray-800 focus:border-[#00FF88] rounded-lg transition-all duration-200 text-white placeholder:text-gray-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Live Search Results */}
              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full mt-2 w-full bg-gray-900 border border-gray-800 rounded-lg shadow-2xl z-50 overflow-hidden"
                  >
                    {searchResults.map((artist, index) => (
                      <motion.button
                        key={artist.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => navigate(`/artist/${artist.id}`)}
                        className="w-full flex items-center gap-4 p-4 hover:bg-gray-800 transition-colors text-left"
                      >
                        <img
                          src={artist.images?.[0]?.url || "/placeholder.svg"}
                          alt={artist.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-white">{artist.name}</p>
                          <p className="text-sm text-gray-400">
                            {artist.genres?.slice(0, 2).join(", ")}
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </form>

            {/* Popular Searches */}
            <div className="flex flex-wrap justify-center gap-2 mb-12">
              <span className="text-gray-500 text-sm">Popular:</span>
              {popularSearches.map((artist) => (
                <button
                  key={artist}
                  onClick={() => navigate(`/search?q=${encodeURIComponent(artist)}`)}
                  className="px-4 py-1.5 text-sm text-gray-400 bg-gray-900 hover:bg-gray-800 hover:text-[#00FF88] rounded-full transition-all duration-200 border border-gray-800 hover:border-[#00FF88]"
                >
                  {artist}
                </button>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => navigate("/search")}
                size="lg"
                className="bg-[#00FF88] hover:bg-[#00E67A] text-black font-semibold px-8 py-3 rounded-lg transition-all duration-200"
              >
                Browse All Shows
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-gray-800 text-white hover:bg-gray-900 hover:border-gray-700 px-8 py-3 rounded-lg"
              >
                How It Works
              </Button>
            </div>
          </motion.div>

          {/* Feature Icons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: Search, text: "Discover Shows" },
              { icon: Users, text: "Vote Together" },
              { icon: TrendingUp, text: "Track Results" }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                className="flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mb-3 border border-gray-800">
                  <feature.icon className="w-8 h-8 text-[#00FF88]" />
                </div>
                <p className="text-gray-400">{feature.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Trending Shows Section - Grid Layout like StubHub/Ticketmaster */}
      <section className="py-16 px-4 bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Trending Shows</h2>
              <p className="text-gray-400">Most voted upcoming concerts</p>
            </div>
            <Button
              onClick={() => navigate("/search")}
              variant="ghost"
              className="text-[#00FF88] hover:text-[#00E67A] hover:bg-gray-900"
            >
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {showsLoading ? (
              [...Array(8)].map((_, i) => (
                <Card key={i} className="bg-gray-900 border-gray-800 overflow-hidden">
                  <div className="animate-pulse">
                    <div className="h-48 bg-gray-800" />
                    <div className="p-4">
                      <div className="h-6 bg-gray-800 rounded w-3/4 mb-2" />
                      <div className="h-4 bg-gray-800 rounded w-1/2" />
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              trendingShows?.map((show) => (
                <motion.div
                  key={show.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  whileHover={{ y: -4 }}
                >
                  <Card
                    onClick={() => navigate(`/show/${show.id}`)}
                    className="cursor-pointer bg-gray-900 border-gray-800 hover:border-gray-700 transition-all duration-200 overflow-hidden h-full"
                  >
                    <div className="relative h-48">
                      <img
                        src={show.artists?.image_url || "/placeholder.svg"}
                        alt={show.artists?.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      
                      {/* Date Badge */}
                      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-lg">
                        <p className="text-xs font-medium text-[#00FF88]">
                          {format(new Date(show.date), "MMM d")}
                        </p>
                      </div>

                      {/* Artist Name */}
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-lg font-bold text-white line-clamp-1">
                          {show.artists?.name}
                        </h3>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex items-center gap-2 text-gray-400 mb-3">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm line-clamp-1">
                          {show.venues?.name} • {show.venues?.city}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Users className="w-4 h-4" />
                          <span className="text-xs">{show.view_count || 0} votes</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span className="text-xs">
                            {format(new Date(show.date), "h:mm a")}
                          </span>
                        </div>
                      </div>

                      <Button 
                        className="w-full bg-[#00FF88] hover:bg-[#00E67A] text-black font-medium rounded-lg transition-all duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/show/${show.id}`);
                        }}
                      >
                        Vote On Setlist
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Popular Artists Section */}
      <section className="py-16 px-4 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Popular Artists</h2>
              <p className="text-gray-400">Artists with upcoming shows</p>
            </div>
            <Button
              onClick={() => navigate("/artists")}
              variant="ghost"
              className="text-[#00FF88] hover:text-[#00E67A] hover:bg-gray-900"
            >
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {artistsLoading ? (
              [...Array(8)].map((_, i) => (
                <Card key={i} className="bg-gray-900 border-gray-800 p-6">
                  <div className="animate-pulse">
                    <div className="w-32 h-32 bg-gray-800 rounded-full mx-auto mb-4" />
                    <div className="h-6 bg-gray-800 rounded w-3/4 mx-auto mb-2" />
                    <div className="h-4 bg-gray-800 rounded w-1/2 mx-auto" />
                  </div>
                </Card>
              ))
            ) : (
              trendingArtists?.map((artist, index) => (
                <motion.div
                  key={artist.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Card
                    onClick={() => navigate(`/artist/${artist.id}`)}
                    className="cursor-pointer bg-gray-900 border-gray-800 hover:border-[#00FF88]/50 transition-all duration-200 p-6 text-center group"
                  >
                    <div className="relative mb-4">
                      <img
                        src={artist.image_url || "/placeholder.svg"}
                        alt={artist.name}
                        className="w-32 h-32 rounded-full mx-auto object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      {artist.upcomingShowsCount > 0 && (
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#00FF88] text-black text-xs font-medium px-3 py-1 rounded-full">
                          {artist.upcomingShowsCount} shows
                        </div>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1">
                      {artist.name}
                    </h3>
                    
                    {artist.nextShow && (
                      <p className="text-sm text-gray-400 line-clamp-2">
                        Next: {format(new Date(artist.nextShow.date), "MMM d")} • {artist.nextShow.city}
                      </p>
                    )}
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { number: "50K+", label: "Active Voters", icon: Users },
              { number: "1M+", label: "Votes Cast", icon: TrendingUp },
              { number: "5K+", label: "Upcoming Shows", icon: Calendar }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <stat.icon className="w-8 h-8 text-[#00FF88] mx-auto mb-4" />
                <p className="text-4xl font-bold text-white mb-2">{stat.number}</p>
                <p className="text-gray-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-black border-t border-gray-900 py-16 pb-32 md:pb-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-[#00FF88] mb-4">TheSet</h3>
              <p className="text-gray-400 text-sm">
                The platform where music fans unite to create the perfect concert experience.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Explore</h4>
              <ul className="space-y-2">
                {["Find Shows", "Browse Artists", "Trending", "How It Works"].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-gray-400 hover:text-[#00FF88] transition-colors text-sm">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                {["About", "Contact", "Press", "Careers"].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-gray-400 hover:text-[#00FF88] transition-colors text-sm">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Stay Updated</h4>
              <p className="text-gray-400 text-sm mb-4">
                Get the latest updates on shows and features
              </p>
              <Button className="w-full bg-[#00FF88] hover:bg-[#00E67A] text-black font-medium">
                Join Newsletter
              </Button>
            </div>
          </div>
          
          <div className="border-t border-gray-900 mt-12 pt-8 text-center">
            <p className="text-gray-500 text-sm">
              © 2025 TheSet. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <MobileBottomNav />
    </div>
  );
};

export default IndexRedesigned;