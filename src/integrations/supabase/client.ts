
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

const supabaseUrl = 'https://ailrmwtahifvstpfhbgn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbHJtd3RhaGlmdnN0cGZoYmduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NTQ0NjEsImV4cCI6MjA2MzUzMDQ2MX0.WYKAEqCo8yJpnxa6S0_TQaSUm4SR1kKZlfXiwyvk2vw';

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Typed RPC function responses
interface IncrementShowViewsResponse {
  success: boolean;
  view_count?: number;
}

interface CreateSetlistResponse {
  setlist_id: string;
  songs_added: number;
}

interface VoteResponse {
  success: boolean;
  votes?: number;
  message?: string;
}

interface GetOrCreateSetlistResponse {
  id: string;
  show_id: string;
  created_at: string;
}

interface SongSimilarityMatch {
  id: string;
  name: string;
  similarity_score: number;
}

// Create a typed client with additional RPC functions
export const typedSupabase = supabase as typeof supabase & {
  rpc: {
    increment_show_views: (args: { show_id: string }) => Promise<{ data: IncrementShowViewsResponse | null; error: { message: string } | null }>;
    create_setlist_with_songs: (args: { p_show_id: string }) => Promise<{ data: CreateSetlistResponse[] | null; error: { message: string } | null }>;
    vote_for_song: (args: { setlist_song_id: string }) => Promise<{ data: VoteResponse | null; error: { message: string } | null }>;
    get_or_create_setlist: (args: { show_id: string }) => Promise<{ data: GetOrCreateSetlistResponse | null; error: { message: string } | null }>;
    match_song_similarity: (args: { p_artist_id: string; p_song_name: string; p_similarity_threshold: number }) => Promise<{ data: SongSimilarityMatch[] | null; error: { message: string } | null }>;
  };
};

// Export types for use in other modules
export type {
  IncrementShowViewsResponse,
  CreateSetlistResponse,
  VoteResponse,
  GetOrCreateSetlistResponse,
  SongSimilarityMatch
};
