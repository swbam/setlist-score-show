// Common shared types used across the application

export type UUID = string

export type ISODateString = string

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface Address {
  street?: string
  city: string
  state?: string
  country: string
  postalCode?: string
}

export interface TimeRange {
  start: Date
  end: Date
}

export interface DateRange {
  from: Date
  to: Date
}

// Generic success/error results
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E }

// Utility types
export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// Voting related
export interface VoteLimits {
  dailyLimit: number
  perShowLimit: number
  rateLimit: {
    window: number // in seconds
    maxRequests: number
  }
}

// User preferences
export interface UserPreferences {
  notifications?: {
    showReminders: boolean
    voteUpdates: boolean
    artistUpdates: boolean
  }
  display?: {
    theme: 'light' | 'dark' | 'system'
    compactView: boolean
  }
  privacy?: {
    publicProfile: boolean
    showVoteHistory: boolean
  }
}

// Search related
export interface SearchFilters {
  query?: string
  filters?: Record<string, any>
  sort?: {
    field: string
    order: 'asc' | 'desc'
  }
}

// Analytics
export interface VoteMetrics {
  totalVotes: number
  uniqueVoters: number
  averageVotesPerSong: number
  topVotedSongs: Array<{
    songId: string
    songTitle: string
    voteCount: number
  }>
}

export interface ShowMetrics {
  viewCount: number
  voteMetrics: VoteMetrics
  trendingScore: number
  lastUpdated: Date
}