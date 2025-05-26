
import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import AppHeader from "@/components/AppHeader";
import MobileBottomNav from "@/components/MobileBottomNav";
import ArtistGrid from "@/components/ArtistGrid";
import { searchArtists } from "@/utils/artistUtils";
import { Artist } from "@/utils/artistUtils";
import { useMobile } from "@/context/MobileContext";

const AllArtists = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchPerformed, setSearchPerformed] = useState(false);
  const { isMobile } = useMobile();

  // Handle search
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setArtists([]);
      setSearchPerformed(false);
      return;
    }

    setLoading(true);
    setSearchPerformed(true);
    
    try {
      const results = await searchArtists(query);
      setArtists(results);
    } catch (error) {
      console.error("Search error:", error);
      setArtists([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle reset
  const handleReset = () => {
    setSearchQuery("");
    setArtists([]);
    setSearchPerformed(false);
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-black">
      <AppHeader />
      
      <div className="container mx-auto max-w-7xl px-4 pt-20 pb-32 md:pb-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`font-bold text-white mb-4 ${isMobile ? 'text-3xl' : 'text-4xl'}`}>
            Search Artists
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Discover artists with upcoming shows and vote on their setlists
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto mb-8">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search for artists..."
            className="w-full pl-12 pr-4 py-3 text-lg bg-gray-900 border-gray-700 focus:border-gray-600 rounded-xl text-white placeholder-gray-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Results */}
        <ArtistGrid 
          artists={artists}
          loading={loading}
          searchPerformed={searchPerformed}
          searchQuery={searchQuery}
          handleReset={handleReset}
        />
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default AllArtists;
