
import { supabase } from "@/integrations/supabase/client";

// Spotify API endpoints
const SPOTIFY_API_BASE = "https://api.spotify.com/v1";
const SPOTIFY_CLIENT_ID = "2946864dc822469b9c672292ead45f43";
const SPOTIFY_CLIENT_SECRET = "feaf0fc901124b839b11e02f97d18a8d";

// Types for Spotify API responses
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
  };
  duration_ms: number;
  popularity: number;
  external_urls: { spotify: string };
}

// Get Spotify access token using client credentials flow
async function getAccessToken(): Promise<string | null> {
  try {
    // Encode client ID and secret
    const credentials = btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`);
    
    // Request access token
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${credentials}`
      },
      body: "grant_type=client_credentials"
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get Spotify access token: ${response.status}`);
    }
    
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Error getting Spotify access token:", error);
    return null;
  }
}

// Fetch artist from Spotify API
export async function getArtist(artistId: string): Promise<SpotifyArtist | null> {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error("Could not get access token");
    }
    
    const response = await fetch(`${SPOTIFY_API_BASE}/artists/${artistId}`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch artist: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching artist from Spotify:", error);
    return null;
  }
}

// Search for artist by name
export async function searchArtists(query: string): Promise<SpotifyArtist[]> {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error("Could not get access token");
    }
    
    const response = await fetch(`${SPOTIFY_API_BASE}/search?q=${encodeURIComponent(query)}&type=artist&limit=10`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to search artists: ${response.status}`);
    }
    
    const data = await response.json();
    return data.artists.items || [];
  } catch (error) {
    console.error("Error searching artists:", error);
    return [];
  }
}

// Get top tracks for an artist
export async function getArtistTopTracks(artistId: string): Promise<SpotifyTrack[]> {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error("Could not get access token");
    }
    
    const response = await fetch(`${SPOTIFY_API_BASE}/artists/${artistId}/top-tracks?market=US`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch top tracks: ${response.status}`);
    }
    
    const data = await response.json();
    return data.tracks || [];
  } catch (error) {
    console.error("Error fetching artist's top tracks:", error);
    return [];
  }
}

// Get user's top artists (requires user authentication)
export async function getUserTopArtists(): Promise<SpotifyArtist[]> {
  try {
    // This would normally be implemented with proper Spotify user auth
    // For now, we'll just return an empty array
    return [];
  } catch (error) {
    console.error("Error fetching user's top artists:", error);
    return [];
  }
}

// Store artist data in Supabase
export async function storeArtistInDatabase(artist: SpotifyArtist): Promise<boolean> {
  try {
    const { error } = await supabase.from('artists').upsert({
      id: artist.id,
      name: artist.name,
      image_url: artist.images?.[0]?.url || null,
      popularity: artist.popularity || 0,
      genres: artist.genres || [],
      spotify_url: artist.external_urls?.spotify || '',
      last_synced_at: new Date().toISOString()
    });
    
    if (error) {
      console.error("Error storing artist in database:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error storing artist in database:", error);
    return false;
  }
}

// Store tracks in Supabase
export async function storeTracksInDatabase(artistId: string, tracks: SpotifyTrack[]): Promise<boolean> {
  try {
    // Convert tracks to database format
    const songsToInsert = tracks.map(track => ({
      id: track.id,
      artist_id: artistId,
      name: track.name,
      album: track.album.name,
      duration_ms: track.duration_ms,
      popularity: track.popularity || 0,
      spotify_url: track.external_urls?.spotify || ''
    }));
    
    const { error } = await supabase.from('songs').upsert(songsToInsert);
    
    if (error) {
      console.error("Error storing tracks in database:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error storing tracks in database:", error);
    return false;
  }
}
