
import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Search, MapPin, Calendar, Music, Mic, X } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import AppHeader from "@/components/AppHeader";
import * as searchService from "@/services/search";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";

const AdvancedSearch = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Parse query params
  const queryParams = new URLSearchParams(location.search);
  
  const [searchQuery, setSearchQuery] = useState(queryParams.get("q") || "");
  const [locationQuery, setLocationQuery] = useState(queryParams.get("location") || "");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(queryParams.get("from") ? new Date(queryParams.get("from") || "") : undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(queryParams.get("to") ? new Date(queryParams.get("to") || "") : undefined);
  const [sortBy, setSortBy] = useState<"relevance" | "date" | "name">(
    queryParams.get("sort") as "relevance" | "date" | "name" || "relevance"
  );
  const [activeTab, setActiveTab] = useState(queryParams.get("tab") || "all");
  
  const [results, setResults] = useState<searchService.SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDateFromOpen, setIsDateFromOpen] = useState(false);
  const [isDateToOpen, setIsDateToOpen] = useState(false);
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const debouncedLocationQuery = useDebounce(locationQuery, 300);
  
  // Filtered results based on active tab
  const filteredResults = activeTab === "all" 
    ? results 
    : results.filter(result => result.type === activeTab);
  
  // Count results by type
  const artistCount = results.filter(result => result.type === "artist").length;
  const showCount = results.filter(result => result.type === "show").length;
  
  // Update URL with search params
  const updateSearchParams = () => {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set("q", searchQuery);
    if (locationQuery) params.set("location", locationQuery);
    if (dateFrom) params.set("from", dateFrom.toISOString().split('T')[0]);
    if (dateTo) params.set("to", dateTo.toISOString().split('T')[0]);
    if (sortBy !== "relevance") params.set("sort", sortBy);
    if (activeTab !== "all") params.set("tab", activeTab);
    
    navigate(`/search?${params.toString()}`, { replace: true });
  };
  
  // Perform search when inputs change
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchQuery && !debouncedLocationQuery && !dateFrom && !dateTo) {
        setResults([]);
        return;
      }
      
      setIsLoading(true);
      
      try {
        const searchResults = await searchService.search({
          query: debouncedSearchQuery,
          location: debouncedLocationQuery,
          dateFrom,
          dateTo,
          sortBy,
          limit: 40
        });
        
        setResults(searchResults);
        
        // Store results in background to build up database
        searchService.storeSearchResults(searchResults).catch(console.error);
      } catch (error) {
        console.error("Search error:", error);
        toast.error("An error occurred during search");
      } finally {
        setIsLoading(false);
      }
    };
    
    performSearch();
    updateSearchParams();
  }, [debouncedSearchQuery, debouncedLocationQuery, dateFrom, dateTo, sortBy]);
  
  // Update tab in URL when changed
  useEffect(() => {
    updateSearchParams();
  }, [activeTab]);
  
  // Format date for display
  const formatDate = (date: Date | undefined) => {
    if (!date) return "";
    return format(date, "MMM d, yyyy");
  };
  
  // Clear all filters
  const clearFilters = () => {
    setLocationQuery("");
    setDateFrom(undefined);
    setDateTo(undefined);
    setSortBy("relevance");
  };
  
  // Handle search form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearchParams();
  };
  
  const hasFilters = locationQuery || dateFrom || dateTo || sortBy !== "relevance";
  
  return (
    <div className="min-h-screen bg-black">
      <AppHeader />
      <div className="container mx-auto max-w-7xl px-4 pt-24 pb-16">
        {/* Search Form */}
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="Search for artists, shows, venues..."
              className="w-full py-6 pl-10 pr-4 bg-slate-900/70 border-slate-700 focus:border-white text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Advanced Filters */}
          <div className="mt-4 flex flex-col sm:flex-row gap-4">
            {/* Location Filter */}
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Location"
                className="w-full pl-10 bg-slate-900/70 border-slate-700"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
              />
            </div>
            
            {/* Date From Filter */}
            <Popover open={isDateFromOpen} onOpenChange={setIsDateFromOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal border-slate-700 bg-slate-900/70">
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateFrom ? formatDate(dateFrom) : "Start Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateFrom}
                  onSelect={(date) => {
                    setDateFrom(date);
                    setIsDateFromOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            {/* Date To Filter */}
            <Popover open={isDateToOpen} onOpenChange={setIsDateToOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal border-slate-700 bg-slate-900/70">
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateTo ? formatDate(dateTo) : "End Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateTo}
                  onSelect={(date) => {
                    setDateTo(date);
                    setIsDateToOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Sort Options */}
          <div className="mt-4 flex justify-between items-center">
            <RadioGroup 
              value={sortBy} 
              onValueChange={(value) => setSortBy(value as "relevance" | "date" | "name")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="relevance" id="sort-relevance" />
                <Label htmlFor="sort-relevance" className="text-slate-400">Best Match</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="date" id="sort-date" />
                <Label htmlFor="sort-date" className="text-slate-400">Date</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="name" id="sort-name" />
                <Label htmlFor="sort-name" className="text-slate-400">Name</Label>
              </div>
            </RadioGroup>
            
            {hasFilters && (
              <Button 
                variant="link" 
                onClick={clearFilters}
                className="text-slate-400 hover:text-white"
              >
                Clear Filters <X className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
        
        {/* Results Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="bg-slate-900/50 w-full justify-start border border-slate-800 p-1">
            <TabsTrigger value="all" className="relative">
              All Results
              <span className="ml-1 inline-block px-1.5 py-0.5 text-xs font-medium bg-slate-800/80 rounded-full">
                {results.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="artist" className="relative">
              Artists
              <span className="ml-1 inline-block px-1.5 py-0.5 text-xs font-medium bg-slate-800/80 rounded-full">
                {artistCount}
              </span>
            </TabsTrigger>
            <TabsTrigger value="show" className="relative">
              Shows
              <span className="ml-1 inline-block px-1.5 py-0.5 text-xs font-medium bg-slate-800/80 rounded-full">
                {showCount}
              </span>
            </TabsTrigger>
          </TabsList>
          
          {/* No Results State */}
          {!isLoading && filteredResults.length === 0 && (searchQuery || locationQuery || dateFrom || dateTo) && (
            <div className="text-center py-16 bg-slate-900/50 mt-8 rounded-lg border border-slate-800">
              <Search className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No results found</h3>
              <p className="text-slate-400 mb-6">
                Try adjusting your search or filters to find what you're looking for
              </p>
              <Button onClick={clearFilters}>Clear All Filters</Button>
            </div>
          )}
          
          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8 mt-8">
              <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-400">Searching...</p>
            </div>
          )}
          
          {/* Results Content */}
          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredResults.map((result) => (
                <ResultCard key={`${result.type}-${result.id}`} result={result} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="artist" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredResults.map((result) => (
                <ResultCard key={`${result.type}-${result.id}`} result={result} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="show" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredResults.map((result) => (
                <ResultCard key={`${result.type}-${result.id}`} result={result} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Result Card component
const ResultCard = ({ result }: { result: searchService.SearchResult }) => {
  // Format date for shows
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Date TBA";
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (e) {
      return "Date TBA";
    }
  };
  
  // Different card based on result type
  if (result.type === "artist") {
    return (
      <Link to={`/artist/${result.id}`}>
        <Card className="bg-slate-900 border-slate-800 overflow-hidden hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300">
          <div className="h-48 bg-slate-800 relative">
            {result.image_url ? (
              <img
                src={result.image_url}
                alt={result.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                <Mic className="h-12 w-12 text-slate-600" />
              </div>
            )}
          </div>
          <CardContent className="p-4">
            <h3 className="text-lg font-medium text-white truncate">{result.name}</h3>
            <p className="text-sm text-cyan-400 mt-1">Artist</p>
          </CardContent>
        </Card>
      </Link>
    );
  } else {
    return (
      <Link to={`/show/${result.id}`}>
        <Card className="bg-slate-900 border-slate-800 overflow-hidden hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300">
          <div className="h-48 bg-slate-800 relative">
            {result.image_url ? (
              <img
                src={result.image_url}
                alt={result.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                <Music className="h-12 w-12 text-slate-600" />
              </div>
            )}
          </div>
          <CardContent className="p-4">
            <h3 className="text-lg font-medium text-white truncate">{result.name}</h3>
            {result.artist_name && (
              <p className="text-sm text-cyan-400 mt-1">{result.artist_name}</p>
            )}
            <div className="flex items-center gap-1 mt-2 text-sm text-slate-400">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDate(result.date)}</span>
            </div>
            {result.venue && result.location && (
              <div className="flex items-center gap-1 mt-1 text-sm text-slate-400">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate">{result.venue}, {result.location}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    );
  }
};

export default AdvancedSearch;
