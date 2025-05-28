import { QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Show, Artist, UserArtist, SetlistSong } from '@/types';

/**
 * React Query optimization service for comprehensive caching and prefetching strategies
 * This addresses the need for efficient data management and improved user experience
 */

// Enhanced query client with optimized settings
export const createOptimizedQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 2,
      retryDelay: 1000,
    },
  },
});

// Query key factories for consistent caching
export const queryKeys = {
  // Shows
  shows: {
    all: ['shows'] as const,
    upcoming: () => [...queryKeys.shows.all, 'upcoming'] as const,
    byArtist: (artistId: string) => [...queryKeys.shows.all, 'artist', artistId] as const,
    byVenue: (venueId: string) => [...queryKeys.shows.all, 'venue', venueId] as const,
    trending: () => [...queryKeys.shows.all, 'trending'] as const,
    detail: (showId: string) => [...queryKeys.shows.all, 'detail', showId] as const,
  },
  
  // Artists
  artists: {
    all: ['artists'] as const,
    trending: () => [...queryKeys.artists.all, 'trending'] as const,
    search: (query: string) => [...queryKeys.artists.all, 'search', query] as const,
    detail: (artistId: string) => [...queryKeys.artists.all, 'detail', artistId] as const,
    userArtists: (userId: string) => [...queryKeys.artists.all, 'user', userId] as const,
    catalog: (artistId: string) => [...queryKeys.artists.all, 'catalog', artistId] as const,
  },
  
  // Voting
  voting: {
    all: ['voting'] as const,
    setlist: (setlistId: string) => [...queryKeys.voting.all, 'setlist', setlistId] as const,
    userVotes: (userId: string, showId: string) => [...queryKeys.voting.all, 'user', userId, showId] as const,
    stats: (showId: string) => [...queryKeys.voting.all, 'stats', showId] as const,
    limits: (userId: string) => [...queryKeys.voting.all, 'limits', userId] as const,
  },
  
  // Search
  search: {
    all: ['search'] as const,
    query: (query: string, filters?: any) => [...queryKeys.search.all, query, filters] as const,
    suggestions: (query: string) => [...queryKeys.search.all, 'suggestions', query] as const,
  },
  
  // User data
  user: {
    all: ['user'] as const,
    profile: (userId: string) => [...queryKeys.user.all, 'profile', userId] as const,
    activity: (userId: string) => [...queryKeys.user.all, 'activity', userId] as const,
    stats: (userId: string) => [...queryKeys.user.all, 'stats', userId] as const,
  },
};

// Data fetching functions optimized for React Query
export const queryFunctions = {
  // Shows
  getUpcomingShows: async (): Promise<Show[]> => {
    const { data, error } = await supabase
      .from('shows')
      .select(`
        id,
        name,
        date,
        start_time,
        status,
        view_count,
        artist:artists!shows_artist_id_fkey(id, name, image_url, popularity),
        venue:venues!shows_venue_id_fkey(id, name, city, state, country)
      `)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })
      .limit(50);

    if (error) throw error;
    return data || [];
  },

  getShowDetails: async (showId: string): Promise<Show | null> => {
    const { data, error } = await supabase
      .from('shows')
      .select(`
        id,
        name,
        date,
        start_time,
        status,
        view_count,
        ticketmaster_url,
        artist:artists!shows_artist_id_fkey(id, name, image_url, popularity, genres),
        venue:venues!shows_venue_id_fkey(id, name, city, state, country, address, latitude, longitude)
      `)
      .eq('id', showId)
      .single();

    if (error) throw error;
    return data;
  },

  getTrendingShows: async (): Promise<Show[]> => {
    const { data, error } = await supabase
      .from('shows')
      .select(`
        id,
        name,
        date,
        view_count,
        artist:artists!shows_artist_id_fkey(id, name, image_url),
        venue:venues!shows_venue_id_fkey(name, city, state)
      `)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('view_count', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  },

  // Artists
  getTrendingArtists: async (): Promise<Artist[]> => {
    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .order('popularity', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  },

  getArtistDetails: async (artistId: string): Promise<Artist | null> => {
    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .eq('id', artistId)
      .single();

    if (error) throw error;
    return data;
  },

  getUserArtists: async (userId: string): Promise<UserArtist[]> => {
    const { data, error } = await supabase
      .from('user_artists')
      .select(`
        id,
        user_id,
        artist_id,
        rank,
        artist:artists!user_artists_artist_id_fkey(id, name, image_url, popularity, genres)
      `)
      .eq('user_id', userId)
      .order('rank', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Voting
  getSetlistVotes: async (setlistId: string): Promise<SetlistSong[]> => {
    const { data, error } = await supabase
      .from('setlist_songs')
      .select(`
        id,
        setlist_id,
        song_id,
        position,
        votes,
        song:songs!setlist_songs_song_id_fkey(id, name, artist_id, album, duration_ms, popularity, spotify_url)
      `)
      .eq('setlist_id', setlistId)
      .order('votes', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  getUserVoteLimits: async (userId: string): Promise<any> => {
    const { data, error } = await supabase
      .from('vote_limits')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  },
};

// Prefetching strategies
export const prefetchStrategies = {
  // Prefetch related data when user navigates to a show
  prefetchShowData: async (queryClient: QueryClient, showId: string) => {
    // Prefetch show details
    await queryClient.prefetchQuery({
      queryKey: queryKeys.shows.detail(showId),
      queryFn: () => queryFunctions.getShowDetails(showId),
      staleTime: 1000 * 60 * 10, // 10 minutes
    });

    // Get show details to prefetch related data
    const show = await queryFunctions.getShowDetails(showId);
    if (show) {
      // Prefetch artist details
      await queryClient.prefetchQuery({
        queryKey: queryKeys.artists.detail(show.artist?.id || ''),
        queryFn: () => queryFunctions.getArtistDetails(show.artist?.id || ''),
        staleTime: 1000 * 60 * 15, // 15 minutes
      });

      // Prefetch other shows by same artist
      await queryClient.prefetchQuery({
        queryKey: queryKeys.shows.byArtist(show.artist?.id || ''),
        queryFn: async () => {
          const { data } = await supabase
            .from('shows')
            .select(`
              id, name, date, status,
              venue:venues!shows_venue_id_fkey(name, city)
            `)
            .eq('artist_id', show.artist?.id)
            .gte('date', new Date().toISOString().split('T')[0])
            .order('date', { ascending: true })
            .limit(10);
          return data || [];
        },
        staleTime: 1000 * 60 * 10,
      });
    }
  },

  // Prefetch user-related data
  prefetchUserData: async (queryClient: QueryClient, userId: string) => {
    // Prefetch user artists
    await queryClient.prefetchQuery({
      queryKey: queryKeys.artists.userArtists(userId),
      queryFn: () => queryFunctions.getUserArtists(userId),
      staleTime: 1000 * 60 * 10,
    });

    // Prefetch vote limits
    await queryClient.prefetchQuery({
      queryKey: queryKeys.voting.limits(userId),
      queryFn: () => queryFunctions.getUserVoteLimits(userId),
      staleTime: 1000 * 60 * 5,
    });

    // Prefetch upcoming shows for user's artists
    const userArtists = await queryFunctions.getUserArtists(userId);
    const artistIds = userArtists.map(ua => ua.artist_id);

    if (artistIds.length > 0) {
      await queryClient.prefetchQuery({
        queryKey: ['user-upcoming-shows', userId],
        queryFn: async () => {
          const { data } = await supabase
            .from('shows')
            .select(`
              id, name, date,
              artist:artists!shows_artist_id_fkey(name, image_url),
              venue:venues!shows_venue_id_fkey(name, city)
            `)
            .in('artist_id', artistIds)
            .gte('date', new Date().toISOString().split('T')[0])
            .order('date', { ascending: true })
            .limit(20);
          return data || [];
        },
        staleTime: 1000 * 60 * 15,
      });
    }
  },

  // Prefetch trending data on app load
  prefetchTrendingData: async (queryClient: QueryClient) => {
    // Prefetch trending shows
    await queryClient.prefetchQuery({
      queryKey: queryKeys.shows.trending(),
      queryFn: queryFunctions.getTrendingShows,
      staleTime: 1000 * 60 * 15,
    });

    // Prefetch trending artists
    await queryClient.prefetchQuery({
      queryKey: queryKeys.artists.trending(),
      queryFn: queryFunctions.getTrendingArtists,
      staleTime: 1000 * 60 * 15,
    });

    // Prefetch upcoming shows
    await queryClient.prefetchQuery({
      queryKey: queryKeys.shows.upcoming(),
      queryFn: queryFunctions.getUpcomingShows,
      staleTime: 1000 * 60 * 10,
    });
  },
};

// Cache invalidation strategies
export const invalidationStrategies = {
  // Invalidate after voting
  afterVote: (queryClient: QueryClient, setlistId: string, showId: string, userId: string) => {
    // Invalidate setlist votes
    queryClient.invalidateQueries({ queryKey: queryKeys.voting.setlist(setlistId) });
    
    // Invalidate voting stats
    queryClient.invalidateQueries({ queryKey: queryKeys.voting.stats(showId) });
    
    // Invalidate user vote limits
    queryClient.invalidateQueries({ queryKey: queryKeys.voting.limits(userId) });
    
    // Invalidate user votes for this show
    queryClient.invalidateQueries({ queryKey: queryKeys.voting.userVotes(userId, showId) });
  },

  // Invalidate after adding user artist
  afterAddUserArtist: (queryClient: QueryClient, userId: string, artistId: string) => {
    // Invalidate user artists
    queryClient.invalidateQueries({ queryKey: queryKeys.artists.userArtists(userId) });
    
    // Invalidate user stats
    queryClient.invalidateQueries({ queryKey: queryKeys.user.stats(userId) });
    
    // Remove stale upcoming shows and refetch
    queryClient.invalidateQueries({ queryKey: ['user-upcoming-shows', userId] });
  },

  // Invalidate after show update
  afterShowUpdate: (queryClient: QueryClient, showId: string, artistId?: string) => {
    // Invalidate specific show
    queryClient.invalidateQueries({ queryKey: queryKeys.shows.detail(showId) });
    
    // Invalidate trending shows
    queryClient.invalidateQueries({ queryKey: queryKeys.shows.trending() });
    
    // Invalidate upcoming shows
    queryClient.invalidateQueries({ queryKey: queryKeys.shows.upcoming() });
    
    // If artist provided, invalidate artist shows
    if (artistId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.shows.byArtist(artistId) });
    }
  },
};

// Background sync strategies
export const backgroundSync = {
  // Sync vote counts in background
  syncVoteCounts: async (queryClient: QueryClient) => {
    const queries = queryClient.getQueryCache().findAll({
      queryKey: queryKeys.voting.all,
      stale: true,
    });

    for (const query of queries) {
      if (query.queryKey.includes('setlist')) {
        await queryClient.refetchQueries({ queryKey: query.queryKey });
      }
    }
  },

  // Sync trending data periodically
  syncTrendingData: async (queryClient: QueryClient) => {
    await queryClient.refetchQueries({ queryKey: queryKeys.shows.trending() });
    await queryClient.refetchQueries({ queryKey: queryKeys.artists.trending() });
  },

  // Clean up old cached data
  cleanupCache: (queryClient: QueryClient) => {
    // Remove queries that haven't been used in 1 hour
    const oneHourAgo = Date.now() - 1000 * 60 * 60;
    
    queryClient.getQueryCache().findAll().forEach(query => {
      if (query.state.dataUpdatedAt < oneHourAgo && query.getObserversCount() === 0) {
        queryClient.removeQueries({ queryKey: query.queryKey });
      }
    });
  },
};

// Optimistic updates
export const optimisticUpdates = {
  // Optimistic vote update
  updateVoteOptimistically: (
    queryClient: QueryClient,
    setlistId: string,
    songId: string,
    voteChange: number
  ) => {
    queryClient.setQueryData(
      queryKeys.voting.setlist(setlistId),
      (old: SetlistSong[] | undefined) => {
        if (!old) return old;
        
        return old.map(song => 
          song.song_id === songId 
            ? { ...song, votes: song.votes + voteChange, userVoted: voteChange > 0 }
            : song
        );
      }
    );
  },

  // Optimistic artist addition
  addArtistOptimistically: (
    queryClient: QueryClient,
    userId: string,
    artist: Artist
  ) => {
    queryClient.setQueryData(
      queryKeys.artists.userArtists(userId),
      (old: UserArtist[] | undefined) => {
        if (!old) return old;
        
        const newUserArtist: UserArtist = {
          id: `temp-${Date.now()}`,
          user_id: userId,
          artist_id: artist.id,
          rank: old.length + 1,
          artist: artist,
        };
        
        return [...old, newUserArtist];
      }
    );
  },
};

export default {
  createOptimizedQueryClient,
  queryKeys,
  queryFunctions,
  prefetchStrategies,
  invalidationStrategies,
  backgroundSync,
  optimisticUpdates,
};
