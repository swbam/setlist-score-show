// API Request/Response types

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
    nextCursor?: string | null;
    previousCursor?: string | null;
  };
}

// Common API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: Record<string, any>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  statusCode?: number;
}

// Vote API
export interface CastVoteRequest {
  showId: string;
  songId: string;
  setlistSongId: string;
}

export interface CastVoteResponse {
  success: boolean;
  voteId: string;
  newVoteCount: number;
  dailyVotesRemaining: number;
  showVotesRemaining: number;
}

// Show API
export interface ShowFilters {
  status?: string[];
  artistId?: string;
  venueId?: string;
  startDate?: string;
  endDate?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface ShowSearchParams extends PaginationParams {
  query?: string;
  filters?: ShowFilters;
  orderBy?: ShowOrderBy;
  orderDirection?: OrderDirection;
}

export enum ShowOrderBy {
  DATE = 'date',
  TRENDING = 'trending',
  VOTES = 'votes',
  CREATED = 'created',
}

export enum OrderDirection {
  ASC = 'asc',
  DESC = 'desc',
}

// Artist API
export interface ArtistSearchParams extends PaginationParams {
  query?: string;
  genres?: string[];
  hasUpcomingShows?: boolean;
  orderBy?: ArtistOrderBy;
  orderDirection?: OrderDirection;
}

export enum ArtistOrderBy {
  NAME = 'name',
  POPULARITY = 'popularity',
  FOLLOWERS = 'followers',
  UPCOMING_SHOWS = 'upcoming_shows',
}

// Analytics API
export interface AnalyticsTimeframe {
  start: Date;
  end: Date;
  granularity?: 'hour' | 'day' | 'week' | 'month';
}

export interface ShowAnalyticsResponse {
  showId: string;
  period: AnalyticsTimeframe;
  metrics: {
    totalViews: number;
    uniqueViewers: number;
    totalVotes: number;
    uniqueVoters: number;
    avgVotesPerUser: number;
    peakVotingHour: string;
    topSongs: Array<{
      songId: string;
      title: string;
      voteCount: number;
      votePercentage: number;
    }>;
    userEngagement: {
      returningUsers: number;
      newUsers: number;
      avgSessionDuration: number;
    };
  };
}

// Sync API
export interface SyncTriggerRequest {
  type: 'setlistfm' | 'spotify' | 'ticketmaster' | 'artist' | 'trending' | 'cleanup';
  params?: {
    artistName?: string;
    artistId?: string;
    dateRange?: {
      start: string;
      end: string;
    };
  };
}

export interface SyncStatusResponse {
  setlistfm: SyncServiceStatus;
  spotify: SyncServiceStatus;
  ticketmaster: SyncServiceStatus;
  schedules: SyncSchedule[];
}

export interface SyncServiceStatus {
  lastSync?: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  progress?: number;
  message?: string;
}

export interface SyncSchedule {
  id: string;
  name: string;
  description: string;
  schedule: string; // Cron expression
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
}

// Auth API
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  displayName?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    displayName?: string;
    role: string;
  };
  session: {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
  };
}

// Real-time events
export interface RealtimeVoteUpdate {
  setlistSongId: string;
  songId: string;
  oldVoteCount: number;
  newVoteCount: number;
  voterId?: string;
  timestamp: string;
}

export interface RealtimePresenceUpdate {
  showId: string;
  activeUsers: number;
  users: Array<{
    id: string;
    joinedAt: string;
  }>;
}