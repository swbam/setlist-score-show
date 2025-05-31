import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { cacheService } from './cacheService';

interface VoteUpdate {
  song_id: string;
  setlist_id: string;
  vote_count: number;
  user_vote?: boolean;
  confidence_score?: number;
  trending_factor?: number;
}

interface ShowUpdate {
  show_id: string;
  total_votes: number;
  active_voters: number;
  trending_score?: number;
}

interface ConnectionState {
  isConnected: boolean;
  retryCount: number;
  lastError?: string;
}

interface ChannelInfo {
  channel: RealtimeChannel;
  createdAt: number;
  isActive: boolean;
}

class RealtimeService {
  private channels: Map<string, ChannelInfo> = new Map();
  private connectionState: ConnectionState = { isConnected: false, retryCount: 0 };
  private maxRetries = 5;
  private retryDelayMs = 1000;
  private cleanupInterval?: NodeJS.Timeout;

  constructor() {
    // Start periodic cleanup of inactive channels
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveChannels();
    }, 60000); // Clean up every minute
  }

  private cleanupInactiveChannels(): void {
    const now = Date.now();
    const thirtyMinutesAgo = now - (30 * 60 * 1000);

    this.channels.forEach((info, channelName) => {
      if (!info.isActive && info.createdAt < thirtyMinutesAgo) {
        console.log(`Cleaning up inactive channel: ${channelName}`);
        this.forceUnsubscribe(channelName);
      }
    });
  }

  // Enhanced cleanup method
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }

    // Cleanup all channels
    this.channels.forEach((_, channelName) => {
      this.forceUnsubscribe(channelName);
    });
    
    this.channels.clear();
    this.connectionState = { isConnected: false, retryCount: 0 };
  }

  // Force unsubscribe with proper cleanup
  private forceUnsubscribe(channelName: string): void {
    const channelInfo = this.channels.get(channelName);
    if (channelInfo) {
      try {
        channelInfo.channel.unsubscribe();
        supabase.removeChannel(channelInfo.channel);
      } catch (error) {
        console.error(`Error force unsubscribing from ${channelName}:`, error);
      }
      this.channels.delete(channelName);
    }
  }

  // Safe unsubscribe method
  private unsubscribe(channelName: string): void {
    const channelInfo = this.channels.get(channelName);
    if (channelInfo) {
      channelInfo.isActive = false;
      try {
        channelInfo.channel.unsubscribe();
        supabase.removeChannel(channelInfo.channel);
        this.channels.delete(channelName);
        console.log(`Successfully unsubscribed from ${channelName}`);
      } catch (error) {
        console.error(`Error unsubscribing from ${channelName}:`, error);
        // Still remove from our tracking
        this.channels.delete(channelName);
      }
    }
  }

  // Subscribe to voting updates for a specific setlist
  subscribeToSetlistVotes(
    setlistId: string, 
    onUpdate: (payload: VoteUpdate) => void,
    onError?: (error: string) => void
  ): () => void {
    const channelName = `setlist:${setlistId}`;
    
    // Clean up existing channel if present
    if (this.channels.has(channelName)) {
      this.forceUnsubscribe(channelName);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'setlist_songs',
          filter: `setlist_id=eq.${setlistId}`
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          try {
            this.handleVoteUpdate(payload, onUpdate);
          } catch (error) {
            console.error('Error handling vote update:', error);
            onError?.(error instanceof Error ? error.message : 'Unknown error');
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `setlist_id=eq.${setlistId}`
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          try {
            this.handleDirectVoteUpdate(payload, setlistId, onUpdate);
          } catch (error) {
            console.error('Error handling direct vote update:', error);
            onError?.(error instanceof Error ? error.message : 'Unknown error');
          }
        }
      )
      .subscribe((status) => {
        this.connectionState.isConnected = status === 'SUBSCRIBED';
        
        const channelInfo = this.channels.get(channelName);
        if (channelInfo) {
          channelInfo.isActive = status === 'SUBSCRIBED';
        }
        
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          this.handleConnectionError(channelName, onError);
        }
      });

    // Store channel info
    this.channels.set(channelName, {
      channel,
      createdAt: Date.now(),
      isActive: false
    });

    return () => {
      this.unsubscribe(channelName);
    };
  }

  // Subscribe to show-level updates (total votes, trending)
  subscribeToShowUpdates(
    showId: string,
    onUpdate: (payload: ShowUpdate) => void,
    onError?: (error: string) => void
  ): () => void {
    const channelName = `show:${showId}`;
    
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shows',
          filter: `id=eq.${showId}`
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          try {
            this.handleShowUpdate(payload, onUpdate);
          } catch (error) {
            console.error('Error handling show update:', error);
            onError?.(error instanceof Error ? error.message : 'Unknown error');
          }
        }
      )
      .subscribe((status) => {
        this.connectionState.isConnected = status === 'SUBSCRIBED';
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          this.handleConnectionError(channelName, onError);
        }
      });

    this.channels.set(channelName, channel);

    return () => {
      this.unsubscribe(channelName);
    };
  }

  // Subscribe to global trending updates
  subscribeToTrendingUpdates(
    onUpdate: (trends: any[]) => void,
    onError?: (error: string) => void
  ): () => void {
    const channelName = 'trending:global';
    
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shows',
          filter: 'trending_score.gt.0'
        },
        async () => {
          try {
            // Fetch updated trending data
            const { data, error } = await supabase
              .from('shows')
              .select(`
                id, name, date, venue, city, country, trending_score,
                artists:show_artists(artist:artists(name, image_url))
              `)
              .gt('trending_score', 0)
              .order('trending_score', { ascending: false })
              .limit(20);

            if (error) throw error;
            
            // Invalidate trending cache
            cacheService.invalidatePattern('trending:*');
            
            onUpdate(data || []);
          } catch (error) {
            console.error('Error fetching trending updates:', error);
            onError?.(error instanceof Error ? error.message : 'Unknown error');
          }
        }
      )
      .subscribe((status) => {
        this.connectionState.isConnected = status === 'SUBSCRIBED';
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          this.handleConnectionError(channelName, onError);
        }
      });

    this.channels.set(channelName, channel);

    return () => {
      this.unsubscribe(channelName);
    };
  }

  private async handleVoteUpdate(
    payload: RealtimePostgresChangesPayload<any>,
    onUpdate: (payload: VoteUpdate) => void
  ) {
    const record = payload.new || payload.old;
    if (!record) return;

    // Fetch fresh vote data for this song
    const { data: songData, error } = await supabase
      .from('setlist_songs')
      .select(`
        id, song_id, setlist_id, vote_count, confidence_score,
        votes:votes(user_id, vote_type, confidence)
      `)
      .eq('id', record.id)
      .single();

    if (error || !songData) return;

    // Invalidate related caches
    cacheService.invalidatePattern(`votes:setlist:${songData.setlist_id}`);
    cacheService.invalidatePattern(`votes:song:${songData.song_id}`);

    onUpdate({
      song_id: songData.song_id,
      setlist_id: songData.setlist_id,
      vote_count: songData.vote_count || 0,
      confidence_score: songData.confidence_score,
      trending_factor: this.calculateTrendingFactor(songData.votes || [])
    });
  }

  private async handleDirectVoteUpdate(
    payload: RealtimePostgresChangesPayload<any>,
    setlistId: string,
    onUpdate: (payload: VoteUpdate) => void
  ) {
    const vote = payload.new || payload.old;
    if (!vote || !vote.setlist_song_id) return;

    // Fetch updated song data
    const { data: songData, error } = await supabase
      .from('setlist_songs')
      .select(`
        id, song_id, setlist_id, vote_count, confidence_score,
        votes:votes(user_id, vote_type, confidence)
      `)
      .eq('id', vote.setlist_song_id)
      .single();

    if (error || !songData) return;

    // Invalidate caches
    cacheService.invalidatePattern(`votes:setlist:${setlistId}`);
    cacheService.invalidatePattern(`votes:song:${songData.song_id}`);

    onUpdate({
      song_id: songData.song_id,
      setlist_id: songData.setlist_id,
      vote_count: songData.vote_count || 0,
      user_vote: payload.eventType === 'INSERT',
      confidence_score: songData.confidence_score,
      trending_factor: this.calculateTrendingFactor(songData.votes || [])
    });
  }

  private async handleShowUpdate(
    payload: RealtimePostgresChangesPayload<any>,
    onUpdate: (payload: ShowUpdate) => void
  ) {
    const show = payload.new;
    if (!show) return;

    // Get active voter count (users who voted in last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: activeVoters } = await supabase
      .from('votes')
      .select('user_id', { count: 'distinct' })
      .eq('show_id', show.id)
      .gte('created_at', oneHourAgo);

    // Get total votes for this show
    const { count: totalVotes } = await supabase
      .from('votes')
      .select('*', { count: 'exact' })
      .eq('show_id', show.id);

    // Invalidate show cache
    cacheService.invalidatePattern(`show:${show.id}`);

    onUpdate({
      show_id: show.id,
      total_votes: totalVotes || 0,
      active_voters: activeVoters || 0,
      trending_score: show.trending_score
    });
  }

  private calculateTrendingFactor(votes: any[]): number {
    if (!votes.length) return 0;

    const now = Date.now();
    let recentVotes = 0;
    let totalWeight = 0;

    votes.forEach(vote => {
      const voteTime = new Date(vote.created_at).getTime();
      const hoursSince = (now - voteTime) / (1000 * 60 * 60);
      
      // Weight recent votes more heavily
      const timeWeight = Math.exp(-hoursSince / 24); // Decay over 24 hours
      const confidenceWeight = (vote.confidence || 50) / 100;
      
      totalWeight += timeWeight * confidenceWeight;
      
      if (hoursSince < 1) recentVotes++;
    });

    return totalWeight + (recentVotes * 0.5); // Bonus for very recent activity
  }

  private async handleConnectionError(channelName: string, onError?: (error: string) => void) {
    this.connectionState.retryCount++;
    
    if (this.connectionState.retryCount <= this.maxRetries) {
      const delay = this.retryDelayMs * Math.pow(2, this.connectionState.retryCount - 1);
      
      setTimeout(() => {
        const channel = this.channels.get(channelName);
        if (channel) {
          channel.subscribe();
        }
      }, delay);
    } else {
      const error = `Failed to maintain realtime connection after ${this.maxRetries} retries`;
      this.connectionState.lastError = error;
      onError?.(error);
    }
  }

  private unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(channelName);
    }
  }

  // Get connection status
  getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  // Cleanup all subscriptions
  cleanup() {
    this.channels.forEach((channel, channelName) => {
      channel.unsubscribe();
    });
    this.channels.clear();
    this.connectionState = { isConnected: false, retryCount: 0 };
  }

  // Optimize performance by batching updates
  private batchedUpdates = new Map<string, any[]>();
  private updateTimeouts = new Map<string, NodeJS.Timeout>();

  private batchUpdate(key: string, data: any, callback: (batch: any[]) => void, delayMs = 100) {
    if (!this.batchedUpdates.has(key)) {
      this.batchedUpdates.set(key, []);
    }
    
    this.batchedUpdates.get(key)!.push(data);
    
    if (this.updateTimeouts.has(key)) {
      clearTimeout(this.updateTimeouts.get(key)!);
    }
    
    this.updateTimeouts.set(key, setTimeout(() => {
      const batch = this.batchedUpdates.get(key) || [];
      if (batch.length > 0) {
        callback(batch);
        this.batchedUpdates.set(key, []);
      }
      this.updateTimeouts.delete(key);
    }, delayMs));
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();

// Legacy function for backward compatibility
export function subscribeToSetlistVotes(setlistId: string, onUpdate: (payload: any) => void) {
  const channel = supabase
    .channel(`setlist:${setlistId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'setlist_songs',
        filter: `setlist_id=eq.${setlistId}`
      },
      (payload) => onUpdate(payload)
    )
    .subscribe();

  return () => channel.unsubscribe();
}

export function subscribeToShowVotes(
  showId: string,
  onUpdate: (payload: any) => void
): () => void {
  const channel = supabase
    .channel(`show:${showId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public', 
        table: 'votes',
        filter: `show_id=eq.${showId}`
      },
      (payload) => onUpdate(payload)
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}