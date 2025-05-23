import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
          isScrolled ? "bg-gray-900/95 backdrop-blur-md py-2 shadow-md" : "bg-transparent py-4"
        }`}
      >
        <div className="w-full max-w-full px-4 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div
              className="flex items-center cursor-pointer"
              onClick={handleLogoClick}
            >
              <div className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full p-2 mr-2">
                <Music className="h-5 w-5 text-white" />
              </div>
              <span className="text-white text-xl font-bold">TheSet</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                to="/"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Home
              </Link>
              <Link
                to="/artists"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Artists
              </Link>
              {user && (
                <Link
                  to="/profile"
                  className="text-gray-300 hover:text-white transition-colors"
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
                className="text-gray-300 hover:text-white hover:bg-gray-800"
                onClick={handleSearch}
              >
                <Search className="h-5 w-5" />
              </Button>

              {isLoading ? (
                <div className="h-9 w-9 rounded-full bg-gray-700 animate-pulse"></div>
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-9 w-9 rounded-full"
                    >
                      <Avatar className="h-9 w-9">
                        {userProfile?.avatar_url ? (
                          <AvatarImage
                            src={userProfile.avatar_url}
                            alt={userProfile.display_name}
                          />
                        ) : (
                          <AvatarFallback className="bg-cyan-700 text-white">
                            {userProfile?.display_name
                              ? userProfile.display_name.charAt(0).toUpperCase()
                              : "U"}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-56 bg-gray-900 border-gray-800 text-white"
                    align="end"
                    forceMount
                  >
                    <DropdownMenuLabel>
                      {formatDisplayName()}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-800" />
                    <DropdownMenuItem
                      className="cursor-pointer flex items-center hover:bg-gray-800"
                      onClick={handleProfileClick}
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-800" />
                    <DropdownMenuItem
                      className="cursor-pointer flex items-center hover:bg-gray-800 focus:bg-gray-800"
                      onClick={signOut}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={() => navigate("/login")}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  Login
                </Button>
              )}
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-gray-300"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
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
