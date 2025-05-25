
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

// Unified search for artists and shows
export async function search(options: SearchOptions): Promise<SearchResult[]> {
  const { query, limit = 20 } = options;
  const results: SearchResult[] = [];

  try {
    console.log(`Unified search for: ${query}`);

    // Search artists from database first, then Spotify
    const artistResults = await searchArtists(query, Math.floor(limit / 2));
    results.push(...artistResults);

    // Search shows from database and Ticketmaster
    const showResults = await searchShows(query, Math.floor(limit / 2));
    results.push(...showResults);

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
    const results: SearchResult[] = [];

    // First search in database
    const { data: dbArtists, error: dbError } = await supabase
      .from('artists')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(limit);

    if (dbError) {
      console.error("Database search error:", dbError);
    }

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

          // Store new artists in database for future searches
          await spotifyService.storeArtistInDatabase(artist);
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
    const results: SearchResult[] = [];

    // First search in database with explicit relationship names
    const { data: dbShows, error: dbError } = await supabase
      .from('shows')
      .select(`
        *,
        artists!shows_artist_id_fkey (
          id,
          name,
          image_url
        ),
        venues!shows_venue_id_fkey (
          id,
          name,
          city,
          state,
          country
        )
      `)
      .or(`name.ilike.%${query}%,artists.name.ilike.%${query}%`)
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true })
      .limit(Math.floor(limit / 2));

    if (dbError) {
      console.error("Database shows search error:", dbError);
    }

    // Add database results
    if (dbShows) {
      for (const show of dbShows) {
        const venue = show.venues as any;
        const artist = show.artists as any;
        
        results.push({
          id: show.id,
          type: 'show',
          name: show.name || `${artist?.name} Concert`,
          date: show.date,
          venue: venue?.name,
          location: `${venue?.city || ''}, ${venue?.country || ''}`,
          artist_name: artist?.name,
          ticketmaster_id: show.id
        });
      }
    }

    // If we need more results, search Ticketmaster
    if (results.length < limit) {
      const remainingLimit = limit - results.length;
      const events = await ticketmasterService.searchEvents(query);
      
      for (const event of events.slice(0, remainingLimit)) {
        if (event._embedded?.venues?.[0]) {
          const venue = event._embedded.venues[0];
          const eventId = event.id;
          
          // Avoid duplicates
          if (!results.find(r => r.id === eventId)) {
            results.push({
              id: eventId,
              type: 'show',
              name: event.name,
              date: event.dates.start.localDate,
              venue: venue.name,
              location: `${venue.city?.name || venue.city}, ${venue.country?.name || venue.country}`,
              artist_name: event.name.split(':')[0].trim(),
              ticketmaster_id: eventId
            });

            // Store new shows in database for future searches
            try {
              await ticketmasterService.storeVenueInDatabase(venue);
              
              // Try to find or create artist
              const artistName = event.name.split(':')[0].trim();
              const spotifyArtists = await spotifyService.searchArtists(artistName);
              if (spotifyArtists.length > 0) {
                const artist = spotifyArtists[0];
                await spotifyService.storeArtistInDatabase(artist);
                await ticketmasterService.storeShowInDatabase(event, artist.id, venue.id);
              }
            } catch (storeError) {
              console.error("Error storing show data:", storeError);
            }
          }
        }
      }
    }

    return results.slice(0, limit);
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
      if (result.type === 'artist' && result.spotify_id) {
        // Store artist if not already stored
        const artist = await spotifyService.getArtist(result.spotify_id);
        if (artist) {
          await spotifyService.storeArtistInDatabase(artist);
        }
      }
    }
  } catch (error) {
    console.error("Error storing search results:", error);
  }
}
