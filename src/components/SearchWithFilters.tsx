
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter, MapPin, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import * as search from '@/services/search';

interface SearchFilters {
  query: string;
  type: 'all' | 'artists' | 'shows';
  location?: string;
  dateRange?: string;
  limit?: number;
}

interface SearchWithFiltersProps {
  onResults: (results: any[]) => void;
  onLoading: (loading: boolean) => void;
}

export function SearchWithFilters({ onResults, onLoading }: SearchWithFiltersProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    type: 'all',
    limit: 20
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const { data: results, isLoading, refetch } = useQuery({
    queryKey: ['search', filters],
    queryFn: async () => {
      if (!filters.query.trim()) return [];
      
      console.log('[Search] Executing search with filters:', filters);
      
      const searchOptions = {
        query: filters.query,
        limit: filters.limit || 20
      };
      
      const searchResults = await search.search(searchOptions);
      console.log('[Search] Results:', searchResults);
      
      return searchResults;
    },
    enabled: false
  });

  React.useEffect(() => {
    onLoading(isLoading);
  }, [isLoading, onLoading]);

  React.useEffect(() => {
    if (results) {
      // Filter results by type if not 'all'
      let filteredResults = results;
      if (filters.type !== 'all') {
        filteredResults = results.filter(result => {
          if (filters.type === 'artists') {
            return result.type === 'artist';
          } else if (filters.type === 'shows') {
            return result.type === 'show';
          }
          return true;
        });
      }
      onResults(filteredResults);
    }
  }, [results, filters.type, onResults]);

  const handleSearch = () => {
    if (filters.query.trim()) {
      refetch();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Main Search Bar */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search for artists or shows..."
                value={filters.query}
                onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                onKeyPress={handleKeyPress}
                className="pl-10"
              />
            </div>
            <Select value={filters.type} onValueChange={(value: 'all' | 'artists' | 'shows') => setFilters(prev => ({ ...prev, type: value }))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="artists">Artists</SelectItem>
                <SelectItem value="shows">Shows</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} disabled={!filters.query.trim() || isLoading}>
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {/* Advanced Filters Toggle */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-gray-600 hover:text-gray-900"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
            </Button>
          </div>

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Location
                </label>
                <Input
                  placeholder="City, State, or Country"
                  value={filters.location || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Date Range
                </label>
                <Select value={filters.dateRange || ''} onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any time</SelectItem>
                    <SelectItem value="week">This week</SelectItem>
                    <SelectItem value="month">This month</SelectItem>
                    <SelectItem value="quarter">Next 3 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Results Limit
                </label>
                <Select value={filters.limit?.toString() || '20'} onValueChange={(value) => setFilters(prev => ({ ...prev, limit: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 results</SelectItem>
                    <SelectItem value="20">20 results</SelectItem>
                    <SelectItem value="50">50 results</SelectItem>
                    <SelectItem value="100">100 results</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
