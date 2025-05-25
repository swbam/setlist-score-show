export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      artists: {
        Row: {
          genres: string[] | null
          id: string
          image_url: string | null
          last_synced_at: string
          name: string
          popularity: number | null
          spotify_url: string | null
          ticketmaster_id: string | null
        }
        Insert: {
          genres?: string[] | null
          id: string
          image_url?: string | null
          last_synced_at?: string
          name: string
          popularity?: number | null
          spotify_url?: string | null
          ticketmaster_id?: string | null
        }
        Update: {
          genres?: string[] | null
          id?: string
          image_url?: string | null
          last_synced_at?: string
          name?: string
          popularity?: number | null
          spotify_url?: string | null
          ticketmaster_id?: string | null
        }
        Relationships: []
      }
      played_setlist_songs: {
        Row: {
          id: string
          played_setlist_id: string
          position: number
          song_id: string
        }
        Insert: {
          id?: string
          played_setlist_id: string
          position: number
          song_id: string
        }
        Update: {
          id?: string
          played_setlist_id?: string
          position?: number
          song_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_played_setlist_songs_played_setlist_id"
            columns: ["played_setlist_id"]
            isOneToOne: false
            referencedRelation: "played_setlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_played_setlist_songs_song_id"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "played_setlist_songs_played_setlist_id_fkey"
            columns: ["played_setlist_id"]
            isOneToOne: false
            referencedRelation: "played_setlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "played_setlist_songs_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      played_setlists: {
        Row: {
          id: string
          imported_at: string
          played_date: string
          setlist_fm_id: string
          show_id: string
        }
        Insert: {
          id?: string
          imported_at?: string
          played_date: string
          setlist_fm_id: string
          show_id: string
        }
        Update: {
          id?: string
          imported_at?: string
          played_date?: string
          setlist_fm_id?: string
          show_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_played_setlists_show_id"
            columns: ["show_id"]
            isOneToOne: true
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "played_setlists_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: true
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      setlist_songs: {
        Row: {
          id: string
          position: number
          setlist_id: string
          song_id: string
          votes: number
        }
        Insert: {
          id?: string
          position: number
          setlist_id: string
          song_id: string
          votes?: number
        }
        Update: {
          id?: string
          position?: number
          setlist_id?: string
          song_id?: string
          votes?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_setlist_songs_setlist_id"
            columns: ["setlist_id"]
            isOneToOne: false
            referencedRelation: "setlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_setlist_songs_song_id"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "setlist_songs_setlist_id_fkey"
            columns: ["setlist_id"]
            isOneToOne: false
            referencedRelation: "setlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "setlist_songs_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      setlists: {
        Row: {
          created_at: string
          id: string
          show_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          show_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          show_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_setlists_show_id"
            columns: ["show_id"]
            isOneToOne: true
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "setlists_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: true
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      shows: {
        Row: {
          artist_id: string
          date: string
          id: string
          name: string | null
          start_time: string | null
          status: string
          ticketmaster_url: string | null
          venue_id: string
          view_count: number
        }
        Insert: {
          artist_id: string
          date: string
          id: string
          name?: string | null
          start_time?: string | null
          status?: string
          ticketmaster_url?: string | null
          venue_id: string
          view_count?: number
        }
        Update: {
          artist_id?: string
          date?: string
          id?: string
          name?: string | null
          start_time?: string | null
          status?: string
          ticketmaster_url?: string | null
          venue_id?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_shows_artist_id"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_shows_venue_id"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shows_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shows_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      songs: {
        Row: {
          album: string
          artist_id: string
          duration_ms: number
          id: string
          name: string
          popularity: number
          spotify_url: string
        }
        Insert: {
          album: string
          artist_id: string
          duration_ms: number
          id: string
          name: string
          popularity: number
          spotify_url: string
        }
        Update: {
          album?: string
          artist_id?: string
          duration_ms?: number
          id?: string
          name?: string
          popularity?: number
          spotify_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_songs_artist_id"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "songs_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      user_artists: {
        Row: {
          artist_id: string
          id: string
          rank: number
          user_id: string
        }
        Insert: {
          artist_id: string
          id?: string
          rank: number
          user_id: string
        }
        Update: {
          artist_id?: string
          id?: string
          rank?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_artists_artist_id"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user_artists_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_artists_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_artists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          email: string | null
          id: string
          spotify_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          email?: string | null
          id: string
          spotify_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          spotify_id?: string | null
        }
        Relationships: []
      }
      venues: {
        Row: {
          address: string | null
          city: string
          country: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          state: string | null
        }
        Insert: {
          address?: string | null
          city: string
          country: string
          id: string
          latitude?: number | null
          longitude?: number | null
          name: string
          state?: string | null
        }
        Update: {
          address?: string | null
          city?: string
          country?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          state?: string | null
        }
        Relationships: []
      }
      votes: {
        Row: {
          created_at: string
          id: string
          setlist_song_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          setlist_song_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          setlist_song_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_votes_setlist_song_id"
            columns: ["setlist_song_id"]
            isOneToOne: false
            referencedRelation: "setlist_songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_votes_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_setlist_song_id_fkey"
            columns: ["setlist_song_id"]
            isOneToOne: false
            referencedRelation: "setlist_songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_or_create_setlist: {
        Args: { show_id: string }
        Returns: string
      }
      match_song_similarity: {
        Args: {
          p_artist_id: string
          p_song_name: string
          p_similarity_threshold: number
        }
        Returns: {
          id: string
          name: string
          similarity: number
        }[]
      }
      vote_for_song: {
        Args: { setlist_song_id: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
