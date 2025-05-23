
import { supabase } from "@/integrations/supabase/client";
import * as spotifyService from "@/services/spotify";
import * as ticketmasterService from "@/services/ticketmaster";
import * as artistUtils from "@/utils/artistUtils";

// Types for search results
export interface SearchResult {
  type: 'artist' | 'show';
  id: string;
  name: string;
  image_url?: string;
  date?: string;
  venue?: string;
  location?: string;
  artist_name?: string;
  score: number; // Search relevance score
}

export interface SearchOptions {
  query?: string;
  location?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  sortBy?: 'relevance' | 'date' | 'name';
}

/**
 * Perform a unified search across artists and shows
 */
export async function search(options: SearchOptions): Promise<SearchResult[]> {
  const { query, location, dateFrom, dateTo, limit = 20, sortBy = 'relevance' } = options;
  const results: SearchResult[] = [];
  
  if (!query && !location && !dateFrom && !dateTo) {
    return [];
  }
  
  try {
    // Search for artists if query is provided
    if (query) {
      // First search in our database
      const dbArtists = await searchArtistsInDatabase(query);
      
      // Then fetch from Spotify API
      const spotifyArtists = await spotifyService.searchArtists(query);
      
      // Remove duplicates (prefer database entries)
      const dbArtistsMap = new Map(dbArtists.map(artist => [artist.name.toLowerCase(), artist]));
      
      // Add database artists to results
      dbArtists.forEach(artist => {
        results.push({
          type: 'artist',
          id: artist.id,
          name: artist.name,
          image_url: artist.image_url,
          score: calculateRelevanceScore(artist.name, query, 'database')
        });
      });
      
      // Add Spotify artists (that aren't already in our DB)
      spotifyArtists.forEach(artist => {
        const lowerName = artist.name.toLowerCase();
        if (!dbArtistsMap.has(lowerName)) {
          results.push({
            type: 'artist',
            id: artist.id,
            name: artist.name,
            image_url: artist.images?.[0]?.url,
            score: calculateRelevanceScore(artist.name, query, 'spotify')
          });
        }
      });
    }
    
    // Search for shows
    let showResults: SearchResult[] = [];
    
    if (query) {
      // Search by artist name
      const dbShows = await searchShowsInDatabase(query, location, dateFrom, dateTo);
      
      // Add shows to results
      dbShows.forEach(show => {
        showResults.push({
          type: 'show',
          id: show.id,
          name: show.name || `${show.artist.name} Concert`,
          image_url: show.artist?.image_url,
          date: show.date,
          venue: show.venue?.name,
          location: `${show.venue?.city}${show.venue?.state ? `, ${show.venue.state}` : ''}`,
          artist_name: show.artist?.name,
          score: calculateRelevanceScore(show.artist?.name || '', query, 'database')
        });
      });
      
      // If we have few results, search Ticketmaster API as well
      if (showResults.length < 5) {
        const events = await ticketmasterService.searchEvents(query);
        
        const addedShows = new Set<string>(showResults.map(s => s.id));
        
        events.forEach(event => {
          if (addedShows.has(event.id)) return;
          
          const venue = event._embedded?.venues?.[0];
          const artist = event._embedded?.attractions?.[0];
          const dateTime = event.dates?.start?.dateTime;
          
          // Filter by date if specified
          if (dateFrom && dateTime && new Date(dateTime) < dateFrom) return;
          if (dateTo && dateTime && new Date(dateTime) > dateTo) return;
          
          // Filter by location if specified
          if (location && venue && !venue.city?.name.toLowerCase().includes(location.toLowerCase()) && 
              !venue.state?.name.toLowerCase().includes(location.toLowerCase()) && 
              !venue.country?.name.toLowerCase().includes(location.toLowerCase())) {
            return;
          }
          
          showResults.push({
            type: 'show',
            id: event.id,
            name: event.name,
            image_url: artist?.images?.[0]?.url || event.images?.[0]?.url,
            date: dateTime,
            venue: venue?.name,
            location: `${venue?.city?.name}${venue?.state?.name ? `, ${venue.state.name}` : ''}`,
            artist_name: artist?.name || 'Various Artists',
            score: calculateRelevanceScore(artist?.name || event.name, query, 'ticketmaster')
          });
          
          addedShows.add(event.id);
        });
      }
    }
    else if (location || dateFrom || dateTo) {
      // Search by location and/or date only
      const dbShows = await searchShowsInDatabase('', location, dateFrom, dateTo);
      
      // Add shows to results
      dbShows.forEach(show => {
        showResults.push({
          type: 'show',
          id: show.id,
          name: show.name || `${show.artist.name} Concert`,
          image_url: show.artist?.image_url,
          date: show.date,
          venue: show.venue?.name,
          location: `${show.venue?.city}${show.venue?.state ? `, ${show.venue.state}` : ''}`,
          artist_name: show.artist?.name,
          score: 100 // Direct matches get high score
        });
      });
    }
    
    // Add shows to results
    results.push(...showResults);
    
    // Sort results based on the specified criteria
    return sortResults(results, sortBy, query).slice(0, limit);
  } catch (error) {
    console.error("Error performing search:", error);
    return [];
  }
}

/**
 * Search for artists in database
 */
async function searchArtistsInDatabase(query: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('artists')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('popularity', { ascending: false })
      .limit(10);
      
    if (error) {
      console.error("Database search error:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error searching artists in database:", error);
    return [];
  }
}

/**
 * Search for shows in database with filters
 */
async function searchShowsInDatabase(
  query: string,
  location?: string,
  dateFrom?: Date,
  dateTo?: Date
): Promise<any[]> {
  try {
    // Start building query
    let dbQuery = supabase
      .from('shows')
      .select(`
        *,
        artist:artists(*),
        venue:venues(*)
      `);
    
    // Apply artist name filter if query provided
    if (query) {
      dbQuery = dbQuery.textSearch('artist:artists(name)', query, {
        type: 'websearch',
        config: 'english'
      });
    }
    
    // Apply date range filters if provided
    if (dateFrom) {
      dbQuery = dbQuery.gte('date', dateFrom.toISOString());
    }
    
    if (dateTo) {
      dbQuery = dbQuery.lte('date', dateTo.toISOString());
    }
    
    // Apply location filter if provided
    if (location) {
      dbQuery = dbQuery.filter('venue:venues.city', 'ilike', `%${location}%`);
    }
    
    // Execute query
    const { data, error } = await dbQuery
      .order('date', { ascending: true })
      .limit(20);
      
    if (error) {
      console.error("Database search error:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error searching shows in database:", error);
    return [];
  }
}

/**
 * Calculate relevance score for search results
 */
function calculateRelevanceScore(name: string, query: string, source: 'database' | 'spotify' | 'ticketmaster'): number {
  // Base score depending on source
  let score = source === 'database' ? 100 : 
              source === 'spotify' ? 80 : 60;
  
  if (!query || !name) return score;
  
  const nameLower = name.toLowerCase();
  const queryLower = query.toLowerCase();
  
  // Boost score for exact matches
  if (nameLower === queryLower) {
    score += 100;
  }
  // Boost for starts with
  else if (nameLower.startsWith(queryLower)) {
    score += 50;
  }
  // Boost for contains
  else if (nameLower.includes(queryLower)) {
    score += 30;
  }
  
  return score;
}

/**
 * Sort search results based on specified criteria
 */
function sortResults(results: SearchResult[], sortBy: string, query?: string): SearchResult[] {
  if (sortBy === 'date') {
    return results.sort((a, b) => {
      // Shows with dates first
      if (a.date && !b.date) return -1;
      if (!a.date && b.date) return 1;
      if (a.date && b.date) {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      return b.score - a.score; // Fall back to relevance
    });
  }
  
  if (sortBy === 'name') {
    return results.sort((a, b) => a.name.localeCompare(b.name));
  }
  
  // Default: relevance sorting
  return results.sort((a, b) => {
    const scoreDiff = b.score - a.score;
    
    // If scores are equal, try to prioritize shows with upcoming dates
    if (scoreDiff === 0) {
      if (a.date && b.date) {
        const now = new Date();
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        
        // Prioritize upcoming shows over past shows
        const aIsUpcoming = dateA >= now;
        const bIsUpcoming = dateB >= now;
        
        if (aIsUpcoming && !bIsUpcoming) return -1;
        if (!aIsUpcoming && bIsUpcoming) return 1;
        
        // For two upcoming or two past shows, closer date is better
        if (aIsUpcoming) {
          return dateA.getTime() - dateB.getTime(); // Sooner is better for upcoming
        } else {
          return dateB.getTime() - dateA.getTime(); // More recent is better for past
        }
      }
      
      // If no dates available, artists before shows
      if (a.type === 'artist' && b.type === 'show') return -1;
      if (a.type === 'show' && b.type === 'artist') return 1;
    }
    
    return scoreDiff;
  });
}

/**
 * Store search results in database
 * This helps build up our local database over time
 */
export async function storeSearchResults(results: SearchResult[]): Promise<void> {
  for (const result of results) {
    if (result.type === 'artist') {
      // Store artist
      const artist = {
        id: result.id,
        name: result.name,
        image_url: result.image_url,
        source: 'search' as any
      };
      
      // Use existing utility to store and enrich artist data
      await artistUtils.ensureArtistInDatabase(artist, true);
    }
    else if (result.type === 'show' && result.artist_name) {
      // For shows, we need to get more details from Ticketmaster
      try {
        const events = await ticketmasterService.searchEvents(result.name);
        const event = events.find(e => e.id === result.id);
        
        if (event && event._embedded?.venues?.[0]) {
          const venue = event._embedded.venues[0];
          
          // Store venue
          await ticketmasterService.storeVenueInDatabase(venue);
          
          // Look up artist by name if no attraction
          const attraction = event._embedded?.attractions?.[0];
          let artistId = attraction?.id;
          
          if (!artistId) {
            const { data: artistData } = await supabase
              .from('artists')
              .select('id')
              .eq('name', result.artist_name)
              .maybeSingle();
            
            artistId = artistData?.id;
            
            if (!artistId) {
              // As a last resort, search Spotify
              const spotifyArtists = await spotifyService.searchArtists(result.artist_name);
              if (spotifyArtists.length > 0) {
                artistId = spotifyArtists[0].id;
              }
            }
          }
          
          if (artistId) {
            // Store show
            await ticketmasterService.storeShowInDatabase(event, artistId, venue.id);
          }
        }
      } catch (error) {
        console.error(`Error storing show result: ${result.id}`, error);
      }
    }
  }
}
