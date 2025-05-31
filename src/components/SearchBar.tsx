
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-2xl">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          type="text"
          placeholder="Search for artists or shows..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-yellow-metal-400 focus:ring-yellow-metal-400"
          style={{ color: 'white' }}
        />
      </div>
      <Button 
        type="submit" 
        className="bg-yellow-metal-600 hover:bg-yellow-metal-700 text-black font-semibold px-6"
      >
        Search
      </Button>
    </form>
  );
};

export default SearchBar;
