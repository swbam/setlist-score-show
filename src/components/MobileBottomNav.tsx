
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Music, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: Music, label: 'Artists', path: '/artists' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-yellow-metal-950/95 backdrop-blur-md border-t border-yellow-metal-800 mobile-bottom-nav md:hidden">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.path || 
                          (pathname !== '/' && item.path !== '/' && pathname.startsWith(item.path));
          
          return (
            <button
              key={item.path}
              className={cn(
                "flex flex-col items-center justify-center native-tap",
                isActive ? "text-yellow-metal-300" : "text-yellow-metal-600"
              )}
              onClick={() => navigate(item.path)}
            >
              <item.icon className={cn(
                "h-5 w-5 mb-1",
                isActive ? "text-yellow-metal-300" : "text-yellow-metal-600"
              )} />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;
