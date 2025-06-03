import { useState, useEffect } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { Search, Sparkles, Play, Music, Users, TrendingUp, ArrowRight, Mic, Star, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

const HeroEnhanced = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentArtist, setCurrentArtist] = useState(0);
  const controls = useAnimation();

  const featuredArtists = [
    { name: "Taylor Swift", image: "🎤", color: "from-purple-500 to-pink-500" },
    { name: "Bad Bunny", image: "🐰", color: "from-yellow-500 to-orange-500" },
    { name: "Drake", image: "🦉", color: "from-blue-500 to-indigo-500" },
    { name: "Billie Eilish", image: "👑", color: "from-green-500 to-teal-500" },
    { name: "The Weeknd", image: "🌙", color: "from-red-500 to-pink-500" }
  ];

  const stats = [
    { label: "Active Voters", value: "2.1M+", icon: Users },
    { label: "Shows This Month", value: "12.5K+", icon: Mic },
    { label: "Songs Voted", value: "850K+", icon: Music },
    { label: "Prediction Accuracy", value: "87%", icon: TrendingUp }
  ];

  useEffect(() => {
    controls.start({
      y: [0, -10, 0],
      transition: { duration: 6, repeat: Infinity, ease: "easeInOut" }
    });

    const interval = setInterval(() => {
      setCurrentArtist((prev) => (prev + 1) % featuredArtists.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [controls]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handlePopularSearch = (artist: string) => {
    navigate(`/search?q=${encodeURIComponent(artist)}`);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
        
        {/* Dynamic artist-based gradients */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentArtist}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className={`absolute inset-0 bg-gradient-to-br ${featuredArtists[currentArtist].color} opacity-10`}
          />
        </AnimatePresence>

        {/* Floating orbs */}
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 left-20 w-96 h-96 bg-yellow-metal-500/10 rounded-full filter blur-3xl"
        />
        
        <motion.div
          animate={{
            x: [0, -150, 0],
            y: [0, 100, 0],
            scale: [1, 0.8, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5
          }}
          className="absolute bottom-20 right-20 w-80 h-80 bg-blue-500/10 rounded-full filter blur-3xl"
        />

        {/* Animated particles */}
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0
            }}
            animate={{
              y: [null, Math.random() * window.innerHeight],
              opacity: [0, Math.random() * 0.5, 0]
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 10
            }}
            className="absolute w-1 h-1 bg-yellow-metal-400 rounded-full"
          />
        ))}
      </div>

      <div className="relative z-10 text-center max-w-7xl mx-auto px-4">
        {/* Announcement Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-yellow-metal-900/30 to-yellow-metal-800/30 border border-yellow-metal-500/30 backdrop-blur-xl mb-8 group hover:border-yellow-metal-400/50 transition-all duration-300"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-5 h-5 text-yellow-metal-400" />
          </motion.div>
          <span className="text-sm font-medium text-yellow-metal-300 group-hover:text-yellow-metal-200 transition-colors">
            AI-Powered Setlist Predictions • Live Voting • Real Results
          </span>
          <motion.div
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ArrowRight className="w-4 h-4 text-yellow-metal-400 opacity-70" />
          </motion.div>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="text-6xl md:text-8xl lg:text-9xl font-bold mb-8 tracking-tight leading-none"
        >
          <span className="block text-white">Shape the</span>
          <motion.span
            className="block bg-gradient-to-r from-yellow-metal-300 via-yellow-metal-200 to-yellow-metal-400 bg-clip-text text-transparent"
            animate={{ backgroundPosition: ["0%", "100%", "0%"] }}
            transition={{ duration: 8, repeat: Infinity }}
          >
            Perfect Show
          </motion.span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="text-xl md:text-3xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed font-light"
        >
          Vote on songs you want to hear live. Join millions of fans worldwide creating 
          the ultimate concert experience, one vote at a time.
        </motion.p>

        {/* Enhanced Search Bar */}
        <motion.form
          onSubmit={handleSearch}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="relative max-w-3xl mx-auto mb-8"
        >
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-metal-500/20 via-yellow-metal-400/20 to-yellow-metal-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-500" />
            
            {/* Search container */}
            <div className="relative flex items-center bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-2 group-hover:border-yellow-metal-400/30 group-focus-within:border-yellow-metal-400/50 transition-all duration-300">
              <Search className="absolute left-6 h-6 w-6 text-gray-400 group-focus-within:text-yellow-metal-400 transition-colors" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for artists, shows, or songs..."
                className="w-full pl-16 pr-40 py-6 text-lg bg-transparent border-none focus:ring-0 text-white placeholder:text-gray-400 font-medium"
              />
              <Button 
                type="submit"
                className="absolute right-2 bg-gradient-to-r from-yellow-metal-600 to-yellow-metal-500 hover:from-yellow-metal-500 hover:to-yellow-metal-400 text-black px-8 py-4 rounded-2xl font-bold text-base shadow-lg shadow-yellow-metal-500/25 hover:shadow-yellow-metal-400/40 transform hover:scale-105 transition-all duration-200"
              >
                <Search className="w-5 h-5 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </motion.form>

        {/* Trending Artists */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="flex flex-wrap justify-center items-center gap-4 mb-16"
        >
          <span className="text-gray-400 text-sm font-medium">Trending now:</span>
          {featuredArtists.map((artist, index) => (
            <motion.button
              key={artist.name}
              onClick={() => handlePopularSearch(artist.name)}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-3 text-sm font-semibold rounded-2xl backdrop-blur-lg transition-all duration-300 ${
                index === currentArtist
                  ? `bg-gradient-to-r ${artist.color} text-white shadow-lg`
                  : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10 hover:border-white/20'
              }`}
            >
              <span className="mr-2">{artist.image}</span>
              {artist.name}
            </motion.button>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
          className="flex flex-col sm:flex-row gap-6 justify-center mb-20"
        >
          <Button 
            onClick={() => navigate('/search')}
            className="group bg-gradient-to-r from-yellow-metal-600 to-yellow-metal-500 hover:from-yellow-metal-500 hover:to-yellow-metal-400 text-black px-10 py-6 text-lg font-bold rounded-2xl shadow-2xl shadow-yellow-metal-500/25 hover:shadow-yellow-metal-400/40 transform hover:scale-105 transition-all duration-300"
          >
            <Volume2 className="w-6 h-6 mr-3 group-hover:animate-pulse" />
            Start Voting Now
            <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => navigate('/how-it-works')}
            className="border-2 border-white/20 text-white bg-white/5 hover:bg-white/10 hover:border-white/30 px-10 py-6 text-lg font-bold rounded-2xl backdrop-blur-lg transition-all duration-300 group"
          >
            <Play className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
            See How It Works
          </Button>
        </motion.div>

        {/* Enhanced Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.4 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="group relative p-6 rounded-3xl bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/10 hover:border-yellow-metal-400/30 transition-all duration-300"
            >
              {/* Icon */}
              <div className="mb-4">
                <stat.icon className="w-8 h-8 text-yellow-metal-400 group-hover:text-yellow-metal-300 transition-colors" />
              </div>
              
              {/* Value */}
              <div className="text-3xl md:text-4xl font-bold text-white mb-2 group-hover:text-yellow-metal-100 transition-colors">
                {stat.value}
              </div>
              
              {/* Label */}
              <div className="text-sm text-gray-400 font-medium group-hover:text-gray-300 transition-colors">
                {stat.label}
              </div>

              {/* Hover effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-metal-500/5 to-yellow-metal-400/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
          ))}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 16, 0], opacity: [1, 0, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-3 bg-white/50 rounded-full mt-2"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroEnhanced;