
import { supabase } from "@/integrations/supabase/client";
import * as spotifyService from "@/services/spotify";
import * as ticketmasterService from "@/services/ticketmaster";

export interface SearchOptions {
  query: string;
  location?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  sortBy?: 'relevance' | 'date' | 'popularity';
}

export interface SearchResult {
  id: string;
  type: 'artist' | 'show';
  name: string;
  image_url?: string;
  date?: string;
  venue?: string;
  location?: string;
  artist_name?: string;
  ticketmaster_id?: string;
  spotify_id?: string;
}

// Search for artists and shows
export async function search(options: SearchOptions): Promise<SearchResult[]> {
  const { query, limit = 20 } = options;
  const results: SearchResult[] = [];

  try {
    console.log(`Searching for: ${query}`);

    // Search artists from Spotify
    const artists = await spotifyService.searchArtists(query);
    
    for (const artist of artists.slice(0, Math.min(limit, 10))) {
      results.push({
        id: artist.id,
        type: 'artist',
        name: artist.name,
        image_url: artist.images?.[0]?.url,
        spotify_id: artist.id
      });
    }

    // Search shows from Ticketmaster
    const events = await ticketmasterService.searchEvents(query);
    
    for (const event of events.slice(0, Math.min(limit, 10))) {
      if (event._embedded?.venues?.[0]) {
        const venue = event._embedded.venues[0];
        results.push({
          id: event.id,
          type: 'show',
          name: event.name,
          date: event.dates.start.localDate,
          venue: venue.name,
          location: `${venue.city?.name || venue.city}, ${venue.country?.name || venue.country}`,
          artist_name: event.name.split(':')[0].trim(),
          ticketmaster_id: event.id
        });
      }
    }

    return results.slice(0, limit);
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}

// Search artists specifically
export async function searchArtists(query: string, limit: number = 20): Promise<SearchResult[]> {
  try {
    console.log(`Searching artists for: ${query}`);
    
    // First search in database
    const { data: dbArtists, error: dbError } = await supabase
      .from('artists')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(limit);

    if (dbError) {
      console.error("Database search error:", dbError);
    }

    const results: SearchResult[] = [];

    // Add database results
    if (dbArtists) {
      for (const artist of dbArtists) {
        results.push({
          id: artist.id,
          type: 'artist',
          name: artist.name,
          image_url: artist.image_url || undefined,
          spotify_id: artist.id
        });
      }
    }

    // If we need more results, search Spotify
    if (results.length < limit) {
      const remainingLimit = limit - results.length;
      const spotifyArtists = await spotifyService.searchArtists(query);
      
      for (const artist of spotifyArtists.slice(0, remainingLimit)) {
        // Avoid duplicates
        if (!results.find(r => r.id === artist.id)) {
          results.push({
            id: artist.id,
            type: 'artist',
            name: artist.name,
            image_url: artist.images?.[0]?.url,
            spotify_id: artist.id
          });
        }
      }
    }

    return results.slice(0, limit);
  } catch (error) {
    console.error("Error searching artists:", error);
    return [];
  }
}

// Search shows specifically
export async function searchShows(query: string, limit: number = 20): Promise<SearchResult[]> {
  try {
    console.log(`Searching shows for: ${query}`);
    
    const events = await ticketmasterService.searchEvents(query);
    const results: SearchResult[] = [];
    
    for (const event of events.slice(0, limit)) {
      if (event._embedded?.venues?.[0]) {
        const venue = event._embedded.venues[0];
        results.push({
          id: event.id,
          type: 'show',
          name: event.name,
          date: event.dates.start.localDate,
          venue: venue.name,
          location: `${venue.city?.name || venue.city}, ${venue.country?.name || venue.country}`,
          artist_name: event.name.split(':')[0].trim(),
          ticketmaster_id: event.id
        });
      }
    }

    return results;
  } catch (error) {
    console.error("Error searching shows:", error);
    return [];
  }
}

// Store search results in database for caching
export async function storeSearchResults(results: SearchResult[]): Promise<void> {
  try {
    console.log(`Storing ${results.length} search results`);
    
    for (const result of results) {
      if (result.type === 'artist') {
        // Store artist
        await spotifyService.storeArtistInDatabase({
          id: result.id,
          name: result.name,
          images: result.image_url ? [{ url: result.image_url, height: 300, width: 300 }] : [],
          popularity: 0,
          genres: [],
          external_urls: { spotify: '' }
        });
      }
    }
  } catch (error) {
    console.error("Error storing search results:", error);
  }
}
