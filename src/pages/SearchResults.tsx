
import { useState, useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { SearchIcon, Music, Calendar, MapPin } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import ArtistCard from "@/components/ArtistCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as searchService from "@/services/search";
import { supabase } from "@/integrations/supabase/client";

export default function SearchResults() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  
  const [searchQuery, setSearchQuery] = useState(query);
  const [artistResults, setArtistResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("artists");
  
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
      const results = await searchService.searchAll(searchTerm);
      setArtistResults(results.artists);
      setShowResults(results.shows);
    } catch (error) {
      console.error("Error performing search:", error);
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

  return (
    <div className="min-h-screen bg-black">
      <Helmet>
        <title>Search Results - TheSet</title>
      </Helmet>
      <AppHeader />
      
      <div className="container mx-auto pt-20 pb-10 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyUp={handleKeyPress}
              placeholder="Search artists, shows, songs..."
              className="pl-10 py-6 text-lg"
            />
            <Button 
              onClick={handleSearch} 
              className="absolute right-1 top-1/2 -translate-y-1/2"
            >
              Search
            </Button>
          </div>
          
          {query && (
            <div className="mt-8">
              <h1 className="text-2xl font-bold mb-6">Results for "{query}"</h1>
              
              <Tabs 
                defaultValue="artists" 
                value={activeTab}
                onValueChange={setActiveTab}
                className="mb-8"
              >
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="artists" className="flex items-center">
                    <Music className="h-4 w-4 mr-2" />
                    Artists
                  </TabsTrigger>
                  <TabsTrigger value="shows" className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Shows
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="artists" className="mt-6">
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <div className="w-8 h-8 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : artistResults.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {artistResults.map((artist) => (
                        <ArtistCard 
                          key={artist.id} 
                          artist={artist}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Music className="h-12 w-12 mx-auto mb-4 text-gray-700" />
                      <h3 className="text-xl font-medium mb-2">No artists found</h3>
                      <p className="text-gray-400">Try searching for another artist name</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="shows" className="mt-6">
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <div className="w-8 h-8 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : showResults.length > 0 ? (
                    <div className="space-y-4">
                      {showResults.map((show) => (
                        <div 
                          key={show.id}
                          className="p-4 rounded-lg border border-gray-800 hover:border-cyan-800 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold">{show.name || show.artist?.name}</h3>
                              <div className="flex items-center text-sm text-gray-400 mt-1">
                                <Calendar className="h-3 w-3 mr-1" />
                                <span>
                                  {new Date(show.date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center text-sm text-gray-400 mt-1">
                                <MapPin className="h-3 w-3 mr-1" />
                                <span>{show.venue?.name}, {show.venue?.city}</span>
                              </div>
                            </div>
                            <Button size="sm" asChild>
                              <a href={`/shows/${show.id}`}>View Show</a>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-700" />
                      <h3 className="text-xl font-medium mb-2">No shows found</h3>
                      <p className="text-gray-400">Try searching for another artist or event name</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
