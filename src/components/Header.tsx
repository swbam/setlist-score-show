
import { Search, Filter, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/80">
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
            All Shows
          </Link>
          <Link to="/trending" className="text-slate-300 hover:text-white transition-colors">
            Trending
          </Link>
          <Link to="/voting" className="text-slate-300 hover:text-white transition-colors">
            Voting Open
          </Link>
          <Link to="/rock" className="text-slate-300 hover:text-white transition-colors">
            Rock
          </Link>
        </nav>

        {/* Search & Auth */}
        <div className="flex items-center space-x-4">
          <div className="hidden sm:block relative">
            <Button variant="outline" className="bg-black/70 border-gray-700 text-white hover:bg-white/10">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
          <Button variant="outline" className="bg-black/70 border-gray-700 text-white hover:bg-white/10">
            <CalendarDays className="h-4 w-4 mr-2" />
            Date
          </Button>
          <Link to="/login">
            <Button className="bg-white hover:bg-gray-100 text-black">
              Log In
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
