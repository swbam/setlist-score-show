// Enhanced TypeScript definitions for database entities

export interface Artist {
  id: string;
  name: string;
  spotify_id?: string;
  image_url?: string;
  popularity?: number;
  genres?: string[];
  followers?: number;
  created_at: string;
  updated_at: string;
}

export interface Venue {
  id: string;
  name: string;
  city: string;
  state?: string;
  country: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  capacity?: number;
  ticketmaster_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Show {
  id: string;
  artist_id: string;
  venue_id: string;
  name: string;
  date: string;
  start_time?: string | null;
  status?: 'upcoming' | 'completed' | 'cancelled' | null;
  ticketmaster_url?: string | null;
  image_url?: string | null;
  min_price?: number | null;
  max_price?: number | null;
  view_count: number;
  trending_score: number;
  created_at: string;
  updated_at: string;
  // Relations
  artists?: Artist;
  venues?: Venue;
  setlists?: Setlist[];
}

export interface Song {
  id: string;
  artist_id: string;
  name: string;
  album?: string;
  spotify_id?: string;
  duration_ms?: number;
  popularity?: number;
  preview_url?: string;
  created_at: string;
  updated_at: string;
  // Relations
  artists?: Artist;
}

export interface Setlist {
  id: string;
  show_id: string;
  type: 'fan_predicted' | 'played';
  created_at: string;
  updated_at: string;
  // Relations
  shows?: Show;
  setlist_songs?: SetlistSong[];
}

export interface SetlistSong {
  id: string;
  setlist_id: string;
  song_id: string;
  position: number;
  votes: number;
  created_at: string;
  updated_at: string;
  // Relations
  setlists?: Setlist;
  songs?: Song;
}

export interface Vote {
  id: string;
  user_id: string;
  setlist_song_id: string;
  created_at: string;
  // Relations
  setlist_songs?: SetlistSong;
}

export interface VoteResponse {
  success: boolean;
  message: string;
  vote_id?: string;
  daily_votes_remaining: number;
  show_votes_remaining: number;
  total_daily_votes: number;
  total_show_votes: number;
  current_song_votes: number;
}

export interface VoteLimits {
  daily_votes_used: number;
  daily_votes_limit: number;
  show_votes_used: number;
  show_votes_limit: number;
  daily_votes_remaining: number;
  show_votes_remaining: number;
}

export interface UserVote {
  setlist_song_id: string;
  song_name: string;
  artist_name: string;
  show_name: string;
  show_date: string;
  venue_name: string;
  created_at: string;
}

// Search result types
export interface SearchArtist extends Artist {
  upcomingShowsCount?: number;
  nextShow?: {
    id: string;
    date: string;
    venue: string;
    city: string;
  };
}

export interface SearchShow extends Show {
  artist: Artist;
  venue: Venue;
  voteCount?: number;
}

export interface SearchResult {
  id: string;
  name: string;
  type: 'artist' | 'show';
  image_url?: string;
  date?: string;
  venue?: string;
  city?: string;
  artist?: {
    id: string;
    name: string;
  };
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  totalPages: number;
}

// Trending and analytics types
export interface TrendingShow extends Show {
  trending_score: number;
  recent_votes: number;
  unique_voters: number;
  vote_velocity: number;
}

export interface VotingStats {
  total_votes: number;
  unique_voters: number;
  top_songs: Array<{
    song_id: string;
    song_name: string;
    votes: number;
    percentage: number;
  }>;
  voting_timeline: Array<{
    hour: number;
    votes: number;
  }>;
}

// Real-time update types
export interface RealtimeVoteUpdate {
  setlist_song_id: string;
  new_vote_count: number;
  user_id: string;
  song_name: string;
  artist_name: string;
}

export interface RealtimeConnectionStatus {
  connected: boolean;
  reconnecting: boolean;
  error?: string;
  lastConnected?: Date;
}

// Job and background task types
export interface JobResult {
  success: boolean;
  recordsProcessed: number;
  processingTimeMs: number;
  errors?: string[];
  result?: any;
}

export interface SyncStatus {
  lastSync: Date;
  status: 'idle' | 'running' | 'error';
  recordsProcessed: number;
  errors: string[];
}

// External API types
export interface SpotifyArtist {
  id: string;
  name: string;
  images: Array<{ url: string; height: number; width: number }>;
  popularity: number;
  genres: string[];
  followers: { total: number };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  album: {
    id: string;
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  artists: Array<{ id: string; name: string }>;
  duration_ms: number;
  popularity: number;
  preview_url?: string;
}

export interface TicketmasterEvent {
  id: string;
  name: string;
  dates: {
    start: {
      localDate: string;
      localTime?: string;
    };
  };
  _embedded?: {
    venues?: Array<{
      id: string;
      name: string;
      city: { name: string };
      state?: { name: string; stateCode: string };
      country: { name: string; countryCode: string };
      address?: { line1: string };
      location?: { latitude: string; longitude: string };
    }>;
    attractions?: Array<{
      id: string;
      name: string;
      classifications?: Array<{
        segment: { name: string };
        genre: { name: string };
      }>;
    }>;
  };
}

export interface SetlistFmSetlist {
  id: string;
  eventDate: string;
  artist: {
    name: string;
    mbid?: string;
  };
  venue: {
    name: string;
    city: {
      name: string;
      country: { name: string };
    };
  };
  sets: {
    set: Array<{
      song: Array<{
        name: string;
        cover?: {
          name: string;
        };
      }>;
    }>;
  };
}

export interface Database {
  public: {
    Tables: {
      artists: {
        Row: {
          id: string
          name: string
          spotify_id: string | null
          image_url: string | null
          popularity: number | null
          genres: string[] | null
          followers: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          spotify_id?: string
          image_url?: string
          popularity?: number
          genres?: string[]
          followers?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          spotify_id?: string
          image_url?: string
          popularity?: number
          genres?: string[]
          followers?: number
          created_at?: string
          updated_at?: string
        }
      }
      
      venues: {
        Row: {
          id: string
          name: string
          city: string
          state: string | null
          country: string
          address: string | null
          latitude: number | null
          longitude: number | null
          capacity: number | null
          ticketmaster_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          city: string
          state?: string
          country: string
          address?: string
          latitude?: number
          longitude?: number
          capacity?: number
          ticketmaster_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          city?: string
          state?: string
          country?: string
          address?: string
          latitude?: number
          longitude?: number
          capacity?: number
          ticketmaster_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      
      shows: {
        Row: {
          id: string
          artist_id: string
          venue_id: string
          name: string
          date: string
          start_time: string | null
          status: string | null
          ticketmaster_url: string | null
          image_url: string | null
          min_price: number | null
          max_price: number | null
          view_count: number
          trending_score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          artist_id: string
          venue_id: string
          name: string
          date: string
          start_time?: string
          status?: string
          ticketmaster_url?: string
          image_url?: string
          min_price?: number
          max_price?: number
          view_count?: number
          trending_score?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          artist_id?: string
          venue_id?: string
          name?: string
          date?: string
          start_time?: string
          status?: string
          ticketmaster_url?: string
          image_url?: string
          min_price?: number
          max_price?: number
          view_count?: number
          trending_score?: number
          created_at?: string
          updated_at?: string
        }
      }
      
      unmapped_artists: {
        Row: {
          id: string
          ticketmaster_name: string
          event_count: number
          first_seen_at: string
          last_seen_at: string
        }
        Insert: {
          id?: string
          ticketmaster_name: string
          event_count?: number
          first_seen_at?: string
          last_seen_at?: string
        }
        Update: {
          id?: string
          ticketmaster_name?: string
          event_count?: number
          first_seen_at?: string
          last_seen_at?: string
        }
      }
      
      // ...existing code...
    }
  }
}