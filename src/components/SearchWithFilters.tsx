
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebounce } from '@/hooks/use-debounce';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { Show, Artist, Venue } from '@/types';
import { searchQueryKeys, invalidateSearchQueries } from '@/services/reactQueryOptimization';

interface SearchFilters {
  location?: string;
  dateRange?: string;
  genre?: string;
  sortBy?: string;
}

interface SearchWithFiltersProps {
  placeholder?: string;
  showFilters?: boolean;
  onSearch?: (query: string, filters: SearchFilters) => void;
  className?: string;
}

export default function SearchWithFilters({ 
  placeholder = "Search for artists, venues, or cities...",
  showFilters = true,
  onSearch,
  className = ""
}: SearchWithFiltersProps) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const debouncedQuery = useDebounce(query, 300);

  // Use React Query for search suggestions
  const { data: suggestions, isLoading: loadingSuggestions } = useQuery({
    queryKey: searchQueryKeys.suggestions(debouncedQuery),
    queryFn: () => fetchSearchSuggestions(debouncedQuery),
    enabled: debouncedQuery.length > 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Use React Query for available genres
  const { data: availableGenres } = useQuery({
    queryKey: searchQueryKeys.genres(),
    queryFn: fetchAvailableGenres,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch available genres from the database
  async function fetchAvailableGenres(): Promise<string[]> {
    try {
      const { data } = await supabase
        .from('artists')
        .select('genres')
        .not('genres', 'is', null);

      const allGenres = new Set<string>();
      data?.forEach(artist => {
        if (artist.genres && Array.isArray(artist.genres)) {
          artist.genres.forEach(genre => allGenres.add(genre));
        }
      });

      return Array.from(allGenres).sort();
    } catch (error) {
      console.error('Error fetching genres:', error);
      return ['rock', 'pop', 'hip-hop', 'electronic', 'country', 'jazz', 'classical'];
    }
  }

  // Fetch search suggestions
  async function fetchSearchSuggestions(searchQuery: string): Promise<string[]> {
    if (!searchQuery || searchQuery.length < 3) return [];

    try {
      const { data: artistSuggestions } = await supabase
        .from('artists')
        .select('name')
        .ilike('name', `%${searchQuery}%`)
        .limit(5);

      const { data: venueSuggestions } = await supabase
        .from('venues')
        .select('name, city')
        .or(`name.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`)
        .limit(5);

      const suggestions: string[] = [];
      
      artistSuggestions?.forEach(artist => suggestions.push(artist.name));
      venueSuggestions?.forEach(venue => {
        suggestions.push(venue.name);
        if (venue.city && !suggestions.includes(venue.city)) {
          suggestions.push(venue.city);
        }
      });

      return suggestions.slice(0, 8);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      return [];
    }
  }

  // Function to convert string dateRange to actual dates
  const getDateRangeValues = (dateRangeString?: string): { start?: string; end?: string } => {
    if (!dateRangeString) return {};
    const now = new Date();
    let startDate = new Date(now);
    let endDate = new Date(now);

    switch (dateRangeString) {
      case 'this-week':
        startDate.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
        endDate.setDate(startDate.getDate() + 6);     // End of current week (Saturday)
        break;
      case 'this-month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'next-month':
        startDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);
        break;
      case 'this-year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        return {}; // No specific range
    }
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  };
  
  // Build Supabase query based on plan
  const buildSupabaseQuery = (searchQuery: string, searchFilters: SearchFilters): PostgrestFilterBuilder<any, any, any[], "shows", unknown>  => {
    let queryBuilder = supabase
      .from('shows')
      .select(`
        *,
        artist:artists!inner(id, name),
        venue:venues!inner(id, name, city)
      `); // Ensure !inner or correct FK hint if needed

    if (searchQuery.trim()) {
      // The plan uses textSearch on 'artist.name'.
      // For a more general search, you might use a different FTS setup or multiple .or conditions.
      queryBuilder = queryBuilder.ilike('artist.name', `%${searchQuery.trim()}%`); // Simple ilike for now
    }

    if (searchFilters.location) {
      queryBuilder = queryBuilder.eq('venue.city', searchFilters.location);
    }

    const { start, end } = getDateRangeValues(searchFilters.dateRange);
    if (start) {
      queryBuilder = queryBuilder.gte('date', start);
    }
    if (end) {
      queryBuilder = queryBuilder.lte('date', end);
    }
    
    if (searchFilters.genre) {
      // Filter by genre using overlap operator for array fields
      queryBuilder = queryBuilder.overlaps('artist.genres', [searchFilters.genre]);
    }
    
    if (searchFilters.sortBy) {
        let sortField = searchFilters.sortBy;
        let ascending = true;
        if (sortField === 'popularity' || sortField === 'votes') { // Assuming these are numeric
            ascending = false; // typically sort descending for these
        }
        // Note: Sorting by related table fields like 'artist.name' or 'venue.city' might need specific syntax
        // or be handled post-query if complex.
        queryBuilder = queryBuilder.order(sortField as keyof Show, { ascending });
    }

    return queryBuilder;
  };

  const handleSearch = useCallback(async (searchQuery: string, searchFilters: SearchFilters) => {
    // Invalidate previous search results
    await invalidateSearchQueries(queryClient);

    if (onSearch) {
      // If onSearch prop is provided, it's responsible for handling the query.
      onSearch(searchQuery, searchFilters);
    } else {
      // Default behavior: navigate with search parameters
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (searchFilters.location) params.set('location', searchFilters.location);
      if (searchFilters.dateRange) params.set('date', searchFilters.dateRange);
      if (searchFilters.genre) params.set('genre', searchFilters.genre);
      if (searchFilters.sortBy) params.set('sort', searchFilters.sortBy);
      navigate(`/search?${params.toString()}`);
    }
  }, [onSearch, navigate, queryClient]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query, filters);
  };

  const updateFilter = (key: keyof SearchFilters, value: string | undefined) => {
    const newFilters = { ...filters };
    if (value) {
      newFilters[key] = value;
    } else {
      delete newFilters[key];
    }
    setFilters(newFilters);
    
    // Auto-search when filters change
    if (debouncedQuery || Object.keys(newFilters).length > 0) {
      handleSearch(debouncedQuery, newFilters);
    }
  };

  const clearFilters = () => {
    setFilters({});
    handleSearch(query, {});
  };

  const activeFilterCount = Object.keys(filters).length;

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex gap-2">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={placeholder}
              className="w-full pl-12 pr-4 py-3 text-lg bg-yellow-metal-950/80 border-yellow-metal-700 focus:border-yellow-metal-400 rounded-xl"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            
            {/* Search Suggestions Dropdown */}
            {suggestions && suggestions.length > 0 && debouncedQuery.length > 2 && (
              <div className="absolute top-full mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-4 py-2 hover:bg-gray-800 text-white text-sm border-b border-gray-800 last:border-b-0"
                    onClick={() => {
                      setQuery(suggestion);
                      handleSearch(suggestion, filters);
                    }}
                  >
                    <Search className="h-3 w-3 mr-2 inline text-gray-400" />
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter Toggle */}
          {showFilters && (
            <Popover open={showFilterPanel} onOpenChange={setShowFilterPanel}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="border-yellow-metal-700 text-gray-300 hover:bg-yellow-metal-900/50 px-4 py-3 rounded-xl relative"
                >
                  <Filter className="h-5 w-5" />
                  {activeFilterCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-gray-900 border-gray-700">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-medium">Filters</h4>
                    {activeFilterCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-gray-400 hover:text-white"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>

                  {/* Location Filter */}
                  <div className="space-y-2">
                    <label className="text-sm text-gray-300 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      Location
                    </label>
                    <Input
                      placeholder="City, State, Country"
                      value={filters.location || ''}
                      onChange={(e) => updateFilter('location', e.target.value || undefined)}
                      className="bg-gray-800 border-gray-600"
                    />
                  </div>

                  {/* Date Range Filter */}
                  <div className="space-y-2">
                    <label className="text-sm text-gray-300 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Date Range
                    </label>
                    <Select
                      value={filters.dateRange || ''}
                      onValueChange={(value) => updateFilter('dateRange', value || undefined)}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-600">
                        <SelectValue placeholder="Any time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any time</SelectItem>
                        <SelectItem value="this-week">This week</SelectItem>
                        <SelectItem value="this-month">This month</SelectItem>
                        <SelectItem value="next-month">Next month</SelectItem>
                        <SelectItem value="this-year">This year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Genre Filter */}
                  <div className="space-y-2">
                    <label className="text-sm text-gray-300">Genre</label>
                    <Select
                      value={filters.genre || ''}
                      onValueChange={(value) => updateFilter('genre', value || undefined)}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-600">
                        <SelectValue placeholder="Any genre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any genre</SelectItem>
                        {availableGenres?.slice(0, 20).map(genre => (
                          <SelectItem key={genre} value={genre}>
                            {genre.charAt(0).toUpperCase() + genre.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort By */}
                  <div className="space-y-2">
                    <label className="text-sm text-gray-300">Sort by</label>
                    <Select
                      value={filters.sortBy || 'relevance'}
                      onValueChange={(value) => updateFilter('sortBy', value)}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="popularity">Popularity</SelectItem>
                        <SelectItem value="votes">Most Voted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Search Button */}
          <Button 
            type="submit"
            className="bg-yellow-metal-400 hover:bg-yellow-metal-500 text-black px-6 py-3 rounded-xl"
          >
            Search
          </Button>
        </div>
      </form>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {filters.location && (
            <Badge 
              variant="secondary" 
              className="bg-yellow-metal-800 text-yellow-metal-200 hover:bg-yellow-metal-700"
            >
              <MapPin className="h-3 w-3 mr-1" />
              {filters.location}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => updateFilter('location', undefined)}
              />
            </Badge>
          )}
          {filters.dateRange && (
            <Badge 
              variant="secondary" 
              className="bg-yellow-metal-800 text-yellow-metal-200 hover:bg-yellow-metal-700"
            >
              <Calendar className="h-3 w-3 mr-1" />
              {filters.dateRange.replace('-', ' ')}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => updateFilter('dateRange', undefined)}
              />
            </Badge>
          )}
          {filters.genre && (
            <Badge 
              variant="secondary" 
              className="bg-yellow-metal-800 text-yellow-metal-200 hover:bg-yellow-metal-700"
            >
              {filters.genre}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => updateFilter('genre', undefined)}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
