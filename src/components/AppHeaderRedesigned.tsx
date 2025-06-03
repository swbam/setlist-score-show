import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Search, User, LogOut, Home, Music } from "lucide-react";
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

const AppHeaderRedesigned = () => {
  const navigate = useNavigate();
  const { user, userProfile, isLoading, signOut } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = () => {
    navigate("/search");
  };

  const handleLogoClick = () => {
    navigate("/");
  };

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
            ? "bg-black/95 backdrop-blur-md py-3 border-b border-gray-900" 
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
              <span className="text-[#00FF88] text-2xl font-bold">TheSet</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                to="/"
                className="text-gray-400 hover:text-[#00FF88] transition-colors font-medium"
              >
                Home
              </Link>
              <Link
                to="/artists"
                className="text-gray-400 hover:text-[#00FF88] transition-colors font-medium"
              >
                Artists
              </Link>
              <Link
                to="/search"
                className="text-gray-400 hover:text-[#00FF88] transition-colors font-medium"
              >
                Shows
              </Link>
              {user && (
                <Link
                  to="/profile"
                  className="text-gray-400 hover:text-[#00FF88] transition-colors font-medium"
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
                className="text-gray-400 hover:text-[#00FF88] hover:bg-gray-900"
                onClick={handleSearch}
              >
                <Search className="h-5 w-5" />
              </Button>

              {isLoading ? (
                <div className="h-10 w-10 rounded-full bg-gray-900 animate-pulse"></div>
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-[#00FF88]/50 transition-all"
                    >
                      <Avatar className="h-10 w-10">
                        {userProfile?.avatar_url ? (
                          <AvatarImage
                            src={userProfile.avatar_url}
                            alt={userProfile.display_name}
                          />
                        ) : (
                          <AvatarFallback className="bg-[#00FF88] text-black">
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
                    <DropdownMenuLabel className="text-gray-300">
                      {formatDisplayName()}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-800" />
                    <DropdownMenuItem
                      className="cursor-pointer flex items-center hover:bg-gray-800 focus:bg-gray-800"
                      onClick={() => navigate("/profile")}
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-800" />
                    <DropdownMenuItem
                      className="cursor-pointer flex items-center hover:bg-gray-800 focus:bg-gray-800 text-red-400 hover:text-red-300"
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
                    className="text-gray-400 hover:text-white hover:bg-gray-900"
                  >
                    Login
                  </Button>
                  <Button
                    onClick={() => navigate("/signup")}
                    className="bg-[#00FF88] hover:bg-[#00E67A] text-black font-medium"
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
              className="md:hidden text-gray-400 hover:text-white hover:bg-gray-900"
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
          <div className="flex flex-col h-full">
            {/* Mobile Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-900">
              <span className="text-[#00FF88] text-2xl font-bold">TheSet</span>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white hover:bg-gray-900"
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
                  className="flex items-center py-3 px-4 text-lg text-gray-300 hover:text-[#00FF88] hover:bg-gray-900 rounded-lg transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Home className="mr-3 h-5 w-5" />
                  Home
                </Link>
                <Link
                  to="/artists"
                  className="flex items-center py-3 px-4 text-lg text-gray-300 hover:text-[#00FF88] hover:bg-gray-900 rounded-lg transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Music className="mr-3 h-5 w-5" />
                  Artists
                </Link>
                <Link
                  to="/search"
                  className="flex items-center py-3 px-4 text-lg text-gray-300 hover:text-[#00FF88] hover:bg-gray-900 rounded-lg transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Search className="mr-3 h-5 w-5" />
                  Search Shows
                </Link>
                
                {user && (
                  <Link
                    to="/profile"
                    className="flex items-center py-3 px-4 text-lg text-gray-300 hover:text-[#00FF88] hover:bg-gray-900 rounded-lg transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="mr-3 h-5 w-5" />
                    My Artists
                  </Link>
                )}
              </div>
            </div>

            {/* Mobile Footer */}
            <div className="p-6 border-t border-gray-900">
              {user ? (
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center p-3 bg-gray-900 rounded-lg">
                    <Avatar className="h-12 w-12 mr-3">
                      {userProfile?.avatar_url ? (
                        <AvatarImage
                          src={userProfile.avatar_url}
                          alt={userProfile?.display_name || "User"}
                        />
                      ) : (
                        <AvatarFallback className="bg-[#00FF88] text-black">
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
                    className="w-full border-gray-800 text-red-400 hover:text-red-300 hover:bg-gray-900"
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
                    className="w-full border-gray-800 text-white hover:bg-gray-900"
                  >
                    Login
                  </Button>
                  <Button
                    onClick={() => {
                      navigate("/signup");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-[#00FF88] hover:bg-[#00E67A] text-black"
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

export default AppHeaderRedesigned;