
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface ConnectionState {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastUpdate: Date | null;
  reconnectCount: number;
}

interface RealtimeConnectionOptions {
  channel: string;
  onUpdate?: (payload: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
}

export function useRealtimeConnection({
  channel,
  onUpdate,
  onConnect,
  onDisconnect,
  onError,
  autoReconnect = true,
  maxReconnectAttempts = 5
}: RealtimeConnectionOptions) {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
    lastUpdate: null,
    reconnectCount: 0
  });

  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isManualDisconnect = useRef(false);

  const connect = useCallback(() => {
    if (channelRef.current) {
      return; // Already connected or connecting
    }

    setConnectionState(prev => ({ ...prev, status: 'connecting' }));

    try {
      const realtimeChannel = supabase.channel(channel);

      // Handle connection events
      realtimeChannel
        .on('broadcast', { event: 'update' }, (payload) => {
          setConnectionState(prev => ({
            ...prev,
            status: 'connected',
            lastUpdate: new Date()
          }));
          onUpdate?.(payload);
        })
        .on('presence', { event: 'sync' }, () => {
          setConnectionState(prev => ({ ...prev, status: 'connected' }));
          onConnect?.();
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setConnectionState(prev => ({
              ...prev,
              status: 'connected',
              reconnectCount: 0
            }));
            onConnect?.();
          } else if (status === 'CLOSED') {
            setConnectionState(prev => ({ ...prev, status: 'disconnected' }));
            onDisconnect?.();
            
            // Auto-reconnect if enabled and not manually disconnected
            if (autoReconnect && !isManualDisconnect.current) {
              handleReconnect();
            }
          } else if (status === 'CHANNEL_ERROR') {
            setConnectionState(prev => ({ ...prev, status: 'error' }));
            onError?.('Channel error occurred');
            
            if (autoReconnect && !isManualDisconnect.current) {
              handleReconnect();
            }
          }
        });

      channelRef.current = realtimeChannel;
    } catch (error) {
      setConnectionState(prev => ({ ...prev, status: 'error' }));
      onError?.(error);
    }
  }, [channel, onUpdate, onConnect, onDisconnect, onError, autoReconnect]);

  const disconnect = useCallback(() => {
    isManualDisconnect.current = true;
    
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setConnectionState(prev => ({ ...prev, status: 'disconnected' }));
  }, []);

  const handleReconnect = useCallback(() => {
    if (connectionState.reconnectCount >= maxReconnectAttempts) {
      setConnectionState(prev => ({ ...prev, status: 'error' }));
      onError?.('Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, connectionState.reconnectCount), 30000);
    
    setConnectionState(prev => ({
      ...prev,
      reconnectCount: prev.reconnectCount + 1
    }));

    reconnectTimeoutRef.current = setTimeout(() => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      connect();
    }, delay);
  }, [connectionState.reconnectCount, maxReconnectAttempts, connect, onError]);

  const forceReconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      isManualDisconnect.current = false;
      connect();
    }, 1000);
  }, [connect, disconnect]);

  // Auto-connect on mount
  useEffect(() => {
    isManualDisconnect.current = false;
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    connectionState,
    connect,
    disconnect,
    forceReconnect,
    isConnected: connectionState.status === 'connected'
  };
}

// Enhanced hook for setlist voting with real-time updates
export function useRealtimeVoting(setlistId: string, onVoteUpdate?: (songId: string, votes: number) => void) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingVotes, setPendingVotes] = useState<string[]>([]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const connection = useRealtimeConnection({
    channel: `setlist-voting-${setlistId}`,
    onUpdate: (payload) => {
      if (payload.event === 'vote_update' && onVoteUpdate) {
        onVoteUpdate(payload.song_id, payload.votes);
      }
    },
    onConnect: () => {
      console.log('✅ Real-time voting connected');
      
      // Process any pending votes when back online
      if (pendingVotes.length > 0) {
        console.log(`📤 Processing ${pendingVotes.length} pending votes`);
        // Here you would sync pending votes
        setPendingVotes([]);
      }
    },
    onDisconnect: () => {
      console.log('❌ Real-time voting disconnected');
    },
    onError: (error) => {
      console.error('❌ Real-time voting error:', error);
    }
  });

  const addPendingVote = useCallback((songId: string) => {
    if (!isOnline) {
      setPendingVotes(prev => [...prev, songId]);
    }
  }, [isOnline]);

  return {
    ...connection,
    isOnline,
    pendingVotes: pendingVotes.length,
    addPendingVote
  };
}
