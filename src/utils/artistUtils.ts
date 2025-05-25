
import { supabase } from "@/integrations/supabase/client";
import * as spotifyService from "@/services/spotify";
import * as ticketmasterService from "@/services/ticketmaster";

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

// Get artist by ID from database
export async function getArtistById(artistId: string): Promise<Artist | null> {
  try {
    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .eq('id', artistId)
      .single();

    if (error) {
      console.error("Error fetching artist:", error);
      return null;
    }

    return { ...data, source: 'database' };
  } catch (error) {
    console.error("Error getting artist by ID:", error);
    return null;
  }
}

// Search artists in database
export async function searchArtists(query: string, limit: number = 10): Promise<Artist[]> {
  try {
    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(limit);

    if (error) {
      console.error("Error searching artists:", error);
      return [];
    }

    return (data || []).map(artist => ({ ...artist, source: 'database' as const }));
  } catch (error) {
    console.error("Error searching artists:", error);
    return [];
  }
}

// Fetch artists from database
export async function fetchArtistsFromDatabase(limit: number = 50): Promise<Artist[]> {
  try {
    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .order('popularity', { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching artists from database:", error);
      return [];
    }

    return (data || []).map(artist => ({ ...artist, source: 'database' as const }));
  } catch (error) {
    console.error("Error fetching artists from database:", error);
    return [];
  }
}

// Search artists from database
export async function searchArtistsFromDatabase(query: string, limit: number = 20): Promise<Artist[]> {
  return await searchArtists(query, limit);
}

// Extract unique artists from Ticketmaster events
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

// Merge artists from different sources
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

// Sort search results by relevance
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

// Get artist's upcoming shows
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
      console.error("Error fetching artist shows:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error getting artist upcoming shows:", error);
    return [];
  }
}

// Ensure artist exists in database (create if needed)
export async function ensureArtistInDatabase(artistData: {
  id: string;
  name: string;
  image_url?: string;
  ticketmaster_id?: string;
  spotify_id?: string;
}): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('artists')
      .upsert({
        id: artistData.id,
        name: artistData.name,
        image_url: artistData.image_url,
        ticketmaster_id: artistData.ticketmaster_id,
        last_synced_at: new Date().toISOString()
      });

    if (error) {
      console.error("Error ensuring artist in database:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error ensuring artist in database:", error);
    return false;
  }
}

// Get or create artist from multiple sources
export async function getOrCreateArtist(artistId: string, artistName?: string): Promise<Artist | null> {
  try {
    // First, try to get from database
    let artist = await getArtistById(artistId);
    
    if (artist) {
      return artist;
    }

    // If not found, try to import from Spotify
    console.log(`Artist ${artistId} not found in database, importing from Spotify...`);
    
    const spotifyArtist = await spotifyService.getArtist(artistId);
    if (spotifyArtist) {
      const stored = await spotifyService.storeArtistInDatabase(spotifyArtist);
      if (stored) {
        artist = await getArtistById(artistId);
        if (artist) {
          // Also import their top tracks
          await spotifyService.importArtistCatalog(artistId);
          return artist;
        }
      }
    }

    // If Spotify fails and we have a name, create a basic entry
    if (artistName) {
      const success = await ensureArtistInDatabase({
        id: artistId,
        name: artistName
      });

      if (success) {
        return await getArtistById(artistId);
      }
    }

    return null;
  } catch (error) {
    console.error("Error getting or creating artist:", error);
    return null;
  }
}

// Sync artist data with external APIs
export async function syncArtistData(artistId: string): Promise<boolean> {
  try {
    console.log(`Syncing data for artist: ${artistId}`);
    
    // Update from Spotify if possible
    const spotifyArtist = await spotifyService.getArtist(artistId);
    if (spotifyArtist) {
      const stored = await spotifyService.storeArtistInDatabase(spotifyArtist);
      if (stored) {
        // Also sync their catalog
        await spotifyService.importArtistCatalog(artistId);
        console.log(`Successfully synced artist data for: ${artistId}`);
        return true;
      }
    }

    // Update last synced timestamp even if Spotify sync fails
    const { error } = await supabase
      .from('artists')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', artistId);

    if (error) {
      console.error("Error updating last_synced_at:", error);
    }

    return false;
  } catch (error) {
    console.error("Error syncing artist data:", error);
    return false;
  }
}
