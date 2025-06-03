import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight, Sparkles, TrendingUp, Music, Calendar, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import AppHeader from "@/components/AppHeader";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useMobile } from "@/context/MobileContext";
import { motion, AnimatePresence } from "framer-motion";
import { searchArtists } from "@/services/spotify";
import { searchEvents } from "@/services/ticketmaster";
import { getTrendingArtists } from "@/services/search";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

const IndexEnhanced = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const navigate = useNavigate();
  const { isMobile } = useMobile();

  // Fetch trending shows/artists
  const { data: trendingArtists, isLoading: trendingLoading } = useQuery({
    queryKey: ["trending-artists-homepage"],
    queryFn: () => getTrendingArtists(8),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Real-time search as user types
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
    }, 300); // 300ms debounce

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSearchResultClick = (artist: any) => {
    navigate(`/artist/${artist.id}`);
  };

  return (
    <div className="min-h-screen w-full bg-black overflow-hidden">
      <AppHeader />
      
      {/* Hero Section with Animated Background */}
      <section className="relative min-h-[85vh] flex items-center justify-center w-full">
        {/* Animated gradient background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                "radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%)",
                "radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%)",
                "radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%)",
              ],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          />
          {/* Floating orbs */}
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
            animate={{
              x: [0, -100, 0],
              y: [0, 100, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <div className="relative z-10 text-center max-w-5xl mx-auto px-4">
          {/* Logo animation */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Music className="w-12 h-12 text-purple-400" />
              <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                TheSet
              </h1>
            </div>
            <p className="text-xl text-gray-400">Where fans shape the show</p>
          </motion.div>

          {/* Main heading */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={`${isMobile ? "text-4xl" : "text-5xl md:text-7xl"} font-bold mb-6 leading-tight`}
          >
            <span className="text-white">Vote on setlists for</span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              your favorite artists
            </span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className={`${isMobile ? "text-lg" : "text-xl md:text-2xl"} text-gray-300 mb-10 max-w-3xl mx-auto`}
          >
            Join thousands of fans voting on dream setlists for upcoming concerts
          </motion.p>

          {/* Enhanced Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative max-w-2xl mx-auto mb-8"
          >
            <form onSubmit={handleSearch} className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-xl rounded-2xl" />
              <div className="relative flex items-center">
                <Search className="absolute left-6 h-6 w-6 text-gray-400 z-10" />
                <Input
                  placeholder="Search for artists, bands, or shows..."
                  className={`w-full pl-14 pr-32 ${isMobile ? "py-4" : "py-6"} text-lg bg-gray-900/80 backdrop-blur-xl border-gray-700 focus:border-purple-400 rounded-2xl transition-all duration-300`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button 
                  type="submit"
                  className="absolute right-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-2 rounded-xl transition-all duration-300"
                >
                  Search
                </Button>
              </div>
            </form>

            {/* Live Search Results Dropdown */}
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full mt-2 w-full bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden"
                >
                  {searchResults.map((artist, index) => (
                    <motion.button
                      key={artist.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleSearchResultClick(artist)}
                      className="w-full flex items-center gap-4 p-4 hover:bg-gray-800/50 transition-colors text-left"
                    >
                      <img
                        src={artist.images?.[0]?.url || "/placeholder.svg"}
                        alt={artist.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-semibold text-white">{artist.name}</p>
                        <p className="text-sm text-gray-400">
                          {artist.genres?.slice(0, 2).join(", ")}
                        </p>
                      </div>
                      <ArrowRight className="ml-auto h-5 w-5 text-gray-400" />
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-wrap justify-center gap-8 mb-8"
          >
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-400">50K+</p>
              <p className="text-gray-400">Active Voters</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-pink-400">1M+</p>
              <p className="text-gray-400">Votes Cast</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-400">5K+</p>
              <p className="text-gray-400">Upcoming Shows</p>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button 
              onClick={() => navigate("/search")}
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-6 text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Explore Shows
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-gray-700 text-white hover:bg-gray-900/50 px-8 py-6 text-lg rounded-xl"
              onClick={() => navigate("/login")}
            >
              Sign In to Vote
            </Button>
          </motion.div>
        </div>
      </section>
      
      {/* Trending Artists Section */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/5 to-transparent" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Trending Artists
            </h2>
            <p className="text-gray-400 text-lg">
              See who's getting the most votes this week
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingLoading ? (
              // Loading skeletons
              [...Array(8)].map((_, i) => (
                <Card key={i} className="bg-gray-900/50 border-gray-800 p-6 rounded-2xl">
                  <div className="animate-pulse">
                    <div className="w-full h-48 bg-gray-800 rounded-xl mb-4" />
                    <div className="h-6 bg-gray-800 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-800 rounded w-1/2" />
                  </div>
                </Card>
              ))
            ) : (
              trendingArtists?.map((artist, index) => (
                <motion.div
                  key={artist.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card
                    onClick={() => navigate(`/artist/${artist.id}`)}
                    className="group cursor-pointer bg-gray-900/50 backdrop-blur-sm border-gray-800 hover:border-purple-500/50 transition-all duration-300 rounded-2xl overflow-hidden hover:scale-105"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={artist.image_url || "/placeholder.svg"}
                        alt={artist.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      
                      <div className="absolute top-4 right-4 bg-purple-500/20 backdrop-blur-sm border border-purple-500/30 rounded-full px-3 py-1">
                        <span className="text-xs font-medium text-purple-300 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Trending
                        </span>
                      </div>

                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-xl font-bold text-white mb-1">{artist.name}</h3>
                        {artist.nextShow && (
                          <p className="text-sm text-gray-300">
                            Next: {format(new Date(artist.nextShow.date), "MMM d")} • {artist.nextShow.city}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">{artist.upcomingShowsCount || 0} shows</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor((artist.popularity || 0) / 20)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-600"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30"
                      >
                        View Shows
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>

          <div className="text-center mt-12">
            <Button
              onClick={() => navigate("/search")}
              variant="outline"
              size="lg"
              className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
            >
              View All Artists
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Join the community and help shape the perfect concert experience
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Search,
                title: "Find Your Show",
                description: "Search for your favorite artists and discover their upcoming concerts",
                gradient: "from-purple-500 to-pink-500",
              },
              {
                icon: Users,
                title: "Vote on Songs",
                description: "Cast your votes for the songs you want to hear live",
                gradient: "from-pink-500 to-blue-500",
              },
              {
                icon: TrendingUp,
                title: "See Results",
                description: "Watch real-time voting results and compare with actual setlists",
                gradient: "from-blue-500 to-purple-500",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="bg-gray-900/30 backdrop-blur-sm border-gray-800 p-8 rounded-2xl hover:border-gray-700 transition-all duration-300">
                  <div
                    className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-6`}
                  >
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="w-full bg-gray-900/50 backdrop-blur-sm border-t border-gray-800 py-16 pb-32 md:pb-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Music className="w-8 h-8 text-purple-400" />
                <h3 className="text-2xl font-bold text-white">TheSet</h3>
              </div>
              <p className="text-gray-400">
                The platform where music fans unite to create the perfect concert experience.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Explore</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/search" className="hover:text-purple-400 transition-colors">Find Shows</a></li>
                <li><a href="/artists" className="hover:text-purple-400 transition-colors">Browse Artists</a></li>
                <li><a href="/trending" className="hover:text-purple-400 transition-colors">Trending</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Community</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-purple-400 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Stay Connected</h4>
              <p className="text-gray-400 mb-4">
                Get updates on new features and upcoming shows
              </p>
              <Button className="w-full bg-purple-500 hover:bg-purple-600">
                Join Newsletter
              </Button>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 TheSet. Made with ❤️ for music fans everywhere.
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default IndexEnhanced;