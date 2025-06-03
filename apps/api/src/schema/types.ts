// Generated types for GraphQL schema
// This file provides TypeScript types that match the GraphQL schema

export interface Artist {
  id: string
  spotifyId?: string | null
  ticketmasterId?: string | null
  setlistfmMbid?: string | null
  name: string
  slug: string
  imageUrl?: string | null
  genres: string[]
  popularity: number
  followers: number
  lastSyncedAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface Show {
  id: string
  artistId: string
  venueId: string
  ticketmasterId?: string | null
  setlistfmId?: string | null
  date: Date
  startTime?: string | null
  doorsTime?: string | null
  title?: string | null
  tourName?: string | null
  status: ShowStatus
  ticketmasterUrl?: string | null
  viewCount: number
  createdAt: Date
  updatedAt: Date
}

export interface Venue {
  id: string
  ticketmasterId?: string | null
  setlistfmId?: string | null
  name: string
  address?: string | null
  city: string
  state?: string | null
  country: string
  postalCode?: string | null
  latitude?: number | null
  longitude?: number | null
  timezone?: string | null
  capacity?: number | null
  createdAt: Date
  updatedAt: Date
}

export interface Song {
  id: string
  artistId: string
  spotifyId?: string | null
  musicbrainzId?: string | null
  title: string
  album?: string | null
  albumImageUrl?: string | null
  durationMs?: number | null
  popularity: number
  previewUrl?: string | null
  spotifyUrl?: string | null
  audioFeatures?: AudioFeatures | null
  createdAt: Date
  updatedAt: Date
}

export interface AudioFeatures {
  acousticness?: number | null
  danceability?: number | null
  energy?: number | null
  instrumentalness?: number | null
  key?: number | null
  liveness?: number | null
  loudness?: number | null
  mode?: number | null
  speechiness?: number | null
  tempo?: number | null
  timeSignature?: number | null
  valence?: number | null
}

export interface Setlist {
  id: string
  showId: string
  name: string
  orderIndex: number
  isEncore: boolean
  createdAt: Date
  updatedAt: Date
}

export interface SetlistSong {
  id: string
  setlistId: string
  songId: string
  position: number
  voteCount: number
  notes?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface User {
  id: string
  email?: string | null
  displayName?: string | null
  avatarUrl?: string | null
  spotifyId?: string | null
  preferences: UserPreferences
  createdAt: Date
  updatedAt: Date
}

export interface UserPreferences {
  emailNotifications: boolean
  pushNotifications: boolean
  showCompletedShows: boolean
  defaultLocation?: Location | null
  favoriteGenres: string[]
  theme: Theme
}

export interface Location {
  city: string
  state?: string | null
  country: string
  latitude: number
  longitude: number
}

export interface Vote {
  id: string
  userId: string
  setlistSongId: string
  showId: string
  voteType: VoteType
  createdAt: Date
}

export interface VoteAnalytics {
  id: string
  userId: string
  showId: string
  dailyVotes: number
  showVotes: number
  lastVoteAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

// Enums
export enum ShowStatus {
  UPCOMING = 'UPCOMING',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum VoteType {
  UP = 'UP',
  DOWN = 'DOWN',
}

export enum Theme {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
  SYSTEM = 'SYSTEM',
}

export enum SyncType {
  SETLISTFM = 'SETLISTFM',
  SPOTIFY = 'SPOTIFY',
  TICKETMASTER = 'TICKETMASTER',
}

export enum EntityType {
  ARTIST = 'ARTIST',
  SHOW = 'SHOW',
  SONG = 'SONG',
  SETLIST = 'SETLIST',
}

export enum SearchType {
  ARTIST = 'ARTIST',
  SHOW = 'SHOW',
  SONG = 'SONG',
  VENUE = 'VENUE',
}

export enum HealthStatus {
  HEALTHY = 'HEALTHY',
  DEGRADED = 'DEGRADED',
  UNHEALTHY = 'UNHEALTHY',
}

// Input types
export interface VoteInput {
  showId: string
  songId: string
  setlistSongId: string
}

export interface ArtistFilter {
  search?: string | null
  genres?: string[] | null
  hasUpcomingShows?: boolean | null
  minFollowers?: number | null
}

export interface ShowFilter {
  artistId?: string | null
  artistSlug?: string | null
  venueId?: string | null
  status?: ShowStatus | null
  startDate?: Date | null
  endDate?: Date | null
  city?: string | null
  state?: string | null
  country?: string | null
  search?: string | null
}

export interface SongFilter {
  artistId?: string | null
  search?: string | null
  album?: string | null
  minPopularity?: number | null
  maxDurationMs?: number | null
  hasPreview?: boolean | null
}

export interface UserPreferencesInput {
  emailNotifications?: boolean | null
  pushNotifications?: boolean | null
  showCompletedShows?: boolean | null
  defaultLocation?: LocationInput | null
  favoriteGenres?: string[] | null
  theme?: Theme | null
}

export interface LocationInput {
  city: string
  state?: string | null
  country: string
  latitude: number
  longitude: number
}

export interface SearchInput {
  query: string
  types?: SearchType[] | null
  limit?: number | null
}

// Response types
export interface VoteResult {
  success: boolean
  voteId?: string | null
  newVoteCount: number
  dailyVotesRemaining: number
  showVotesRemaining: number
  message?: string | null
}

export interface VoteLimits {
  dailyLimit: number
  dailyUsed: number
  dailyRemaining: number
  showLimit: number
  showUsed: number
  showRemaining: number
}

export interface PageInfo {
  hasNextPage: boolean
  hasPreviousPage: boolean
  startCursor?: string | null
  endCursor?: string | null
  totalPages: number
  currentPage: number
}

export interface Connection<T> {
  edges: Edge<T>[]
  pageInfo: PageInfo
  totalCount: number
}

export interface Edge<T> {
  node: T
  cursor: string
}

// Context type for resolvers
export interface GraphQLContext {
  prisma: any // Replace with actual Prisma client type
  redis: any // Replace with actual Redis client type
  supabase: any // Replace with actual Supabase client type
  user?: {
    id: string
    email: string
  } | null
}