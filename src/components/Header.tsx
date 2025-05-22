
import { Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/80">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold gradient-text">TheSet</h1>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <a href="#" className="text-gray-300 hover:text-white transition-colors">
            Home
          </a>
          <a href="#" className="text-gray-300 hover:text-white transition-colors">
            Artists
          </a>
          <a href="#" className="text-gray-300 hover:text-white transition-colors">
            Upcoming Shows
          </a>
          <a href="#" className="text-gray-300 hover:text-white transition-colors">
            How It Works
          </a>
        </nav>

        {/* Search & Auth */}
        <div className="flex items-center space-x-4">
          <div className="hidden sm:block relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search artists..."
              className="w-64 pl-10 bg-gray-900 border-gray-700 focus:border-cyan-500"
            />
          </div>
          <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
            Log In
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
