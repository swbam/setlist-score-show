
import React, { useState, useEffect } from 'react';
import { Search, Calendar, MapPin, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '@/hooks/use-debounce';
import { searchArtistsWithUpcomingShows, getTrendingArtistsWithShows, ArtistWithShows } from '@/services/artistShowSearch';

interface ArtistSearchWithShowsProps {
  className?: string;
  placeholder?: string;
  showTrending?: boolean;
}

const ArtistSearchWithShows: React.FC<ArtistSearchWithShowsProps> = ({
  className = "",
  placeholder = "Search artists with upcoming shows...",
  showTrending = true
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ArtistWithShows[]>([]);
  const [trendingArtists, setTrendingArtists] = useState<ArtistWithShows[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  
  const debouncedQuery = useDebounce(query, 300);

  // Load trending artists on mount
  useEffect(() => {
    if (showTrending) {
      loadTrendingArtists();
    }
  }, [showTrending]);

  // Search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim()) {
      searchArtists(debouncedQuery);
    } else {
      setResults([]);
    }
  }, [debouncedQuery]);

  const loadTrendingArtists = async () => {
    try {
      const trending = await getTrendingArtistsWithShows(8);
      setTrendingArtists(trending);
    } catch (error) {
      console.error("Error loading trending artists:", error);
    }
  };

  const searchArtists = async (searchQuery: string) => {
    try {
      setLoading(true);
      const searchResults = await searchArtistsWithUpcomingShows(searchQuery, 10);
      setResults(searchResults);
    } catch (error) {
      console.error("Error searching artists:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleArtistClick = (artist: ArtistWithShows) => {
    navigate(`/artist/${artist.id}`);
    setQuery("");
    setFocused(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const displayArtists = query.trim() ? results : (showTrending ? trendingArtists : []);
  const showResults = focused && (query.trim() || showTrending) && displayArtists.length > 0;

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          className="pl-10 pr-4 py-3 bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:border-cyan-500"
        />
      </div>

      {showResults && (
        <Card className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border-gray-700 max-h-96 overflow-y-auto z-50">
          <CardContent className="p-0">
            {!query.trim() && showTrending && (
              <div className="px-4 py-2 border-b border-gray-700">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <TrendingUp className="h-4 w-4" />
                  Trending Artists
                </div>
              </div>
            )}
            
            {loading && (
              <div className="px-4 py-8 text-center text-gray-400">
                Searching...
              </div>
            )}
            
            {!loading && displayArtists.map((artist) => (
              <div
                key={artist.id}
                onClick={() => handleArtistClick(artist)}
                className="px-4 py-3 hover:bg-gray-800 cursor-pointer border-b border-gray-700 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  {artist.image_url && (
                    <img
                      src={artist.image_url}
                      alt={artist.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white truncate">
                        {artist.name}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {artist.upcoming_shows_count} show{artist.upcoming_shows_count !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    
                    {artist.next_show_date && artist.next_show_venue && (
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(artist.next_show_date)}
                        </div>
                        <div className="flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{artist.next_show_venue}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {!loading && displayArtists.length === 0 && query.trim() && (
              <div className="px-4 py-8 text-center text-gray-400">
                No artists found with upcoming shows
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ArtistSearchWithShows;
