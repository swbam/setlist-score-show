import { supabase } from "@/integrations/supabase/client";
import { EnhancedSpotifyRateLimiter } from "./spotifyRateLimiterEnhanced";

// Spotify API endpoints
const SPOTIFY_API_BASE = "https://api.spotify.com/v1";
const SPOTIFY_CLIENT_ID = "2946864dc822469b9c672292ead45f43";
const SPOTIFY_CLIENT_SECRET = "feaf0fc901124b839b11e02f97d18a8d";

// Initialize the enhanced rate limiter
const rateLimiter = new EnhancedSpotifyRateLimiter();

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
    images?: { url: string; height: number; width: number }[];
  };
  artists?: Array<{
    id: string;
    name: string;
    external_urls?: { spotify: string };
  }>;
  duration_ms: number;
  popularity: number;
  external_urls: { spotify: string };
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  album_type: string;
  total_tracks: number;
  release_date: string;
  images: { url: string; height: number; width: number }[];
  external_urls: { spotify: string };
}

export interface SpotifyPaginatedResponse<T> {
  href: string;
  items: T[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
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
      console.error("Failed to get Spotify access token:", response.status);
      throw new Error(`Failed to get Spotify access token: ${response.status}`);
    }
    
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Error getting Spotify access token:", error);
    return null;
  }
}

// Helper function to make API calls to Spotify with rate limiting
async function spotifyApiCall<T>(endpoint: string): Promise<T | null> {
  return rateLimiter.enqueue(async () => {
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error("Could not get access token");
      }
      
      const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Spotify API error:", response.status, errorText);
        
        // Throw error with status for rate limiter to handle
        const error = new Error(`Failed to fetch from Spotify API: ${response.status}`);
        (error as any).status = response.status;
        throw error;
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching from Spotify API:", error);
      throw error; // Re-throw for rate limiter to handle
    }
  });
}

// Paginated API call helper that handles fetching all pages
async function fetchAllPages<T>(initialUrl: string): Promise<T[]> {
  let results: T[] = [];
  let nextUrl = initialUrl;
  
  try {
    while (nextUrl) {
      const endpoint = nextUrl.replace(SPOTIFY_API_BASE, "");
      const response = await spotifyApiCall<SpotifyPaginatedResponse<T>>(endpoint);
      
      if (!response) break;
      
      results = [...results, ...response.items];
      nextUrl = response.next ? response.next : "";
    }
    
    return results;
  } catch (error) {
    console.error("Error fetching paginated results:", error);
    return results;
  }
}

// Fetch artist from Spotify API
export async function getArtist(artistId: string): Promise<SpotifyArtist | null> {
  console.log("Fetching artist from Spotify:", artistId);
  return spotifyApiCall<SpotifyArtist>(`/artists/${artistId}`);
}

// Search for artist by name
export async function searchArtists(query: string): Promise<SpotifyArtist[]> {
  try {
    console.log("Searching Spotify for artists:", query);
    const response = await spotifyApiCall<{artists: SpotifyPaginatedResponse<SpotifyArtist>}>(
      `/search?q=${encodeURIComponent(query)}&type=artist&limit=10`
    );
    
    if (response?.artists?.items) {
      console.log("Found artists:", response.artists.items.length);
      return response.artists.items;
    }
    return [];
  } catch (error) {
    console.error("Error searching artists:", error);
    return [];
  }
}

// Get top tracks for an artist
export async function getArtistTopTracks(artistId: string): Promise<SpotifyTrack[]> {
  try {
    console.log("Fetching top tracks for artist:", artistId);
    const response = await spotifyApiCall<{tracks: SpotifyTrack[]}>(
      `/artists/${artistId}/top-tracks?market=US`
    );
    
    if (response?.tracks) {
      console.log("Found top tracks:", response.tracks.length);
      return response.tracks;
    }
    return [];
  } catch (error) {
    console.error("Error fetching artist's top tracks:", error);
    return [];
  }
}

// Get all albums for an artist
export async function getArtistAlbums(artistId: string): Promise<SpotifyAlbum[]> {
  try {
    console.log("Fetching albums for artist:", artistId);
    const albumsUrl = `/artists/${artistId}/albums?include_groups=album,single&market=US&limit=50`;
    const albums = await fetchAllPages<SpotifyAlbum>(SPOTIFY_API_BASE + albumsUrl);
    console.log("Found albums:", albums.length);
    return albums;
  } catch (error) {
    console.error("Error fetching artist's albums:", error);
    return [];
  }
}

// Get all artist albums (manual pagination)
export async function getAllArtistAlbums(artistId: string, accessToken: string) {
  const albums = [];
  let offset = 0;
  const limit = 50;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}/albums?` +
      `include_groups=album,single&limit=${limit}&offset=${offset}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) throw new Error('Failed to fetch albums');
    
    const data = await response.json();
    albums.push(...data.items);
    
    hasMore = data.next !== null;
    offset += limit;
  }

  return albums;
}

// Get tracks for a specific album (manual pagination)
export async function getAlbumTracks(albumId: string, accessToken: string) {
  const tracks = [];
  let offset = 0;
  const limit = 50;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `https://api.spotify.com/v1/albums/${albumId}/tracks?limit=${limit}&offset=${offset}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) throw new Error('Failed to fetch tracks');
    
    const data = await response.json();
    tracks.push(...data.items);
    
    hasMore = data.next !== null;
    offset += limit;
  }

  return tracks;
}

// Import full artist catalog (albums + tracks)
export async function importFullArtistCatalog(artistId: string) {
  const accessToken = await getSpotifyAccessToken();
  const albums = await getAllArtistAlbums(artistId, accessToken);
  const songs = [];

  for (const album of albums) {
    const tracks = await getAlbumTracks(album.id, accessToken);
    
    songs.push(...tracks.map(track => ({
      id: track.id,
      artist_id: artistId,
      name: track.name,
      album: album.name,
      duration_ms: track.duration_ms,
      popularity: 0, // Will be updated separately
      spotify_url: track.external_urls?.spotify || ''
    })));
  }

  // Batch insert songs
  const { error } = await supabase
    .from('songs')
    .upsert(songs, { 
      onConflict: 'id',
      ignoreDuplicates: true 
    });

  if (error) throw error;

  // Update artist sync timestamp
  await supabase
    .from('artists')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('id', artistId);

  return songs;
}

// Enhanced function to import full catalog with progress tracking
export async function importFullArtistCatalogWithProgress(
  artistId: string,
  onProgress?: (progress: { processed: number; total: number; currentAlbum?: string }) => void
): Promise<{ success: boolean; tracksImported: number; albumsProcessed: number }> {
  console.log(`Starting full catalog import for artist: ${artistId}`);
  
  try {
    // Get all albums first
    const albums = await getArtistAlbums(artistId);
    console.log(`Found ${albums.length} albums for artist ${artistId}`);
    
    if (albums.length === 0) {
      // Fall back to top tracks
      const topTracks = await getArtistTopTracks(artistId);
      const stored = await storeTracksInDatabase(artistId, topTracks);
      return {
        success: stored,
        tracksImported: topTracks.length,
        albumsProcessed: 0
      };
    }
    
    let allTracks: SpotifyTrack[] = [];
    let albumsProcessed = 0;
    
    // Process albums in smaller batches to avoid rate limits
    const batchSize = 3;
    for (let i = 0; i < albums.length; i += batchSize) {
      const albumBatch = albums.slice(i, i + batchSize);
      
      for (const album of albumBatch) {
        try {
          onProgress?.({
            processed: albumsProcessed,
            total: albums.length,
            currentAlbum: album.name
          });
          
          const albumTracks = await getAlbumTracks(album.id);
          allTracks.push(...albumTracks);
          albumsProcessed++;
          
          // Rate limiting between albums - increased to prevent 429 errors
          await new Promise(resolve => setTimeout(resolve, 250));
          
        } catch (error) {
          console.error(`Error processing album ${album.name}:`, error);
          albumsProcessed++;
        }
      }
      
      // Longer delay between batches to prevent rate limiting
      if (i + batchSize < albums.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Deduplicate tracks
    const uniqueTracks = Array.from(
      new Map(allTracks.map(track => [track.id, track])).values()
    );
    
    console.log(`Processed ${albumsProcessed} albums, found ${uniqueTracks.length} unique tracks`);
    
    // Store tracks in database
    const tracksStored = await storeTracksInDatabase(artistId, uniqueTracks);
    
    // Update artist sync status
    if (tracksStored) {
      await supabase
        .from('artists')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', artistId);
    }
    
    onProgress?.({
      processed: albumsProcessed,
      total: albums.length,
      currentAlbum: 'Complete'
    });
    
    return {
      success: tracksStored,
      tracksImported: uniqueTracks.length,
      albumsProcessed
    };
    
  } catch (error) {
    console.error(`Error in full catalog import for artist ${artistId}:`, error);
    return {
      success: false,
      tracksImported: 0,
      albumsProcessed: 0
    };
  }
}
