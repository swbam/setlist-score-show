import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Home, Search, User, Music, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const MobileNav = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  const navItems = [
    {
      title: 'Home',
      href: '/',
      icon: Home,
    },
    {
      title: 'Search',
      href: '/search',
      icon: Search,
    },
    {
      title: 'Trending',
      href: '/artists',
      icon: TrendingUp,
    },
    {
      title: 'My Artists',
      href: '/profile',
      icon: Music,
      requiresAuth: true,
    },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="pr-0 bg-gray-900 border-gray-800">
          <div className="flex items-center justify-between mb-8">
            <Link
              to="/"
              className="flex items-center space-x-2"
              onClick={() => setOpen(false)}
            >
              <Music className="h-8 w-8 text-cyan-400" />
              <span className="font-bold text-xl text-white">TheSet</span>
            </Link>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <nav className="flex flex-col space-y-3">
            {navItems.map((item) => {
              if (item.requiresAuth && !user) return null;
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                    isActive(item.href)
                      ? "bg-cyan-600/20 text-cyan-400"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-base font-medium">{item.title}</span>
                </Link>
              );
            })}
          </nav>

          <div className="absolute bottom-8 left-0 right-0 px-6">
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 px-3 py-2">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">
                      {user.email}
                    </p>
                    <p className="text-xs text-gray-400">
                      Logged in
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    signOut();
                    setOpen(false);
                  }}
                  variant="outline"
                  className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                >
                  <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
                    Sign In
                  </Button>
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setOpen(false)}
                >
                  <Button
                    variant="outline"
                    className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MobileNav;