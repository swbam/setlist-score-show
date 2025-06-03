// Enhanced type definitions for TheSet application
import { Database } from '@/integrations/supabase/types';
import { User as SupabaseUser } from '@supabase/supabase-js';

// Re-export database types for convenience
export type Show = Database['public']['Tables']['shows']['Row'];
export type Artist = Database['public']['Tables']['artists']['Row'];
export type Venue = Database['public']['Tables']['venues']['Row'];
export type Vote = Database['public']['Tables']['votes']['Row'];
export type SetlistSong = Database['public']['Tables']['setlist_songs']['Row'];
export type Setlist = Database['public']['Tables']['setlists']['Row'];
export type Song = Database['public']['Tables']['songs']['Row'];
export type UserArtist = Database['public']['Tables']['user_artists']['Row'];

// User profile type for application use
export interface UserProfile {
  id: string;
  email: string | null;
  display_name: string;
  avatar_url: string | null;
  spotify_id: string | null;
  created_at: string;
}

// Enhanced application types with relations
export interface ShowWithRelations extends Show {
  artists?: Artist;
  venues?: Venue;
  setlists?: SetlistWithSongs[];
  setlist_songs?: SetlistSong[];
}

export interface SetlistWithSongs extends Setlist {
  setlist_songs?: SetlistSongWithDetails[];
}

export interface SetlistSongWithDetails extends SetlistSong {
  songs?: Song;
  user_vote?: boolean;
}

export interface ArtistWithShows extends Artist {
  shows?: ShowWithRelations[];
  upcoming_shows?: ShowWithRelations[];
  past_shows?: ShowWithRelations[];
}

export interface UserArtistWithDetails extends UserArtist {
  artists?: ArtistWithShows;
}

// Search and filter types
export interface SearchResult {
  artists: Artist[];
  shows: ShowWithRelations[];
  venues: Venue[];
  totalCount: number;
}

export interface SearchFilters {
  location?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  genre?: string;
  sortBy?: 'date' | 'popularity' | 'name' | 'votes';
  sortOrder?: 'asc' | 'desc';
}

// Voting and statistics types
export interface VotingStats {
  totalVotes: number;
  upVotes: number;
  downVotes: number;
  userVote?: 'up' | 'down' | null;
}

export interface VotingData {
  setlist_song_id: string;
  user_id: string;
  vote_type: 'up' | 'down';
  created_at?: string;
}

// API response types
export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  totalCount?: number;
}

// Hook return types
export interface UseArtistDataReturn {
  artist: Artist | null;
  shows: ShowWithRelations[];
  upcomingShows: ShowWithRelations[];
  pastShows: ShowWithRelations[];
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

export interface UseVotingReturn {
  votes: Record<string, VotingStats>;
  submitVote: (setlistSongId: string, voteType: 'up' | 'down') => Promise<void>;
  loading: boolean;
  error: ApiError | null;
}

export interface UseAuthReturn {
  user: SupabaseUser | null;
  userProfile: UserProfile | null;
  session: any;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

// Component prop types
export interface SearchFiltersProps {
  onFiltersChange: (filters: SearchFilters) => void;
  initialFilters?: Partial<SearchFilters>;
}

export interface VotingStatsProps {
  setlistSongId: string;
  initialStats?: VotingStats;
  disabled?: boolean;
}

export interface TrendingShowsProps {
  limit?: number;
  timeframe?: 'day' | 'week' | 'month';
}

export interface ArtistCardProps {
  artist: Artist;
  upcomingShows?: ShowWithRelations[];
  showStats?: boolean;
}

// Auth and user types
export interface UserProfile {
  id: string;
  email?: string | null;
  spotify_id?: string | null;
  display_name: string;
  avatar_url?: string | null;
  created_at?: Date;
}

export interface AuthContextType {
  session: any;
  user: SupabaseUser | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

// Spotify service types
export interface SpotifyArtist {
  id: string;
  name: string;
  images: { url: string; height: number; width: number }[];
  popularity: number;
  genres: string[];
  external_urls: { spotify: string };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  album: {
    name: string;
    images?: { url: string; height: number; width: number }[];
  };
  artists?: Array<{
    id: string;
    name: string;
    external_urls?: { spotify: string };
  }>;
  duration_ms: number;
  popularity: number;
  external_urls: { spotify: string };
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  album_type: string;
  total_tracks: number;
  release_date: string;
  images: { url: string; height: number; width: number }[];
  external_urls: { spotify: string };
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Event handler types
export type EventHandler<T = Event> = (event: T) => void;
export type AsyncEventHandler<T = Event> = (event: T) => Promise<void>;

// Form types
export interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
}

export type FormHandler<T> = {
  handleChange: (field: keyof T) => EventHandler<React.ChangeEvent<HTMLInputElement>>;
  handleBlur: (field: keyof T) => EventHandler<React.FocusEvent<HTMLInputElement>>;
  handleSubmit: AsyncEventHandler<React.FormEvent>;
  reset: () => void;
};

// Performance and monitoring types
export interface PerformanceMetrics {
  renderTime: number;
  componentName: string;
  timestamp: number;
}

export interface QueryMetrics {
  queryKey: string;
  fetchTime: number;
  cacheHit: boolean;
  errorRate: number;
}

// Realtime subscription types
export interface RealtimePayload<T = any> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T;
  errors: string[] | null;
}

export interface RealtimeSubscription {
  channel: string;
  event: string;
  callback: (payload: RealtimePayload) => void;
}
