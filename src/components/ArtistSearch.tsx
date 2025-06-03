
import React from "react";
import { Search, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface ArtistSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearch: (e: React.FormEvent) => void;
  handleReset?: () => void;
  loading?: boolean;
  placeholder?: string;
  buttonText?: string;
  className?: string;
}

const ArtistSearch = ({
  searchQuery,
  setSearchQuery,
  handleSearch,
  handleReset,
  loading = false,
  placeholder = "Search artists...",
  buttonText = "Refresh",
  className = ""
}: ArtistSearchProps) => {
  const isMobile = useIsMobile();
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const mockEvent = { preventDefault: () => {} } as React.FormEvent;
      handleSearch(mockEvent);
    }
  };
  
  return (
    <div className={`w-full md:w-auto ${isMobile ? 'flex flex-col gap-3' : 'flex gap-4'} ${className}`}>
      <form onSubmit={handleSearch} className={`relative ${isMobile ? 'w-full' : 'flex-1 md:flex-none md:w-64'}`}>
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 ${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
        <Input
          placeholder={placeholder}
          className={`bg-gray-900 border-gray-800 touch-manipulation ${isMobile ? 'pl-12 h-12 text-base' : 'pl-10'}`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyUp={handleKeyPress}
          inputMode="search"
          autoCapitalize="none"
          autoCorrect="off"
        />
      </form>
      
      {handleReset && (
        <Button
          variant="outline"
          className={`border-gray-700 text-gray-300 touch-manipulation ${isMobile ? 'w-full h-12' : ''}`}
          onClick={handleReset}
          type="button"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {buttonText}
        </Button>
      )}
    </div>
  );
};

export default ArtistSearch;
