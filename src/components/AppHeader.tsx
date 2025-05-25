import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Search, User, LogOut, Music, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { useMobile } from "@/context/MobileContext";
import { cn } from "@/lib/utils";
import MobileNav from "@/components/MobileNav";

const AppHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userProfile, isLoading, signOut } = useAuth();
  const { isMobile } = useMobile();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSpotifyLoading, setIsSpotifyLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Track scroll position for header styling
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = () => {
    navigate("/search");
  };

  const handleProfileClick = () => {
    navigate("/profile");
  };

  const handleLogoClick = () => {
    navigate("/");
  };

  // Format the user's name
  const formatDisplayName = () => {
    if (userProfile?.display_name) {
      return userProfile.display_name.length > 15
        ? `${userProfile.display_name.slice(0, 12)}...`
        : userProfile.display_name;
    }
    return "User";
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/60">
        <div className="container flex h-14 items-center justify-between px-4 mx-auto max-w-screen-2xl">
          {/* Mobile Navigation */}
          <div className="flex items-center gap-4">
            <MobileNav />
            
            {/* Logo - Hidden on mobile when search is open */}
            <Link
              to="/"
              className={cn(
                "flex items-center space-x-2 transition-opacity",
                isSearchOpen && isMobile ? "opacity-0 pointer-events-none" : "opacity-100"
              )}
            >
              <Music className="h-6 w-6 text-cyan-400" />
              <span className="font-bold text-lg hidden sm:inline-block">TheSet</span>
            </Link>
          </div>

          {/* Search Bar - Expandable on mobile */}
          <div className={cn(
            "flex items-center transition-all duration-300",
            isSearchOpen && isMobile ? "flex-1 ml-2" : isMobile ? "w-auto" : "flex-1 max-w-md mx-4"
          )}>
            {/* ... existing search implementation ... */}
          </div>

          {/* Desktop Navigation - Hidden on mobile */}
          <nav className="hidden md:flex items-center space-x-1">
            {/* ... existing desktop navigation ... */}
          </nav>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black z-50 md:hidden">
          <div className="flex flex-col h-full p-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full p-2 mr-2">
                  <Music className="h-5 w-5 text-white" />
                </div>
                <span className="text-white text-xl font-bold">TheSet</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-300"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            <div className="flex flex-col space-y-4 mt-12">
              <Link
                to="/"
                className="flex items-center py-3 px-4 text-lg text-white hover:bg-gray-800 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Home className="mr-3 h-5 w-5" />
                Home
              </Link>
              <Link
                to="/artists"
                className="flex items-center py-3 px-4 text-lg text-white hover:bg-gray-800 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Music className="mr-3 h-5 w-5" />
                Artists
              </Link>
              <Link
                to="/search"
                className="flex items-center py-3 px-4 text-lg text-white hover:bg-gray-800 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Search className="mr-3 h-5 w-5" />
                Search
              </Link>
              
              {user && (
                <Link
                  to="/profile"
                  className="flex items-center py-3 px-4 text-lg text-white hover:bg-gray-800 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="mr-3 h-5 w-5" />
                  My Artists
                </Link>
              )}
            </div>

            <div className="mt-auto pt-6 border-t border-gray-800">
              {user ? (
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                      {userProfile?.avatar_url ? (
                        <AvatarImage
                          src={userProfile.avatar_url}
                          alt={userProfile?.display_name || "User"}
                        />
                      ) : (
                        <AvatarFallback className="bg-cyan-700 text-white">
                          {userProfile?.display_name
                            ? userProfile.display_name.charAt(0).toUpperCase()
                            : "U"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <div className="text-white font-medium">{formatDisplayName()}</div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-gray-700 text-white"
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col space-y-3">
                  <Button
                    onClick={() => {
                      navigate("/login");
                      setMobileMenuOpen(false);
                    }}
                    className="bg-cyan-600 hover:bg-cyan-700 w-full"
                  >
                    Login
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigate("/signup");
                      setMobileMenuOpen(false);
                    }}
                    className="border-gray-700 text-white w-full"
                  >
                    Sign up
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AppHeader;
