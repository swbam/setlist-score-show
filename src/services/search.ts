
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

export interface Artist {
  id: string;
  name: string;
  image_url?: string;
  source?: string;
}

export interface Show {
  id: string;
  artist_id: string;
  venue_id: string;
  name: string;
  date: string;
  start_time?: string | null;
  status: string;
  ticketmaster_url?: string | null;
  view_count: number;
  artist: {
    id: string;
    name: string;
    image_url?: string;
  };
  venue: {
    id: string;
    name: string;
    city: string;
    state?: string | null;
    country: string;
  };
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
          
          // Store artist in background for future searches
          artistUtils.ensureArtistInDatabase({
            id: artist.id,
            name: artist.name,
            image_url: artist.images?.[0]?.url,
            genres: artist.genres,
            popularity: artist.popularity,
            spotify_url: artist.external_urls?.spotify
          }).catch(console.error);
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
          
          // Store event in database in background
          if (artist && venue) {
            const artistData = {
              id: artist.id,
              name: artist.name,
              image_url: artist.images?.[0]?.url
            };
            
            // Store artist and show in background
            artistUtils.ensureArtistInDatabase(artistData)
              .then(savedArtist => {
                // Store venue
                ticketmasterService.storeVenueInDatabase(venue)
                  .then(() => {
                    // Store show
                    ticketmasterService.storeShowInDatabase(event, savedArtist.id, venue.id);
                  })
                  .catch(console.error);
              })
              .catch(console.error);
          }
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
        artist:artists!shows_artist_id_fkey(*),
        venue:venues!shows_venue_id_fkey(*)
      `);
    
    // Apply date range filters if provided
    if (dateFrom) {
      dbQuery = dbQuery.gte('date', dateFrom.toISOString());
    }
    
    if (dateTo) {
      dbQuery = dbQuery.lte('date', dateTo.toISOString());
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
 * Search for artists with shows
 */
export async function searchArtistsWithShows(query: string): Promise<Artist[]> {
  try {
    console.log(`Searching for artists with shows: ${query}`);
    
    // Search Ticketmaster for events
    const events = await ticketmasterService.searchEvents(query);
    console.log(`Found ${events.length} events matching "${query}"`);
    
    const artistMap = new Map<string, Artist>();
    
    // Process each event to extract unique artists
    for (const event of events) {
      if (!event._embedded?.attractions) continue;
      
      for (const attraction of event._embedded.attractions) {
        if (!artistMap.has(attraction.id)) {
          // Create artist data object
          const artistData = {
            id: attraction.id,
            name: attraction.name,
            image_url: attraction.images?.[0]?.url,
            ticketmaster_id: attraction.id
          };
          
          // Ensure artist exists in database
          await artistUtils.ensureArtistInDatabase(artistData);
          
          artistMap.set(attraction.id, {
            id: attraction.id,
            name: attraction.name,
            image_url: attraction.images?.[0]?.url,
            source: 'ticketmaster'
          });
        }
      }
    }
    
    return Array.from(artistMap.values());
  } catch (error) {
    console.error("Error searching artists with shows:", error);
    return [];
  }
}

/**
 * Search for shows
 */
export async function searchShows(query: string): Promise<Show[]> {
  try {
    console.log(`Searching for shows: ${query}`);
    
    // Search Ticketmaster for events
    const events = await ticketmasterService.searchEvents(query);
    console.log(`Found ${events.length} events matching "${query}"`);
    
    const shows: Show[] = [];
    
    // Process each event
    for (const event of events) {
      if (!event._embedded?.attractions?.[0] || !event._embedded?.venues?.[0]) {
        continue;
      }
      
      const artist = event._embedded.attractions[0];
      const venue = event._embedded.venues[0];
      
      // Store venue in database
      await ticketmasterService.storeVenueInDatabase(venue);
      
      // Create artist data object
      const artistData = {
        id: artist.id,
        name: artist.name,
        image_url: artist.images?.[0]?.url,
        ticketmaster_id: artist.id
      };
      
      // Ensure artist exists in database
      const artistStored = await artistUtils.ensureArtistInDatabase(artistData);
      
      if (artistStored) {
        // Store show in database
        await ticketmasterService.storeShowInDatabase(event, artist.id, venue.id);
        
        // Add to results
        shows.push({
          id: event.id,
          artist_id: artist.id,
          venue_id: venue.id,
          name: event.name,
          date: event.dates?.start?.dateTime || event.dates?.start?.localDate || '',
          start_time: event.dates?.start?.localTime || null,
          status: event.dates?.status?.code === 'cancelled' ? 'canceled' : 
                 event.dates?.status?.code === 'postponed' ? 'postponed' : 'scheduled',
          ticketmaster_url: event.url || null,
          view_count: 0,
          artist: {
            id: artist.id,
            name: artist.name,
            image_url: artist.images?.[0]?.url
          },
          venue: {
            id: venue.id,
            name: venue.name,
            city: typeof venue.city === 'object' ? venue.city?.name : venue.city || '',
            state: typeof venue.state === 'object' ? venue.state?.name : venue.state || null,
            country: typeof venue.country === 'object' ? venue.country?.name : venue.country || ''
          }
        });
      }
    }
    
    console.log(`Processed ${shows.length} shows from search results`);
    return shows;
  } catch (error) {
    console.error("Error searching shows:", error);
    return [];
  }
}
