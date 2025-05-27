
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
  
  const debouncedQuery = useDebounce(query, 300);

  const handleSearch = useCallback((searchQuery: string, searchFilters: SearchFilters) => {
    if (onSearch) {
      onSearch(searchQuery, searchFilters);
    } else {
      // Default behavior - navigate to search results
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (searchFilters.location) params.set('location', searchFilters.location);
      if (searchFilters.dateRange) params.set('date', searchFilters.dateRange);
      if (searchFilters.genre) params.set('genre', searchFilters.genre);
      if (searchFilters.sortBy) params.set('sort', searchFilters.sortBy);
      
      navigate(`/search?${params.toString()}`);
    }
  }, [onSearch, navigate]);

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
                        <SelectItem value="rock">Rock</SelectItem>
                        <SelectItem value="pop">Pop</SelectItem>
                        <SelectItem value="hip-hop">Hip Hop</SelectItem>
                        <SelectItem value="electronic">Electronic</SelectItem>
                        <SelectItem value="country">Country</SelectItem>
                        <SelectItem value="jazz">Jazz</SelectItem>
                        <SelectItem value="classical">Classical</SelectItem>
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
