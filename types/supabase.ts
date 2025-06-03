export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      artists: {
        Row: {
          id: string
          spotify_id: string | null
          ticketmaster_id: string | null
          setlistfm_mbid: string | null
          name: string
          slug: string
          image_url: string | null
          genres: string[] | null
          popularity: number
          followers: number
          last_synced_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          spotify_id?: string | null
          ticketmaster_id?: string | null
          setlistfm_mbid?: string | null
          name: string
          slug: string
          image_url?: string | null
          genres?: string[] | null
          popularity?: number
          followers?: number
          last_synced_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          spotify_id?: string | null
          ticketmaster_id?: string | null
          setlistfm_mbid?: string | null
          name?: string
          slug?: string
          image_url?: string | null
          genres?: string[] | null
          popularity?: number
          followers?: number
          last_synced_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      venues: {
        Row: {
          id: string
          ticketmaster_id: string | null
          setlistfm_id: string | null
          name: string
          address: string | null
          city: string
          state: string | null
          country: string
          postal_code: string | null
          latitude: number | null
          longitude: number | null
          timezone: string | null
          capacity: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
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
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ticketmaster_id?: string | null
          setlistfm_id?: string | null
          name?: string
          address?: string | null
          city?: string
          state?: string | null
          country?: string
          postal_code?: string | null
          latitude?: number | null
          longitude?: number | null
          timezone?: string | null
          capacity?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      shows: {
        Row: {
          id: string
          artist_id: string
          venue_id: string
          ticketmaster_id: string | null
          setlistfm_id: string | null
          date: string
          start_time: string | null
          doors_time: string | null
          title: string | null
          tour_name: string | null
          status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
          ticketmaster_url: string | null
          view_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          artist_id: string
          venue_id: string
          ticketmaster_id?: string | null
          setlistfm_id?: string | null
          date: string
          start_time?: string | null
          doors_time?: string | null
          title?: string | null
          tour_name?: string | null
          status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
          ticketmaster_url?: string | null
          view_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          artist_id?: string
          venue_id?: string
          ticketmaster_id?: string | null
          setlistfm_id?: string | null
          date?: string
          start_time?: string | null
          doors_time?: string | null
          title?: string | null
          tour_name?: string | null
          status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
          ticketmaster_url?: string | null
          view_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      songs: {
        Row: {
          id: string
          artist_id: string
          spotify_id: string | null
          musicbrainz_id: string | null
          title: string
          album: string | null
          album_image_url: string | null
          duration_ms: number | null
          popularity: number
          preview_url: string | null
          spotify_url: string | null
          audio_features: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
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
          audio_features?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          artist_id?: string
          spotify_id?: string | null
          musicbrainz_id?: string | null
          title?: string
          album?: string | null
          album_image_url?: string | null
          duration_ms?: number | null
          popularity?: number
          preview_url?: string | null
          spotify_url?: string | null
          audio_features?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      setlists: {
        Row: {
          id: string
          show_id: string
          name: string
          order_index: number
          is_encore: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          show_id: string
          name?: string
          order_index?: number
          is_encore?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          show_id?: string
          name?: string
          order_index?: number
          is_encore?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      setlist_songs: {
        Row: {
          id: string
          setlist_id: string
          song_id: string
          position: number
          vote_count: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          setlist_id: string
          song_id: string
          position: number
          vote_count?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          setlist_id?: string
          song_id?: string
          position?: number
          vote_count?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string | null
          display_name: string | null
          avatar_url: string | null
          spotify_id: string | null
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          display_name?: string | null
          avatar_url?: string | null
          spotify_id?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          display_name?: string | null
          avatar_url?: string | null
          spotify_id?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          user_id: string
          setlist_song_id: string
          show_id: string
          vote_type: 'up' | 'down'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          setlist_song_id: string
          show_id: string
          vote_type?: 'up' | 'down'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          setlist_song_id?: string
          show_id?: string
          vote_type?: 'up' | 'down'
          created_at?: string
        }
      }
      vote_analytics: {
        Row: {
          id: string
          user_id: string
          show_id: string
          daily_votes: number
          show_votes: number
          last_vote_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          show_id: string
          daily_votes?: number
          show_votes?: number
          last_vote_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          show_id?: string
          daily_votes?: number
          show_votes?: number
          last_vote_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sync_history: {
        Row: {
          id: string
          sync_type: 'setlistfm' | 'spotify' | 'ticketmaster'
          entity_type: 'artist' | 'show' | 'song' | 'setlist'
          entity_id: string | null
          external_id: string | null
          status: 'started' | 'completed' | 'failed'
          error_message: string | null
          items_processed: number
          started_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          sync_type: 'setlistfm' | 'spotify' | 'ticketmaster'
          entity_type: 'artist' | 'show' | 'song' | 'setlist'
          entity_id?: string | null
          external_id?: string | null
          status: 'started' | 'completed' | 'failed'
          error_message?: string | null
          items_processed?: number
          started_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          sync_type?: 'setlistfm' | 'spotify' | 'ticketmaster'
          entity_type?: 'artist' | 'show' | 'song' | 'setlist'
          entity_id?: string | null
          external_id?: string | null
          status?: 'started' | 'completed' | 'failed'
          error_message?: string | null
          items_processed?: number
          started_at?: string
          completed_at?: string | null
        }
      }
      trending_shows: {
        Row: {
          show_id: string
          artist_id: string
          venue_id: string
          show_date: string
          show_name: string | null
          show_status: string
          view_count: number
          total_votes: number
          unique_voters: number
          avg_votes_per_song: number
          trending_score: number
        }
      }
    }
    Views: {
      trending_shows: {
        Row: {
          show_id: string
          artist_id: string
          venue_id: string
          show_date: string
          show_name: string | null
          show_status: string
          view_count: number
          total_votes: number
          unique_voters: number
          avg_votes_per_song: number
          trending_score: number
        }
      }
    }
    Functions: {
      cast_vote: {
        Args: {
          p_user_id: string
          p_show_id: string
          p_song_id: string
          p_setlist_song_id: string
        }
        Returns: {
          success: boolean
          voteId: string
          dailyVotesRemaining: number
          showVotesRemaining: number
          newVoteCount: number
        }
      }
      refresh_materialized_view: {
        Args: {
          view_name: string
        }
        Returns: void
      }
    }
    Enums: {
      show_status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
      vote_type: 'up' | 'down'
      sync_type: 'setlistfm' | 'spotify' | 'ticketmaster'
      entity_type: 'artist' | 'show' | 'song' | 'setlist'
      sync_status: 'started' | 'completed' | 'failed'
    }
  }
}