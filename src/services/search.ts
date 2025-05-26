
import { supabase } from "@/integrations/supabase/client";
import * as spotifyService from "@/services/spotify";
import * as ticketmasterService from "@/services/ticketmaster";
import * as dataConsistency from "@/services/dataConsistency";

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

/**
 * MAIN SEARCH FUNCTION - searches both artists and shows
 * Uses the data consistency layer to ensure all results are properly stored
 */
export async function search(options: SearchOptions): Promise<SearchResult[]> {
  const { query, limit = 20 } = options;
  const results: SearchResult[] = [];

  try {
    console.log(`🔍 Unified search for: ${query}`);

    // Search artists (database + Spotify)
    const artistResults = await searchArtists(query, Math.floor(limit / 2));
    results.push(...artistResults);

    // Search shows (database + Ticketmaster)
    const showResults = await searchShows(query, Math.floor(limit / 2));
    results.push(...showResults);

    console.log(`✅ Found ${results.length} total search results for: ${query}`);
    return results.slice(0, limit);
  } catch (error) {
    console.error("❌ Search error:", error);
    return [];
  }
}

/**
 * ARTIST SEARCH - searches database first, then Spotify
 * Uses data consistency layer to ensure all artists are properly imported
 */
export async function searchArtists(query: string, limit: number = 20): Promise<SearchResult[]> {
  try {
    console.log(`🎵 Searching artists for: ${query}`);
    const results: SearchResult[] = [];

    // First search in database
    const { data: dbArtists, error: dbError } = await supabase
      .from('artists')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('popularity', { ascending: false })
      .limit(limit);

    if (dbError) {
      console.error("❌ Database search error:", dbError);
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

    // If we need more results, search Spotify and use data consistency layer
    if (results.length < limit) {
      const remainingLimit = limit - results.length;
      console.log(`🔍 Searching Spotify for additional results: ${remainingLimit} needed`);
      
      const spotifyArtists = await spotifyService.searchArtists(query);
      
      for (const artist of spotifyArtists.slice(0, remainingLimit)) {
        // Avoid duplicates
        if (!results.find(r => r.id === artist.id)) {
          // Use data consistency layer to ensure artist exists with complete data
          const ensuredArtist = await dataConsistency.ensureArtistExists({
            id: artist.id,
            name: artist.name
          });

          if (ensuredArtist) {
            results.push({
              id: ensuredArtist.id,
              type: 'artist',
              name: ensuredArtist.name,
              image_url: ensuredArtist.image_url,
              spotify_id: ensuredArtist.id
            });
          }
        }
      }
    }

    console.log(`✅ Found ${results.length} artist results for: ${query}`);
    return results.slice(0, limit);
  } catch (error) {
    console.error("❌ Error searching artists:", error);
    return [];
  }
}

/**
 * SHOW SEARCH - searches database first, then Ticketmaster
 * Uses data consistency layer to ensure all shows and related data are properly imported
 */
export async function searchShows(query: string, limit: number = 20): Promise<SearchResult[]> {
  try {
    console.log(`🎤 Searching shows for: ${query}`);
    const results: SearchResult[] = [];

    // First search in database
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
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true })
      .limit(Math.floor(limit / 2));

    if (dbError) {
      console.error("❌ Database shows search error:", dbError);
    }

    // Add database results that match the query
    if (dbShows) {
      for (const show of dbShows) {
        const venue = show.venues as any;
        const artist = show.artists as any;
        
        // Check if query matches artist name or show name
        const matchesArtist = artist?.name?.toLowerCase().includes(query.toLowerCase());
        const matchesShow = show.name?.toLowerCase().includes(query.toLowerCase());
        
        if (matchesArtist || matchesShow) {
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
    }

    // If we need more results, search Ticketmaster and use data consistency layer
    if (results.length < limit) {
      const remainingLimit = limit - results.length;
      console.log(`🔍 Searching Ticketmaster for additional results: ${remainingLimit} needed`);
      
      const events = await ticketmasterService.searchEvents(query);
      
      for (const event of events.slice(0, remainingLimit)) {
        if (event._embedded?.venues?.[0]) {
          const eventId = event.id;
          
          // Avoid duplicates
          if (!results.find(r => r.id === eventId)) {
            // Use data consistency layer to process the entire event
            const processed = await dataConsistency.processTicketmasterEvent(event);
            
            if (processed.artist && processed.venue && processed.show) {
              results.push({
                id: processed.show.id,
                type: 'show',
                name: processed.show.name || `${processed.artist.name} Concert`,
                date: processed.show.date,
                venue: processed.venue.name,
                location: `${processed.venue.city}, ${processed.venue.country}`,
                artist_name: processed.artist.name,
                ticketmaster_id: processed.show.id
              });
            }
          }
        }
      }
    }

    console.log(`✅ Found ${results.length} show results for: ${query}`);
    return results.slice(0, limit);
  } catch (error) {
    console.error("❌ Error searching shows:", error);
    return [];
  }
}

/**
 * Helper function to store search results (for caching)
 */
export async function storeSearchResults(results: SearchResult[]): Promise<void> {
  try {
    console.log(`💾 Caching ${results.length} search results`);
    
    for (const result of results) {
      if (result.type === 'artist' && result.spotify_id) {
        // Ensure artist exists with complete data
        await dataConsistency.ensureArtistExists({
          id: result.spotify_id,
          name: result.name
        });
      }
    }
    
    console.log(`✅ Successfully cached search results`);
  } catch (error) {
    console.error("❌ Error storing search results:", error);
  }
}
