
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

    return data;
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

    return data || [];
  } catch (error) {
    console.error("Error searching artists:", error);
    return [];
  }
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
      const { data, error } = await supabase
        .from('artists')
        .insert({
          id: artistId,
          name: artistName,
          last_synced_at: new Date().toISOString()
        })
        .select()
        .single();

      if (!error && data) {
        return data;
      }
    }

    return null;
  } catch (error) {
    console.error("Error getting or creating artist:", error);
    return null;
  }
}

// Import artist from Ticketmaster event
export async function importArtistFromTicketmaster(event: ticketmasterService.TicketmasterEvent): Promise<string | null> {
  try {
    // Extract artist info from Ticketmaster event
    const attractions = event._embedded?.attractions || [];
    if (attractions.length === 0) {
      console.warn("No attractions found in Ticketmaster event");
      return null;
    }

    const attraction = attractions[0];
    const artistId = attraction.id;
    const artistName = attraction.name;

    // Check if artist already exists
    let artist = await getArtistById(artistId);
    if (artist) {
      return artistId;
    }

    // Try to find matching Spotify artist
    const spotifyArtists = await spotifyService.searchArtists(artistName);
    let spotifyArtist = null;

    if (spotifyArtists.length > 0) {
      // Use the first match - could be improved with better matching logic
      spotifyArtist = spotifyArtists[0];
    }

    // Create artist entry
    const artistData = {
      id: artistId,
      ticketmaster_id: artistId,
      name: artistName,
      image_url: null,
      popularity: 0,
      genres: [],
      spotify_url: spotifyArtist?.external_urls?.spotify || null,
      last_synced_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('artists')
      .insert(artistData);

    if (error) {
      console.error("Error storing Ticketmaster artist:", error);
      return null;
    }

    console.log(`Successfully imported artist from Ticketmaster: ${artistName}`);
    return artistId;
  } catch (error) {
    console.error("Error importing artist from Ticketmaster:", error);
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
