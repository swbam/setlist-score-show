
import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, MapPin, Calendar, Music } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import * as search from '@/services/search';

interface SearchFilters {
  query: string;
  type: 'all' | 'artists' | 'shows';
  location?: string;
  dateRange?: string;
  limit: number;
}

interface SearchWithFiltersProps {
  onResultSelect?: (result: any) => void;
  placeholder?: string;
  showFilters?: boolean;
}

export function SearchWithFilters({ 
  onResultSelect, 
  placeholder = "Search artists and shows...",
  showFilters = true 
}: SearchWithFiltersProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    type: 'all',
    limit: 20
  });
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const debouncedQuery = useDebounce(filters.query, 300);

  // Search query
  const { data: results, isLoading, error } = useQuery({
    queryKey: ['search', debouncedQuery, filters.type, filters.location, filters.dateRange],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return [];
      
      console.log(`[Search] Executing search:`, { 
        query: debouncedQuery, 
        type: filters.type,
        location: filters.location 
      });
      
      const searchResults = await search.search({
        query: debouncedQuery,
        limit: filters.limit
      });
      
      // Filter results by type if specified
      if (filters.type !== 'all') {
        return searchResults.filter(result => result.type === filters.type);
      }
      
      return searchResults;
    },
    enabled: debouncedQuery.length > 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes
  });

  const updateFilter = useCallback((key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleResultClick = (result: any) => {
    if (onResultSelect) {
      onResultSelect(result);
    }
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      type: 'all',
      limit: 20
    });
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'artist':
        return <Music className="w-4 h-4" />;
      case 'show':
        return <Calendar className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const filteredResults = results || [];
  const hasActiveFilters = filters.type !== 'all' || filters.location || filters.dateRange;

  return (
    <div className="w-full space-y-4">
      {/* Main Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder={placeholder}
          value={filters.query}
          onChange={(e) => updateFilter('query', e.target.value)}
          className="pl-10 pr-12 bg-gray-900 border-gray-700 text-white placeholder-gray-400"
        />
        {showFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
          >
            <Filter className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && showAdvanced && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-auto">
                  {[filters.type !== 'all', filters.location, filters.dateRange].filter(Boolean).length} active
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Type Filter */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Type</label>
                <Select value={filters.type} onValueChange={(value) => updateFilter('type', value)}>
                  <SelectTrigger className="bg-gray-800 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="artists">Artists</SelectItem>
                    <SelectItem value="shows">Shows</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location Filter */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="City, State"
                    value={filters.location || ''}
                    onChange={(e) => updateFilter('location', e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-600"
                  />
                </div>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Date Range</label>
                <Select value={filters.dateRange || ''} onValueChange={(value) => updateFilter('dateRange', value)}>
                  <SelectTrigger className="bg-gray-800 border-gray-600">
                    <SelectValue placeholder="Any time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any time</SelectItem>
                    <SelectItem value="this-week">This week</SelectItem>
                    <SelectItem value="this-month">This month</SelectItem>
                    <SelectItem value="next-month">Next month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="text-gray-400 border-gray-600 hover:text-white"
                >
                  Clear filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {debouncedQuery.length > 2 && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-300">
              {isLoading ? 'Searching...' : `${filteredResults.length} results`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-12 bg-gray-800 rounded"></div>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="text-center py-8 text-red-400">
                <p>Error searching: {error instanceof Error ? error.message : 'Unknown error'}</p>
              </div>
            )}

            {!isLoading && !error && filteredResults.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No results found for "{debouncedQuery}"</p>
                <p className="text-sm mt-2">Try different keywords or adjust your filters</p>
              </div>
            )}

            {!isLoading && !error && filteredResults.length > 0 && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredResults.map((result: any, index: number) => (
                  <div
                    key={`${result.type}-${result.id || index}`}
                    onClick={() => handleResultClick(result)}
                    className="p-3 rounded-lg bg-gray-800 hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getResultIcon(result.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white truncate">
                            {result.name}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {result.type}
                          </Badge>
                        </div>
                        {result.description && (
                          <p className="text-sm text-gray-400 truncate">
                            {result.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
