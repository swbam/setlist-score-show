
import { supabase } from "@/integrations/supabase/client";
import * as dataConsistency from "@/services/dataConsistency";

export interface Artist {
  id: string;
  name: string;
  image_url?: string;
  popularity?: number;
  genres?: string[];
  spotify_url?: string;
  last_synced_at?: string;
  source?: 'database' | 'ticketmaster' | 'spotify';
}

export interface ArtistWithShows extends Artist {
  upcomingShowsCount?: number;
  nextShow?: {
    id: string;
    date: string;
    venue: string;
    city: string;
  };
}

/**
 * Get artist by ID using data consistency layer
 */
export async function getArtistById(artistId: string): Promise<Artist | null> {
  try {
    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .eq('id', artistId)
      .single();

    if (error) {
      console.error("❌ Error fetching artist:", error);
      return null;
    }

    return { ...data, source: 'database' };
  } catch (error) {
    console.error("❌ Error getting artist by ID:", error);
    return null;
  }
}

/**
 * Search artists in database
 */
export async function searchArtists(query: string, limit: number = 10): Promise<Artist[]> {
  try {
    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('popularity', { ascending: false })
      .limit(limit);

    if (error) {
      console.error("❌ Error searching artists:", error);
      return [];
    }

    return (data || []).map(artist => ({ ...artist, source: 'database' as const }));
  } catch (error) {
    console.error("❌ Error searching artists:", error);
    return [];
  }
}

/**
 * Fetch artists from database
 */
export async function fetchArtistsFromDatabase(limit: number = 50): Promise<Artist[]> {
  try {
    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .order('popularity', { ascending: false })
      .limit(limit);

    if (error) {
      console.error("❌ Error fetching artists from database:", error);
      return [];
    }

    return (data || []).map(artist => ({ ...artist, source: 'database' as const }));
  } catch (error) {
    console.error("❌ Error fetching artists from database:", error);
    return [];
  }
}

/**
 * Extract unique artists from Ticketmaster events
 */
export async function extractUniqueArtistsFromEvents(events: any[]): Promise<Artist[]> {
  const artistMap = new Map<string, Artist>();
  
  for (const event of events) {
    if (event._embedded?.attractions) {
      for (const attraction of event._embedded.attractions) {
        if (!artistMap.has(attraction.id)) {
          artistMap.set(attraction.id, {
            id: attraction.id,
            name: attraction.name,
            image_url: attraction.images?.[0]?.url,
            source: 'ticketmaster'
          });
        }
      }
    }
  }
  
  return Array.from(artistMap.values());
}

/**
 * Merge artists from different sources
 */
export function mergeArtists(ticketmasterArtists: Artist[], databaseArtists: Artist[]): Artist[] {
  const artistMap = new Map<string, Artist>();
  
  // Add database artists first (they have more complete data)
  databaseArtists.forEach(artist => {
    artistMap.set(artist.name.toLowerCase(), artist);
  });
  
  // Add Ticketmaster artists if not already present
  ticketmasterArtists.forEach(artist => {
    const key = artist.name.toLowerCase();
    if (!artistMap.has(key)) {
      artistMap.set(key, artist);
    }
  });
  
  return Array.from(artistMap.values());
}

/**
 * Sort search results by relevance
 */
export function sortSearchResults(artists: Artist[], query: string): Artist[] {
  return artists.sort((a, b) => {
    const aExact = a.name.toLowerCase() === query.toLowerCase();
    const bExact = b.name.toLowerCase() === query.toLowerCase();
    
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    
    const aStarts = a.name.toLowerCase().startsWith(query.toLowerCase());
    const bStarts = b.name.toLowerCase().startsWith(query.toLowerCase());
    
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    
    return (b.popularity || 0) - (a.popularity || 0);
  });
}

/**
 * Get artist's upcoming shows
 */
export async function getArtistUpcomingShows(artistId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('shows')
      .select(`
        id,
        name,
        date,
        start_time,
        ticketmaster_url,
        venues!shows_venue_id_fkey (
          id,
          name,
          city,
          state,
          country
        )
      `)
      .eq('artist_id', artistId)
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true });

    if (error) {
      console.error("❌ Error fetching artist shows:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("❌ Error getting artist upcoming shows:", error);
    return [];
  }
}

/**
 * Get or create artist using the data consistency layer
 * This is the main function to use when you need an artist with complete data
 */
export async function getOrCreateArtist(artistId: string, artistName?: string): Promise<Artist | null> {
  try {
    // First, try to get from database
    let artist = await getArtistById(artistId);
    
    if (artist) {
      return artist;
    }

    // If not found, use the data consistency layer to ensure artist exists
    console.log(`🔍 Artist ${artistId} not found in database, creating with complete data...`);
    
    const ensuredArtist = await dataConsistency.ensureArtistExists({
      id: artistId,
      name: artistName || 'Unknown Artist'
    });

    if (ensuredArtist) {
      return {
        id: ensuredArtist.id,
        name: ensuredArtist.name,
        image_url: ensuredArtist.image_url,
        popularity: ensuredArtist.popularity,
        genres: ensuredArtist.genres,
        spotify_url: ensuredArtist.spotify_url,
        source: 'database'
      };
    }

    return null;
  } catch (error) {
    console.error("❌ Error getting or creating artist:", error);
    return null;
  }
}

/**
 * Sync artist data using the data consistency layer
 */
export async function syncArtistData(artistId: string): Promise<boolean> {
  try {
    console.log(`🔄 Syncing data for artist: ${artistId}`);
    
    // Get current artist data
    const existingArtist = await getArtistById(artistId);
    if (!existingArtist) {
      console.error(`❌ Artist ${artistId} not found for sync`);
      return false;
    }

    // Use the data consistency layer to re-ensure the artist with fresh data
    const syncedArtist = await dataConsistency.ensureArtistExists({
      id: artistId,
      name: existingArtist.name
    });

    if (syncedArtist) {
      console.log(`✅ Successfully synced artist data for: ${artistId}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error("❌ Error syncing artist data:", error);
    return false;
  }
}

/**
 * Search for artist by name and create if found on Spotify
 */
export async function findOrCreateArtistByName(artistName: string): Promise<Artist | null> {
  return await dataConsistency.findOrCreateArtistByName(artistName);
}
