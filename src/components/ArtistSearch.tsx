
import React from "react";
import { Search, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ArtistSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearch: (e: React.FormEvent) => void;
  handleReset: () => void;
  loading: boolean;
}

const ArtistSearch = ({
  searchQuery,
  setSearchQuery,
  handleSearch,
  handleReset,
  loading
}: ArtistSearchProps) => {
  return (
    <div className="w-full md:w-auto flex gap-4">
      <form onSubmit={handleSearch} className="relative flex-1 md:flex-none md:w-64">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input
          placeholder="Search artists..."
          className="pl-10 bg-gray-900 border-gray-800"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </form>
      
      <Button
        variant="outline"
        className="border-gray-700 text-gray-300"
        onClick={handleReset}
        type="button"
        disabled={loading}
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
    </div>
  );
};

export default ArtistSearch;
