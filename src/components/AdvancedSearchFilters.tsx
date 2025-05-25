import { useState } from 'react';
import { Calendar, MapPin, Music, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';

export interface SearchFilters {
  location?: {
    city?: string;
    state?: string;
    country?: string;
    radius?: number;
  };
  dateRange?: {
    from: Date;
    to: Date;
  };
  genres?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  venueSize?: 'small' | 'medium' | 'large' | 'any';
  showStatus?: 'scheduled' | 'postponed' | 'canceled' | 'any';
}

interface AdvancedSearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onReset: () => void;
  showFilterCount?: boolean;
}

const MUSIC_GENRES = [
  'Rock', 'Pop', 'Hip Hop', 'Electronic', 'Country', 'Jazz', 
  'Classical', 'R&B', 'Alternative', 'Indie', 'Metal', 'Folk',
  'Blues', 'Reggae', 'Punk', 'Soul', 'Funk', 'Latin'
];

const AdvancedSearchFilters = ({ 
  filters, 
  onFiltersChange, 
  onReset,
  showFilterCount = true 
}: AdvancedSearchFiltersProps) => {
  const [open, setOpen] = useState(false);
  
  // Count active filters
  const activeFilterCount = [
    filters.location?.city,
    filters.dateRange,
    filters.genres && filters.genres.length > 0,
    filters.priceRange,
    filters.venueSize && filters.venueSize !== 'any',
    filters.showStatus && filters.showStatus !== 'any'
  ].filter(Boolean).length;

  const handleLocationChange = (field: keyof typeof filters.location, value: string | number) => {
    onFiltersChange({
      ...filters,
      location: {
        ...filters.location,
        [field]: value
      }
    });
  };

  const handleGenreToggle = (genre: string) => {
    const currentGenres = filters.genres || [];
    const newGenres = currentGenres.includes(genre)
      ? currentGenres.filter(g => g !== genre)
      : [...currentGenres, genre];
    
    onFiltersChange({
      ...filters,
      genres: newGenres
    });
  };

  const handlePriceRangeChange = (values: number[]) => {
    onFiltersChange({
      ...filters,
      priceRange: {
        min: values[0],
        max: values[1]
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {showFilterCount && activeFilterCount > 0 && (
            <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-cyan-600">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg bg-gray-900 border-gray-800">
        <SheetHeader>
          <SheetTitle className="text-white">Advanced Filters</SheetTitle>
          <SheetDescription className="text-gray-400">
            Refine your search to find the perfect shows
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Location Filters */}
          <div>
            <h3 className="text-sm font-medium text-white mb-3 flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-cyan-400" />
              Location
            </h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="city" className="text-gray-300">City</Label>
                <Input
                  id="city"
                  placeholder="e.g., New York"
                  value={filters.location?.city || ''}
                  onChange={(e) => handleLocationChange('city', e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="state" className="text-gray-300">State</Label>
                  <Input
                    id="state"
                    placeholder="e.g., NY"
                    value={filters.location?.state || ''}
                    onChange={(e) => handleLocationChange('state', e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="radius" className="text-gray-300">Radius (miles)</Label>
                  <Input
                    id="radius"
                    type="number"
                    placeholder="50"
                    value={filters.location?.radius || ''}
                    onChange={(e) => handleLocationChange('radius', parseInt(e.target.value))}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div>
            <h3 className="text-sm font-medium text-white mb-3 flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-cyan-400" />
              Date Range
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300">From</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        "bg-gray-800 border-gray-700 text-white hover:bg-gray-700",
                        !filters.dateRange?.from && "text-gray-400"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {filters.dateRange?.from ? format(filters.dateRange.from, "PP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
                    <CalendarComponent
                      mode="single"
                      selected={filters.dateRange?.from}
                      onSelect={(date) => onFiltersChange({
                        ...filters,
                        dateRange: {
                          from: date || new Date(),
                          to: filters.dateRange?.to || addDays(date || new Date(), 7)
                        }
                      })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="text-gray-300">To</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        "bg-gray-800 border-gray-700 text-white hover:bg-gray-700",
                        !filters.dateRange?.to && "text-gray-400"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {filters.dateRange?.to ? format(filters.dateRange.to, "PP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
                    <CalendarComponent
                      mode="single"
                      selected={filters.dateRange?.to}
                      onSelect={(date) => onFiltersChange({
                        ...filters,
                        dateRange: {
                          from: filters.dateRange?.from || new Date(),
                          to: date || addDays(new Date(), 7)
                        }
                      })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Genres */}
          <div>
            <h3 className="text-sm font-medium text-white mb-3 flex items-center">
              <Music className="h-4 w-4 mr-2 text-cyan-400" />
              Genres
            </h3>
            <div className="flex flex-wrap gap-2">
              {MUSIC_GENRES.map(genre => (
                <Badge
                  key={genre}
                  variant={filters.genres?.includes(genre) ? 'default' : 'outline'}
                  className={`cursor-pointer transition-colors ${
                    filters.genres?.includes(genre)
                      ? 'bg-cyan-600 hover:bg-cyan-700'
                      : 'border-gray-700 text-gray-300 hover:bg-gray-800'
                  }`}
                  onClick={() => handleGenreToggle(genre)}
                >
                  {genre}
                </Badge>
              ))}
            </div>
          </div>

          {/* Venue Size */}
          <div>
            <Label htmlFor="venue-size" className="text-gray-300">Venue Size</Label>
            <Select
              value={filters.venueSize || 'any'}
              onValueChange={(value) => onFiltersChange({ ...filters, venueSize: value as SearchFilters['venueSize'] })}
            >
              <SelectTrigger id="venue-size" className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Any size" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="any">Any size</SelectItem>
                <SelectItem value="small">Small (&lt; 1,000)</SelectItem>
                <SelectItem value="medium">Medium (1,000 - 10,000)</SelectItem>
                <SelectItem value="large">Large (&gt; 10,000)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Show Status */}
          <div>
            <Label htmlFor="show-status" className="text-gray-300">Show Status</Label>
            <Select
              value={filters.showStatus || 'any'}
              onValueChange={(value) => onFiltersChange({ ...filters, showStatus: value as SearchFilters['showStatus'] })}
            >
              <SelectTrigger id="show-status" className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Any status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="any">Any status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="postponed">Postponed</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <Button
            variant="outline"
            onClick={() => {
              onReset();
              setOpen(false);
            }}
            className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <X className="h-4 w-4 mr-2" />
            Clear All
          </Button>
          <Button
            onClick={() => setOpen(false)}
            className="flex-1 bg-cyan-600 hover:bg-cyan-700"
          >
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AdvancedSearchFilters;