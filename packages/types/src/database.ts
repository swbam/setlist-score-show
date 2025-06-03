// Database schema types based on the SQL schema in TheSet-Fixes.md

export interface Artist {
  id: string
  spotify_id?: string | null
  ticketmaster_id?: string | null
  setlistfm_mbid?: string | null
  name: string
  slug: string
  image_url?: string | null
  genres?: string[]
  popularity?: number
  followers?: number
  last_synced_at?: Date
  created_at: Date
  updated_at: Date
}

export interface Venue {
  id: string
  ticketmaster_id?: string | null
  setlistfm_id?: string | null
  name: string
  address?: string | null
  city: string
  state?: string | null
  country: string
  postal_code?: string | null
  latitude?: number | null
  longitude?: number | null
  timezone?: string | null
  capacity?: number | null
  created_at: Date
  updated_at: Date
}

export interface Show {
  id: string
  artist_id: string
  venue_id: string
  ticketmaster_id?: string | null
  setlistfm_id?: string | null
  date: Date
  start_time?: string | null
  doors_time?: string | null
  title?: string | null
  tour_name?: string | null
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  ticketmaster_url?: string | null
  view_count: number
  created_at: Date
  updated_at: Date
  // Relations
  artist?: Artist
  venue?: Venue
  setlists?: Setlist[]
}

export interface Song {
  id: string
  artist_id: string
  spotify_id?: string | null
  musicbrainz_id?: string | null
  title: string
  album?: string | null
  album_image_url?: string | null
  duration_ms?: number | null
  popularity?: number
  preview_url?: string | null
  spotify_url?: string | null
  audio_features?: Record<string, any> | null
  created_at: Date
  updated_at: Date
  // Relations
  artist?: Artist
}

export interface Setlist {
  id: string
  show_id: string
  name: string
  order_index: number
  is_encore: boolean
  created_at: Date
  updated_at: Date
  // Relations
  show?: Show
  setlist_songs?: SetlistSong[]
}

export interface SetlistSong {
  id: string
  setlist_id: string
  song_id: string
  position: number
  vote_count: number
  notes?: string | null
  created_at: Date
  updated_at: Date
  // Relations
  setlist?: Setlist
  song?: Song
}

export interface User {
  id: string
  email?: string | null
  display_name?: string | null
  avatar_url?: string | null
  spotify_id?: string | null
  preferences?: Record<string, any>
  created_at: Date
  updated_at: Date
}

export interface Vote {
  id: string
  user_id: string
  setlist_song_id: string
  show_id: string
  vote_type: 'up' | 'down'
  created_at: Date
  // Relations
  user?: User
  setlist_song?: SetlistSong
  show?: Show
}

export interface VoteAnalytics {
  id: string
  user_id: string
  show_id: string
  daily_votes: number
  show_votes: number
  last_vote_at?: Date | null
  created_at: Date
  updated_at: Date
  // Relations
  user?: User
  show?: Show
}

export interface SyncHistory {
  id: string
  sync_type: 'setlistfm' | 'spotify' | 'ticketmaster'
  entity_type: 'artist' | 'show' | 'song' | 'setlist'
  entity_id?: string | null
  external_id?: string | null
  status: 'started' | 'completed' | 'failed'
  error_message?: string | null
  items_processed: number
  started_at: Date
  completed_at?: Date | null
}

export interface TrendingShow {
  show_id: string
  artist_id: string
  venue_id: string
  show_date: Date
  show_name?: string | null
  show_status: string
  view_count: number
  total_votes: number
  unique_voters: number
  avg_votes_per_song: number
  trending_score: number
}