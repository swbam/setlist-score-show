
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
    images?: { url: string; height: number; width: number }[];
  };
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

// Helper function to make API calls to Spotify
async function spotifyApiCall<T>(endpoint: string): Promise<T | null> {
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
      console.error("Spotify API error:", response.status, await response.text());
      throw new Error(`Failed to fetch from Spotify API: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching from Spotify API:", error);
    return null;
  }
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

// Get tracks for a specific album
export async function getAlbumTracks(albumId: string): Promise<SpotifyTrack[]> {
  try {
    console.log("Fetching tracks for album:", albumId);
    const tracksUrl = `/albums/${albumId}/tracks?market=US&limit=50`;
    const tracks = await fetchAllPages<SpotifyTrack>(SPOTIFY_API_BASE + tracksUrl);
    
    // Get full track details for each track to include popularity
    const fullTracks = await Promise.all(
      tracks.map(track => spotifyApiCall<SpotifyTrack>(`/tracks/${track.id}`))
    );
    
    return fullTracks.filter(track => track !== null) as SpotifyTrack[];
  } catch (error) {
    console.error("Error fetching album tracks:", error);
    return [];
  }
}

// Get all tracks for an artist across all their albums
export async function getArtistAllTracks(artistId: string): Promise<SpotifyTrack[]> {
  console.log("Fetching all tracks for artist:", artistId);
  
  try {
    // First get all albums
    const albums = await getArtistAlbums(artistId);
    console.log(`Found ${albums.length} albums for artist ${artistId}`);
    
    if (albums.length === 0) {
      // If no albums, try getting top tracks instead
      console.log("No albums found, falling back to top tracks");
      return await getArtistTopTracks(artistId);
    }
    
    // Then get all tracks for each album (limit to first 5 albums to avoid rate limits)
    const limitedAlbums = albums.slice(0, 5);
    const allTracksPromises = limitedAlbums.map(album => getAlbumTracks(album.id));
    const allTracksArrays = await Promise.all(allTracksPromises);
    
    // Flatten the array of arrays and deduplicate by track ID
    const allTracks = allTracksArrays.flat();
    const uniqueTracks = Array.from(
      new Map(allTracks.map(track => [track.id, track])).values()
    );
    
    console.log(`Found ${uniqueTracks.length} unique tracks for artist ${artistId}`);
    return uniqueTracks;
  } catch (error) {
    console.error("Error fetching all artist tracks:", error);
    // Fall back to top tracks if full catalog fetch fails
    console.log("Falling back to top tracks");
    return await getArtistTopTracks(artistId);
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
    console.log("Storing artist in database:", artist.name);
    
    const artistData = {
      id: artist.id,
      name: artist.name,
      image_url: artist.images?.[0]?.url || null,
      popularity: artist.popularity || 0,
      genres: artist.genres || [],
      spotify_url: artist.external_urls?.spotify || '',
      last_synced_at: new Date().toISOString()
    };
    
    console.log("Artist data to store:", artistData);
    
    const { error } = await supabase
      .from('artists')
      .upsert(artistData, { onConflict: 'id' });
    
    if (error) {
      console.error("Error storing artist in database:", error);
      return false;
    }
    
    console.log("Successfully stored artist:", artist.name);
    return true;
  } catch (error) {
    console.error("Error storing artist in database:", error);
    return false;
  }
}

// Store tracks in Supabase
export async function storeTracksInDatabase(artistId: string, tracks: SpotifyTrack[]): Promise<boolean> {
  try {
    console.log(`Storing ${tracks.length} tracks for artist ${artistId}`);
    
    // Convert tracks to database format
    const songsToInsert = tracks.map(track => ({
      id: track.id,
      artist_id: artistId,
      name: track.name,
      album: track.album?.name || 'Unknown Album',
      duration_ms: track.duration_ms || 0,
      popularity: track.popularity || 0,
      spotify_url: track.external_urls?.spotify || ''
    }));
    
    // Process in batches to avoid hitting request size limits
    const batchSize = 50;
    let successCount = 0;
    
    for (let i = 0; i < songsToInsert.length; i += batchSize) {
      const batch = songsToInsert.slice(i, i + batchSize);
      console.log(`Processing batch ${i}-${i+batch.length} for artist ${artistId}`);
      
      const { error } = await supabase
        .from('songs')
        .upsert(batch, { onConflict: 'id' });
      
      if (error) {
        console.error(`Error storing tracks batch ${i}-${i+batch.length} in database:`, error);
        continue;
      }
      
      successCount += batch.length;
      console.log(`Successfully stored tracks batch ${i}-${i+batch.length} for artist ${artistId}`);
    }
    
    console.log(`Successfully stored ${successCount} of ${tracks.length} tracks for artist ${artistId}`);
    return successCount > 0;
  } catch (error) {
    console.error("Error storing tracks in database:", error);
    return false;
  }
}

// Import the entire song catalog for an artist
export async function importArtistCatalog(artistId: string): Promise<boolean> {
  console.log(`Importing catalog for artist: ${artistId}`);
  
  try {
    // Check if we've already imported this artist's catalog recently
    const { data: artist, error: artistError } = await supabase
      .from('artists')
      .select('last_synced_at')
      .eq('id', artistId)
      .single();
    
    // If we have this artist and they were synced less than 7 days ago, skip
    if (artist && artist.last_synced_at) {
      const lastSynced = new Date(artist.last_synced_at);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      if (lastSynced > sevenDaysAgo) {
        console.log(`Artist ${artistId} was synced recently (${lastSynced.toISOString()}), skipping catalog import`);
        return true;
      }
    }
    
    if (artistError && artistError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error(`Error checking artist sync status: ${artistId}`, artistError);
    }
    
    // Get top tracks for the artist - simpler and more reliable than full catalog
    console.log("Getting top tracks for artist:", artistId);
    const tracks = await getArtistTopTracks(artistId);
    
    if (tracks.length === 0) {
      console.warn(`No tracks found for artist: ${artistId}`);
      
      // If no tracks found, try to update last_synced_at anyway
      await supabase
        .from('artists')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', artistId);
      
      return false;
    }
    
    // Store tracks in database
    const tracksStored = await storeTracksInDatabase(artistId, tracks);
    if (!tracksStored) {
      console.error(`Failed to store tracks for artist: ${artistId}`);
      return false;
    }
    
    // Update last_synced_at for the artist
    const { error: updateError } = await supabase
      .from('artists')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', artistId);
    
    if (updateError) {
      console.error(`Failed to update last_synced_at for artist: ${artistId}`, updateError);
    }
    
    console.log(`Successfully imported ${tracks.length} tracks for artist: ${artistId}`);
    return true;
  } catch (error) {
    console.error(`Error importing catalog for artist: ${artistId}`, error);
    return false;
  }
}
