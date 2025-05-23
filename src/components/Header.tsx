
import { Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/80">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Link to="/">
            <h1 className="text-2xl font-bold text-white">TheSet</h1>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-slate-300 hover:text-white transition-colors">
            Home
          </Link>
          <Link to="/artists" className="text-slate-300 hover:text-white transition-colors">
            Artists
          </Link>
          <Link to="/shows" className="text-slate-300 hover:text-white transition-colors">
            Upcoming Shows
          </Link>
          <Link to="/how-it-works" className="text-slate-300 hover:text-white transition-colors">
            How It Works
          </Link>
          <Link to="/tests/data-sync" className="text-slate-300 hover:text-white transition-colors">
            Run Tests
          </Link>
        </nav>

        {/* Search & Auth */}
        <div className="flex items-center space-x-4">
          <div className="hidden sm:block relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search artists..."
              className="w-64 pl-10 bg-slate-900 border-slate-700 focus:border-white"
            />
          </div>
          <Link to="/login">
            <Button className="bg-white hover:bg-slate-200 text-black">
              Log In
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
