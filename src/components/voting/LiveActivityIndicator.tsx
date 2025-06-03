import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Wifi, WifiOff } from 'lucide-react';

interface LiveActivityIndicatorProps {
  showId: string;
  isConnected?: boolean;
}

export function LiveActivityIndicator({ showId, isConnected = true }: LiveActivityIndicatorProps) {
  const [activeUsers, setActiveUsers] = useState(0);
  const [showPulse, setShowPulse] = useState(false);
  
  useEffect(() => {
    const channel = supabase.channel(`show:${showId}:presence`);
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const uniqueUsers = Object.keys(state).length;
        
        // Show pulse animation when users change
        if (uniqueUsers !== activeUsers && activeUsers > 0) {
          setShowPulse(true);
          setTimeout(() => setShowPulse(false), 1000);
        }
        
        setActiveUsers(uniqueUsers);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await channel.track({ 
              online_at: new Date().toISOString(),
              user_id: user.id
            });
          }
        }
      });
    
    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [showId, activeUsers]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-20 sm:bottom-6 right-4 z-40"
    >
      <div className="bg-gray-900/95 backdrop-blur-sm rounded-full px-4 py-2.5 flex items-center gap-3 shadow-xl border border-gray-800">
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" />
          )}
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} ${isConnected && 'animate-pulse'}`} />
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-gray-700" />

        {/* Active Users */}
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-teal-500" />
          <AnimatePresence mode="popLayout">
            <motion.span
              key={activeUsers}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                scale: showPulse ? [1, 1.2, 1] : 1 
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-sm font-medium tabular-nums"
            >
              {activeUsers}
            </motion.span>
          </AnimatePresence>
          <span className="text-sm text-gray-400">
            {activeUsers === 1 ? 'voting' : 'voting'}
          </span>
        </div>
      </div>

      {/* Tooltip on hover */}
      <div className="absolute bottom-full right-0 mb-2 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-gray-800 text-xs text-gray-300 px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
          {isConnected ? 'Live updates active' : 'Reconnecting...'}
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800" />
        </div>
      </div>
    </motion.div>
  );
}