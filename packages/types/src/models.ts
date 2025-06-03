// Core domain models

export interface Artist {
  id: string;
  spotifyId?: string | null;
  ticketmasterId?: string | null;
  setlistfmMbid?: string | null;
  name: string;
  slug: string;
  imageUrl?: string | null;
  genres: string[];
  popularity: number;
  followers: number;
  lastSyncedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Venue {
  id: string;
  ticketmasterId?: string | null;
  setlistfmId?: string | null;
  name: string;
  address?: string | null;
  city: string;
  state?: string | null;
  country: string;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string | null;
  capacity?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Show {
  id: string;
  artistId: string;
  venueId: string;
  ticketmasterId?: string | null;
  setlistfmId?: string | null;
  date: Date;
  startTime?: string | null;
  doorsTime?: string | null;
  title: string;
  tourName?: string | null;
  status: ShowStatus;
  ticketmasterUrl?: string | null;
  viewCount: number;
  trendingScore: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  artist?: Artist;
  venue?: Venue;
  setlists?: Setlist[];
}

export enum ShowStatus {
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface Song {
  id: string;
  artistId: string;
  spotifyId?: string | null;
  musicbrainzId?: string | null;
  title: string;
  album?: string | null;
  albumImageUrl?: string | null;
  durationMs?: number | null;
  popularity: number;
  previewUrl?: string | null;
  spotifyUrl?: string | null;
  audioFeatures?: AudioFeatures | null;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  artist?: Artist;
}

export interface AudioFeatures {
  acousticness: number;
  danceability: number;
  energy: number;
  instrumentalness: number;
  key: number;
  liveness: number;
  loudness: number;
  mode: number;
  speechiness: number;
  tempo: number;
  timeSignature: number;
  valence: number;
}

export interface Setlist {
  id: string;
  showId: string;
  name: string;
  orderIndex: number;
  isEncore: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  show?: Show;
  songs?: SetlistSong[];
}

export interface SetlistSong {
  id: string;
  setlistId: string;
  songId: string;
  position: number;
  voteCount: number;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  setlist?: Setlist;
  song?: Song;
  votes?: Vote[];
}

export interface User {
  id: string;
  email: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  spotifyId?: string | null;
  role: UserRole;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

export interface UserPreferences {
  notifications: boolean;
  newsletter: boolean;
  publicProfile: boolean;
  theme: 'light' | 'dark' | 'auto';
}

export interface Vote {
  id: string;
  userId: string;
  setlistSongId: string;
  showId: string;
  voteType: VoteType;
  createdAt: Date;
  
  // Relations
  user?: User;
  setlistSong?: SetlistSong;
  show?: Show;
}

export enum VoteType {
  UP = 'up',
  DOWN = 'down',
}

export interface VoteAnalytics {
  id: string;
  userId: string;
  showId: string;
  dailyVotes: number;
  showVotes: number;
  lastVoteAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncHistory {
  id: string;
  syncType: SyncType;
  entityType: EntityType;
  entityId?: string | null;
  externalId?: string | null;
  status: SyncStatus;
  errorMessage?: string | null;
  itemsProcessed: number;
  startedAt: Date;
  completedAt?: Date | null;
}

export enum SyncType {
  SETLISTFM = 'setlistfm',
  SPOTIFY = 'spotify',
  TICKETMASTER = 'ticketmaster',
}

export enum EntityType {
  ARTIST = 'artist',
  SHOW = 'show',
  SONG = 'song',
  SETLIST = 'setlist',
}

export enum SyncStatus {
  STARTED = 'started',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface AnalyticsEvent {
  id: string;
  event: string;
  userId?: string | null;
  sessionId: string;
  properties?: Record<string, any> | null;
  createdAt: Date;
}