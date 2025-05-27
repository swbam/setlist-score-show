import { Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Hero = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

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
    <section className="relative min-h-[90vh] flex items-center justify-center px-4 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
        <div className="absolute inset-0 bg-gradient-radial from-teal-500/10 via-transparent to-transparent opacity-50"></div>
      </div>

      {/* Animated gradient orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-teal-500/20 rounded-full filter blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-600/10 rounded-full filter blur-3xl animate-pulse delay-1000"></div>

      <div className="relative z-10 text-center max-w-5xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 mb-8">
          <Sparkles className="w-4 h-4 text-teal-400" />
          <span className="text-sm font-medium text-teal-400">AI-Powered Setlist Predictions</span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight">
          <span className="text-white">Shape the</span>
          <br />
          <span className="gradient-text">concert experience</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
          Vote on songs you want to hear at upcoming shows. 
          Join millions of fans creating the perfect setlist.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative flex items-center">
              <Search className="absolute left-6 h-5 w-5 text-gray-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search artists, venues, or cities..."
                className="w-full pl-14 pr-6 py-6 text-lg bg-dark-800/80 backdrop-blur-sm border-dark-700 focus:border-teal-500 rounded-2xl text-white placeholder:text-gray-500 transition-all"
              />
              <Button 
                type="submit"
                className="absolute right-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-6 py-2 rounded-xl font-medium"
              >
                Search
              </Button>
            </div>
          </div>
        </form>

        {/* Popular Searches */}
        <div className="flex flex-wrap justify-center items-center gap-3 mb-12">
          <span className="text-gray-500 text-sm">Trending:</span>
          {["Taylor Swift", "Drake", "Olivia Rodrigo", "Bad Bunny", "The Weeknd"].map((artist) => (
            <button
              key={artist}
              onClick={() => handlePopularSearch(artist)}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-dark-800/50 hover:bg-dark-700/50 border border-dark-700 hover:border-teal-500/50 rounded-xl transition-all duration-200 hover:text-teal-400"
            >
              {artist}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => navigate('/search')}
            className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-all duration-200 transform hover:scale-105"
          >
            Explore Shows
          </Button>
          <Button 
            variant="outline" 
            className="border-dark-700 text-white bg-dark-800/50 hover:bg-dark-700/50 hover:border-teal-500/50 px-8 py-6 text-lg font-semibold rounded-xl backdrop-blur-sm transition-all duration-200"
          >
            How It Works
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mt-20 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white mb-2">2M+</div>
            <div className="text-sm text-gray-500">Active Voters</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white mb-2">50K+</div>
            <div className="text-sm text-gray-500">Upcoming Shows</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white mb-2">85%</div>
            <div className="text-sm text-gray-500">Prediction Accuracy</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
