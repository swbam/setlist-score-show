
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className={`flex gap-2 w-full max-w-2xl ${isMobile ? 'flex-col' : ''}`}>
      <div className="relative flex-1">
        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${isMobile ? 'h-6 w-6' : 'h-5 w-5'}`} />
        <Input
          type="text"
          placeholder="Search for artists or shows..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-yellow-metal-400 focus:ring-yellow-metal-400 touch-manipulation ${isMobile ? 'pl-12 h-12 text-base' : 'pl-10'}`}
          style={{ color: 'white' }}
          inputMode="search"
          autoCapitalize="none"
          autoCorrect="off"
        />
      </div>
      <Button 
        type="submit" 
        className={`bg-yellow-metal-600 hover:bg-yellow-metal-700 text-black font-semibold touch-manipulation ${isMobile ? 'w-full h-12 text-base' : 'px-6'}`}
      >
        <Search className={`${isMobile ? 'h-5 w-5 mr-2' : 'mr-0'}`} />
        Search
      </Button>
    </form>
  );
};

export default SearchBar;
