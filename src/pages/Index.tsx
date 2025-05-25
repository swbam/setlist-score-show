import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AppHeader from "@/components/AppHeader";
import TrendingShows from "@/components/TrendingShows";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useMobile } from "@/context/MobileContext";
import SEO from "@/components/SEO";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { isMobile } = useMobile();
  
  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black">
      <SEO 
        title="TheSet - Vote on Concert Setlists"
        description="Join thousands of music fans voting on setlists for upcoming concerts. Predict what songs will be played and compare with actual performed setlists."
      />
      <AppHeader />
      
      {/* Hero Section */}
      <section className="relative min-h-[70vh] md:min-h-[80vh] flex items-center justify-center w-full">
        {/* Background with grid pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-metal-900/70 via-black to-yellow-metal-950/50">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23776a39%22%20fill-opacity%3D%220.15%22%3E%3Ccircle%20cx%3D%227%22%20cy%3D%227%22%20r%3D%221%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-20"></div>
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <h1 className={`${isMobile ? "text-4xl" : "text-5xl md:text-7xl"} font-bold mb-6`}>
            <span className="text-white">Crowdsourced</span>
            <br />
            <span className="text-white">concert setlists </span>
            <span className="text-yellow-metal-300">at scale.</span>
          </h1>
          
          <p className={`${isMobile ? "text-lg" : "text-xl md:text-2xl"} text-gray-300 mb-8 max-w-2xl mx-auto`}>
            Discover upcoming shows and vote on setlists for your favorite artists.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-8">
            <Search className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search for artists, venues, or cities..."
              className={`w-full pl-12 pr-4 ${isMobile ? "py-4" : "py-6"} text-lg bg-yellow-metal-950/80 border-yellow-metal-700 focus:border-yellow-metal-400 rounded-xl`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {/* Popular Searches */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <span className="text-gray-400">Popular searches:</span>
            {["Taylor Swift", "Drake", "Billie Eilish", "The Weeknd", "Bad Bunny"].map((artist) => (
              <Button
                key={artist}
                variant="outline"
                size="sm"
                onClick={() => navigate(`/search?q=${encodeURIComponent(artist)}`)}
                className="border-yellow-metal-800 text-gray-300 hover:bg-yellow-metal-100 hover:text-yellow-metal-950 hover:border-yellow-metal-400"
              >
                {artist}
              </Button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate("/search")}
              className="bg-yellow-metal-100 hover:bg-yellow-metal-200 text-yellow-metal-950 px-8 py-3 text-lg"
            >
              Explore Shows
            </Button>
            <Button 
              variant="outline" 
              className="border-yellow-metal-800 text-gray-300 hover:bg-yellow-metal-900/50 px-8 py-3 text-lg"
            >
              How It Works
            </Button>
          </div>
        </div>
      </section>
      
      {/* Featured Shows Section - Now using the real TrendingShows component */}
      <TrendingShows />
      
      {/* How It Works Section - Full Width */}
      <section className="py-16 w-full">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">How TheSet Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-yellow-metal-950/50 border border-yellow-metal-800 rounded-xl p-6">
              <div className="w-12 h-12 bg-yellow-metal-400/20 text-yellow-metal-300 rounded-full flex items-center justify-center mb-4">
                <span className="text-xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Find Your Show</h3>
              <p className="text-gray-400">
                Search for your favorite artists and discover their upcoming concerts and tour dates.
              </p>
            </div>
            
            <div className="bg-yellow-metal-950/50 border border-yellow-metal-800 rounded-xl p-6">
              <div className="w-12 h-12 bg-yellow-metal-400/20 text-yellow-metal-300 rounded-full flex items-center justify-center mb-4">
                <span className="text-xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Vote on Setlists</h3>
              <p className="text-gray-400">
                Upvote the songs you want to hear live and see what other fans are voting for in real-time.
              </p>
            </div>
            
            <div className="bg-yellow-metal-950/50 border border-yellow-metal-800 rounded-xl p-6">
              <div className="w-12 h-12 bg-yellow-metal-400/20 text-yellow-metal-300 rounded-full flex items-center justify-center mb-4">
                <span className="text-xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Compare After the Show</h3>
              <p className="text-gray-400">
                See how your fan-created setlist stacks up against what was actually played at the concert.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer - Full Width */}
      <footer className="w-full bg-yellow-metal-950/70 border-t border-yellow-metal-800 py-12 pb-32 md:pb-12">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold text-yellow-metal-300 mb-4">TheSet</h3>
              <p className="text-gray-400 text-sm">
                A platform for fans to influence concert setlists through voting, connecting artists with their audience.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Navigation</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="/" className="hover:text-yellow-metal-300 transition-colors">Home</a></li>
                <li><a href="/search" className="hover:text-yellow-metal-300 transition-colors">Artists</a></li>
                <li><a href="/login" className="hover:text-yellow-metal-300 transition-colors">Sign In</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-yellow-metal-300 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-yellow-metal-300 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-yellow-metal-300 transition-colors">About</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Connect</h4>
              <p className="text-gray-400 text-sm">
                Made with passion for music fans worldwide
              </p>
            </div>
          </div>
          
          <div className="border-t border-yellow-metal-800 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2025 TheSet. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default Index;
