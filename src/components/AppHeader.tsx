import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Search, User, LogOut, Home, Music, Sparkles } from "lucide-react";
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

const AppHeader = () => {
  const navigate = useNavigate();
  const { user, userProfile, isLoading, signOut } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      {/* Desktop Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? "bg-dark-900/95 backdrop-blur-md py-3 border-b border-dark-800" 
            : "bg-transparent py-5"
        }`}
      >
        <div className="w-full max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div
              className="flex items-center gap-2 cursor-pointer group"
              onClick={handleLogoClick}
            >
              <div className="p-2 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl group-hover:from-teal-600 group-hover:to-teal-700 transition-all duration-200">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-white text-xl font-bold tracking-tight">TheSet</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                to="/"
                className="text-gray-400 hover:text-white transition-colors font-medium"
              >
                Home
              </Link>
              <Link
                to="/artists"
                className="text-gray-400 hover:text-white transition-colors font-medium"
              >
                Artists
              </Link>
              <Link
                to="/search"
                className="text-gray-400 hover:text-white transition-colors font-medium"
              >
                Shows
              </Link>
              {user && (
                <Link
                  to="/profile"
                  className="text-gray-400 hover:text-white transition-colors font-medium"
                >
                  My Artists
                </Link>
              )}
            </nav>

            {/* Desktop Right Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white hover:bg-dark-800"
                onClick={handleSearch}
              >
                <Search className="h-5 w-5" />
              </Button>

              {isLoading ? (
                <div className="h-10 w-10 rounded-full bg-dark-800 animate-pulse"></div>
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-teal-500/50 transition-all"
                    >
                      <Avatar className="h-10 w-10">
                        {userProfile?.avatar_url ? (
                          <AvatarImage
                            src={userProfile.avatar_url}
                            alt={userProfile.display_name}
                          />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-600 text-white">
                            {userProfile?.display_name
                              ? userProfile.display_name.charAt(0).toUpperCase()
                              : "U"}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-56 bg-dark-800 border-dark-700 text-white"
                    align="end"
                    forceMount
                  >
                    <DropdownMenuLabel className="text-gray-300">
                      {formatDisplayName()}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-dark-700" />
                    <DropdownMenuItem
                      className="cursor-pointer flex items-center hover:bg-dark-700 focus:bg-dark-700"
                      onClick={handleProfileClick}
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-dark-700" />
                    <DropdownMenuItem
                      className="cursor-pointer flex items-center hover:bg-dark-700 focus:bg-dark-700 text-red-400 hover:text-red-300"
                      onClick={signOut}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => navigate("/login")}
                    variant="ghost"
                    className="text-gray-400 hover:text-white hover:bg-dark-800"
                  >
                    Login
                  </Button>
                  <Button
                    onClick={() => navigate("/signup")}
                    className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-medium"
                  >
                    Sign up
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-gray-400 hover:text-white hover:bg-dark-800"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-dark-900 z-50 md:hidden">
          <div className="flex flex-col h-full">
            {/* Mobile Header */}
            <div className="flex justify-between items-center p-6 border-b border-dark-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-white text-xl font-bold">TheSet</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white hover:bg-dark-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Mobile Navigation */}
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col p-6 space-y-2">
                <Link
                  to="/"
                  className="flex items-center py-3 px-4 text-lg text-gray-300 hover:text-white hover:bg-dark-800 rounded-xl transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Home className="mr-3 h-5 w-5" />
                  Home
                </Link>
                <Link
                  to="/artists"
                  className="flex items-center py-3 px-4 text-lg text-gray-300 hover:text-white hover:bg-dark-800 rounded-xl transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Music className="mr-3 h-5 w-5" />
                  Artists
                </Link>
                <Link
                  to="/search"
                  className="flex items-center py-3 px-4 text-lg text-gray-300 hover:text-white hover:bg-dark-800 rounded-xl transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Search className="mr-3 h-5 w-5" />
                  Search Shows
                </Link>
                
                {user && (
                  <Link
                    to="/profile"
                    className="flex items-center py-3 px-4 text-lg text-gray-300 hover:text-white hover:bg-dark-800 rounded-xl transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="mr-3 h-5 w-5" />
                    My Artists
                  </Link>
                )}
              </div>
            </div>

            {/* Mobile Footer */}
            <div className="p-6 border-t border-dark-800">
              {user ? (
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center p-3 bg-dark-800 rounded-xl">
                    <Avatar className="h-12 w-12 mr-3">
                      {userProfile?.avatar_url ? (
                        <AvatarImage
                          src={userProfile.avatar_url}
                          alt={userProfile?.display_name || "User"}
                        />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-600 text-white">
                          {userProfile?.display_name
                            ? userProfile.display_name.charAt(0).toUpperCase()
                            : "U"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <div className="text-white font-medium">{formatDisplayName()}</div>
                      <div className="text-gray-500 text-sm">{user.email}</div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-dark-700 text-red-400 hover:text-red-300 hover:bg-dark-800"
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
                    variant="outline"
                    className="w-full border-dark-700 text-white hover:bg-dark-800"
                  >
                    Login
                  </Button>
                  <Button
                    onClick={() => {
                      navigate("/signup");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white"
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
